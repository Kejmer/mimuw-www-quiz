import * as sqlite from 'sqlite3';
import {hashPassword} from './security'

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

export interface QuizRules {
  question_count : number;
  min_product : number;
  max_product : number;
  min_length : number;
  max_length : number;
  description: string;
  penalty : number;
  range : number;
  signs: string;
  name: string;
}

export interface Score {
  date : string;
  user : string;
  points : string;
  time : string;
}

export function openDatabase() : sqlite.Database {
  let db = new sqlite.Database('quiz.db');
  db.run("PRAGMA busy_timeout = 10000");
  return db;
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
    db.all(`SELECT scoreboard.date, users.username, scoreboard.score, scoreboard.time FROM
      scoreboard JOIN users ON scoreboard.user_id = users.id
      WHERE scoreboard.quiz_id = ?
      ORDER BY scoreboard.score ASC LIMIT 5
      `, quiz_id, (err, rows) => {
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
      if (err) rej(err);
      else res();
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

export function prepareNewQuiz(quiz_id : number, user_id : number) : Promise<number> {
  return new Promise(async (res, rej) => {
    let questions = generateQuizQuestions(await getQuizRules(quiz_id));
    let db = openDatabase();
    db.run("BEGIN IMMEDIATE", [], async () => {
      const scoreboard_id : number = await newScoreboard(quiz_id, user_id, db);
      for (let i = 0; i < questions.length; i++) {
        questions[i].setScoreboard(scoreboard_id);
        createQuestion(questions[i], quiz_id, user_id, db);
      }
      db.run("COMMIT");
      db.close();
    })
  })
}

export function deactivate(user_id : number, scoreboard_id : number) : Promise<void> {
  return new Promise((res, rej) => {
    let db = openDatabase();
    db.run(`UPDATE scoreboard SET status = "canceled" WHERE scoreboard_id = ? AND user_id = ? AND status = "running"`,
      [scoreboard_id, user_id], (err) => {
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
        console.log(this);
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
            if (prod < 0) prod--;
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
    generated_questions[j] = new Question(j, question, options, -1, correct_answer);
  }
  return generated_questions;
}

// export function clearQuiz(user_id : number, quiz_id : number) {

// }

// export class Quiz {
//   constructor(rules : string) {
//     const parsed = JSON.parse(rules);
//     if (isQuizRules(parsed)) {
//       if (this.signs.length <= 0 || this.rules.min_prod > this.rules.max_prod ||
//           this.rules.min_qlen > this.rules.max_qlen || this.rules.min_qlen < 1 ||
//           this.rules.range < 0 || this.rules.question_count < 1)
//         this.success = false;
//     } else {
//       this.success = false;
//     }
//   }

//   private randomRange(min : number, max : number) : number {
//     return Math.floor(Math.random() * (max - min) + min);
//   }

//   public getRandomProduct() : number {
//     return this.randomRange(this.rules.min_prod, this.rules.max_prod);
//   }

//   public getQuestionLength() : number {
//     return this.randomRange(this.rules.min_qlen, this.rules.max_qlen);
//   }

//   public getSign() : string {
//     return this.signs[Math.floor(Math.random() * this.signs.length)];
//   }

//   public getQuestionCount() : number {
//     return this.rules.question_count;
//   }

//   public getName() : string {
//     return this.rules.name;
//   }

//   public getDescription() : string {
//     return this.rules.description;
//   }

//   public getPenalty() : number {
//     return this.rules.penalty;
//   }
// }


export class Question {
  private question_no : number;
  private question : string;
  private options : number[];
  private pick : number;
  private correct_answer : number;
  private scoreboard_id : number;

  private time : number;
  private start_time : Date;

  constructor(question_no : number, question : string, options : number[], pick : number, correct_answer : number) {
    this.question_no = question_no;
    this.question = question;
    this.options = options;
    this.pick = pick;
    this.correct_answer = correct_answer;
    this.time = 0;
    this.scoreboard_id = 0;
    this.start_time = new Date();
  }

  public getQuestion() : string {
    return this.question;
  }

  public getOptions() : number[] {
    return this.options;
  }

  public getPick() : number {
    return this.pick;
  }

  public setPick(pick : number) {
    this.pick = pick;
  }

  public getTime() : number {
    return this.time;
  }

  public active() {
    this.start_time = new Date();
  }

  public getQuestionNo() {
    return this.question_no;
  }

  public getScoreboard() : number {
    return this.scoreboard_id;
  }

  public setScoreboard(id : number) {
    this.scoreboard_id = id;
  }

  public inactive() {
    let end_time = new Date();
    this.time += end_time.getTime() - this.start_time.getTime();
  }

  public getPacked() : any[] {
    let result : any[] = [];
    result.push(this.question_no);
    result.push(this.question);
    result.push(this.options[0]);
    result.push(this.options[1]);
    result.push(this.options[2]);
    result.push(this.options[3]);
    result.push(this.time);
    result.push(this.correct_answer);
    result.push(this.pick);
    return result;
  }
}

function createQuestion(question : Question, quiz_id : number, user_id : number, db : sqlite.Database) : Promise<void> {
  let questionPack = question.getPacked();
  questionPack.unshift(user_id);
  questionPack.unshift(quiz_id);
  return new Promise((res, rej) => {
    db.run(`INSERT INTO history VALUES (?,?,?,?,?,?,?,?,?,?,?)`, questionPack, (err) => {
      if (err) rej(err);
      else res();
    });
  })
}

function updateQuestion(question : Question, db : sqlite.Database) : Promise<void> {
  return new Promise((res, rej) => {
    db.run(`UPDATE history SET pick = ?, time = ? WHERE scoreboard_id = ? AND question_no = ?`,
      [question.getPick(), question.getTime(), question.getScoreboard(), question.getQuestionNo()],
      (err) => {
        if (err) rej(err);
        else res();
      })
  })
}