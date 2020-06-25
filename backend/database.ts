import * as sqlite from 'sqlite3';
import {hashPassword} from './security'
import {Question, Score, QuestionPacked, QuizRules} from './models'

sqlite.verbose();
const allowed_operations : Set<string> = new Set(['+', '-', '*', '/']);

function randomRange(min : number, max : number) : number {
  return Math.floor(Math.random() * (max - min) + min);
}

function getSimilar(num : number, range : number) : number {
  let random = Math.floor(Math.random() * range);
  const sign = Math.floor(Math.random() - 0.5);
  if (sign === 0)
    random = -random;
  return num + random;
}


function openNamedDatabase(name : string) : sqlite.Database {
  let db = new sqlite.Database(name);
  db.run("PRAGMA busy_timeout = 10000");
  return db;
}

export function openDatabase() : sqlite.Database {
  return openNamedDatabase('quiz.db');
}

function openSessionDatabase() : sqlite.Database {
  return openNamedDatabase('sessions');
}

function sleep(ms : number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function dbRun(db : sqlite.Database, query: string, params : any[]) : Promise<void> {
  return new Promise((res, rej) => {
    db.run(query, params, (err) => {
      if (err) rej(err);
      else res();
    })
  })
}

function dbBegin(db : sqlite.Database) : Promise<void> {
  return dbRun(db, "BEGIN", []);
}

function dbEnd(db : sqlite.Database) : Promise<void> {
  return dbRun(db, "END", []);
}

function dbClose(db : sqlite.Database) : Promise<void> {
  return new Promise((res, rej) => {
    db.close((err) => {
      if (err) rej(err);
      else res();
    })
  })
}

export function addQuizSchema(quiz : QuizRules, db : sqlite.Database) {
  db.run(`INSERT INTO templates (
    name,
    description,
    question_count,
    operations,
    range,
    penalty,
    min_length,
    max_length,
    min_product,
    max_product
    ) VALUES (?,?,?,?,?,?,?,?,?,?)`, [
    quiz.name,
    quiz.description,
    quiz.question_count,
    quiz.signs,
    quiz.range,
    quiz.penalty,
    quiz.min_length,
    quiz.max_length,
    quiz.min_product,
    quiz.max_product,
    ]);
}

export function allQuizes() : Promise<[number, string][]> {
  return new Promise((res, rej) => {
    let db = openDatabase();
    db.all('SELECT id, name FROM templates',[],(err, rows) => {
      if (err) rej(err);
      else res(rows);
    })
    db.close();
  })
}

export function getQuizRules(id : number) : Promise<QuizRules> {
  return new Promise((res, rej) => {
    let db = openDatabase();
    db.get(`SELECT
      question_count,
      min_product,
      max_product,
      min_length,
      max_length,
      description,
      penalty,
      range,
      operations as signs,
      name
      FROM templates WHERE id = ?`, id, (err, row) => {
      if (err) rej(err);
      else res(row)
    });
    db.close();
  });
}

export function getBestScores(quiz_id: number) : Promise<Score[]> {
  return new Promise((res, rej) => {
    let db = openDatabase();
    db.all(`SELECT scoreboard.date as date, users.username as user, scoreboard.score as points, scoreboard.time as time FROM
      scoreboard JOIN users ON scoreboard.user_id = users.id
      WHERE scoreboard.quiz_id = ? AND scoreboard.status = "finished"
      ORDER BY scoreboard.score ASC LIMIT 5
      `, quiz_id, (err, rows) => {
        console.log(rows);
        if (err) rej(err);
        else res(rows);
      });
    db.close();
  })
}

export function addQuiz(quiz: QuizRules) {
  let db = openDatabase();
  addQuizSchema(quiz, db);
  db.close();
}

export function login(username: string, password: string) : Promise<number> {
  return new Promise((res, rej) => {
    let db = openDatabase();
    const hashed = hashPassword(password);
    db.get(`SELECT id FROM 'users' WHERE username = ? AND hashed_pass = ?`,
        [username, hashed],
        (err : any, row : any) => {
      if (!err && !!row) {
        res(row.id);
      } else {
        res(0);
      }
      db.close();
    })
  })
}

export function changePassword(user_id : number, password: string) : Promise<void> {
  return new Promise((res, rej) => {
    let db = openDatabase();
    const hashed = hashPassword(password);
    db.run(`UPDATE users SET hashed_pass = ? WHERE id = ?`, [hashed, user_id], (err) => {
      if (err) {
        rej(err);
        return;
      }
      let db2 = openSessionDatabase();
      db2.run(`DELETE FROM sessions WHERE sess LIKE ?`, ["%\"user_id\":" + user_id + ",%"], (err) => {
        if (err) rej(err);
        else res();
      })
      db2.close();
    });
    db.close();
  });
}

export function getFinishedQuiz(quiz_id : number, user_id : number, db : sqlite.Database) : Promise<number> {
  return new Promise((res, rej) => {
    db.get(`SELECT id FROM scoreboard WHERE quiz_id = ? AND user_id = ? AND status = "finished"`,
      [quiz_id, user_id],
      (err, row) => {
        if (err) rej(err);
        else res(row === undefined ? 0 : row.id);
      }
    );
  });
}

export function getRunningQuiz(quiz_id : number, user_id : number, db : sqlite.Database) : Promise<number> {
  return new Promise((res, rej) => {
    db.get(`SELECT id FROM scoreboard WHERE quiz_id = ? AND user_id = ? AND status = "running"`,
      [quiz_id, user_id],
      (err, row) => {
        if (err) rej(err);
        else res(row === undefined ? 0 : row.id);
      }
    );
  });
}

async function _getQuizScoreboard(questions : Question[], quiz_id : number, user_id : number,
  res : any, rej : any, tries : number) {
  let db = openDatabase();
  try {
    await dbBegin(db);
    const scoreboard_id : number = await newScoreboard(quiz_id, user_id, db);
    let result = await getFinishedQuiz(quiz_id, user_id, db);
    if (result === 0) {
      result = await getRunningQuiz(quiz_id, user_id, db);
    }
    if (result !== scoreboard_id) {
      await dbRun(db, "ROLLBACK", []);
      await dbClose(db);
      res(result);
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      questions[i].setScoreboard(scoreboard_id);
      await createQuestion(questions[i], quiz_id, user_id, db);
    }

    await dbEnd(db);
    await dbClose(db);

    res(scoreboard_id);

  } catch (err) {
    db.close();
    console.log(err);
    if (err.errno === 5 && tries > 0) {
      await sleep(1000);
      _getQuizScoreboard(questions, quiz_id, user_id, res, rej, tries - 1);
    }
    else {
      rej(err);
    }
  }
}

export function getQuizScoreboard(quiz_id : number, user_id : number) : Promise<number> {
  return new Promise(async (res, rej) => {
    let questions = generateQuizQuestions(await getQuizRules(quiz_id));
    _getQuizScoreboard(questions, quiz_id, user_id, res, rej, 10);
  })
}

export function quizFromScoreboard(scoreboard_id : number) : Promise<QuestionPacked[]> {
  return new Promise((res, rej) => {
    let db = openDatabase();
    db.all(`SELECT * FROM history WHERE scoreboard_id = ? ORDER BY question_no ASC`, [scoreboard_id], (err, rows) => {
      if (err) rej(err);
      else {
        const result = rows.map((row) => {
          return {
            question_no : row.question_no,
            question : row.question,
            options : [
              row.first,
              row.second,
              row.third,
              row.fourth
            ],
            pick : row.picked,
            time : row.time,
            correct : row.correct
          }
        });
        res(result);
      }
    });
    db.close();
  });
}

export function deactivate(user_id : number, quiz_id : number) : Promise<void> {
  return new Promise((res, rej) => {
    let db = openDatabase();
    db.run(`UPDATE scoreboard SET status = "canceled" WHERE quiz_id = ? AND user_id = ? AND status = "running"`,
      [quiz_id, user_id], (err) => {
        if (err) rej(err);
        else res();
      })
    db.close();
  });
}

function newScoreboard(quiz_id : number, user_id : number, db : sqlite.Database) : Promise<number> {
  return new Promise((res, rej) => {
    db.run('INSERT INTO scoreboard (quiz_id, user_id, time) VALUES (?, ?, ?)',
      [quiz_id, user_id, Date.now()], function(err) {
        if (err) rej(err);
        else res(this.lastID);
      });
  })
}

function generateQuizQuestions(rules : QuizRules) : Question[] {
  rules.range = Math.floor(rules.range);
  rules.question_count = Math.floor(rules.question_count);
  const temp_set : Set<string> = new Set();
  var i = rules.signs.length;
  while (i--) {
    if (allowed_operations.has(rules.signs.charAt(i)))
      temp_set.add(rules.signs.charAt(i));
  }
  let signs = Array.from(temp_set);

  let generated_questions : Question[] = [];
  for (let j = 0; j < rules.question_count; j++) {
    let options = [];
    let product_mem = randomRange(rules.min_product, rules.max_product);
    let question = product_mem.toString();
    if (product_mem   < 0)
      question = '(' + question + ')';

    const length = randomRange(rules.min_length, rules.max_length);
    for (let i = 1; i < length; i++) {
      let prod = randomRange(rules.min_product, rules.max_product);
      const sign = signs[Math.floor(Math.random() * signs.length)];
      question += sign;

      switch (sign) {
        case '/':
          if (prod == 0)  prod++;
          while (product_mem % prod) {
            if (prod > 0) prod--;
            else          prod++;
          }
          product_mem /= prod;
          break;
        case '*':
          product_mem *= prod;
          break;
        default:
          product_mem = prod;
      }

      if (prod < 0)
        question += '(' + prod.toString() + ')';
      else
        question += prod.toString();
    }
    let correct_answer : number = eval(question);
    for (let i = 0; i < 4; i++)
      options[i] = getSimilar(correct_answer, rules.range);
    options[Math.floor(Math.random() * 4)] = correct_answer;
    generated_questions[j] = new Question(j, question, options, -1, correct_answer, 0);
  }
  return generated_questions;
}

function createQuestion(question : Question, quiz_id : number, user_id : number, db : sqlite.Database) : Promise<void> {
  let questionPack = question.getPacked();
  questionPack.unshift(user_id);
  questionPack.unshift(quiz_id);
  return dbRun(db, `INSERT OR ROLLBACK INTO history VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, questionPack);
}

async function _sendAnswers(scoreboard_id : number, picks : number[], score : number,
  avg_time : string, res : any, rej : any, tries : number) {
  let db = openDatabase();
  try {
    await dbBegin(db);
    await dbRun(db,
      `UPDATE OR ROLLBACK scoreboard SET status = "finished", date = ?, score = ?, time = ? WHERE id = ?`,
      [new Date().toLocaleString(), score, avg_time, scoreboard_id]);
    await updateHistory(scoreboard_id, picks, 0, db);
    await dbEnd(db);
    await dbClose(db);
    console.log("ANSWERS SAVED TO DB");
    res();
  } catch (err) {
    db.close();
    console.log(err);
    if (err.errno === 5 && tries > 0) {
      await sleep(1000);
      _sendAnswers(scoreboard_id, picks, score, avg_time, res, rej, tries - 1);
    }
    else {
      rej(err);
    }
  }
}

export function sendAnswers(scoreboard_id : number, picks : number[], score : number, avg_time : string) : Promise<void> {
  return new Promise((res, rej) => {
    _sendAnswers(scoreboard_id, picks, score, avg_time, res, rej, 10);
  });
}

function updateHistory(scoreboard_id : number, picks : number[], question_no : number, db : sqlite.Database) : Promise<void> {
  return new Promise(async (res, rej) => {
    if (question_no !== picks.length - 1)
      await updateHistory(scoreboard_id, picks, question_no + 1, db);
    try {
      await dbRun(db,
        `UPDATE OR ROLLACK history SET picked = ?, time = 0 WHERE scoreboard_id = ? AND question_no = ?`,
        [picks[question_no], scoreboard_id, question_no]);
      res()
    } catch (err) {
      rej(err);
    }
  })
}

export function getStartTime(scoreboard_id : number) : Promise<number> {
  return new Promise((res, rej) => {
    let db = openDatabase();
    db.get(`SELECT time FROM scoreboard WHERE id = ?`, [scoreboard_id], (err, row) => {
      if (err || !row) rej();
      else res(row.time);
    })
    db.close();
  });
}

export function getAvgTime(quiz_id : number) : Promise<number> {
  return new Promise((res, rej) => {
    let db = openDatabase();
    db.get(`SELECT AVG(time) as t_avg FROM scoreboard WHERE quiz_id = ? AND status = 'finished'`, [quiz_id], (err, row) => {
      if (err) rej();
      else res(row.t_avg);
    })
  })
}