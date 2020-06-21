import * as sqlite from 'sqlite3';
import {hashPassword} from './security';
import {addQuizSchema, openDatabase} from './database';

async function dropAll() : Promise<void> {
  return new Promise((res, rej) => {
    let db = openDatabase();
    const tables : string[] = ['users', 'scoreboard', 'history', 'templates'];
    for (const t_name of tables)
      db.run('DROP TABLE IF EXISTS ' + t_name); // Drop nie lubi argumentów przekazywanych przez ?
    db.close(() => {
      res();
    })
  });
}

async function buildTable() {
  await dropAll();
  const db = openDatabase();
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      hashed_pass TEXT NOT NULL
    )`, [], () => {
    db.run(`INSERT INTO users (username, hashed_pass)
      VALUES('user1', ?)`, [hashPassword('user1')]);
    db.run(`INSERT INTO users (username, hashed_pass)
      VALUES('user2', ?)`, [hashPassword('user2')]);
  });
  db.run(`
    CREATE TABLE scoreboard (
      id INTEGER PRIMARY KEY,
      quiz_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      date TEXT,
      time TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      status TEXT DEFAULT "running"
    )`);
  db.run(`
    CREATE TABLE history (
      quiz_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      scoreboard_id INTEGER NOT NULL,
      question_no INTEGER NOT NULL,
      question TEXT NOT NULL,
      first INTEGER NOT NULL,
      second INTEGER NOT NULL,
      third INTEGER NOT NULL,
      fourth INTEGER NOT NULL,
      time TEXT NOT NULL,
      correct INTEGER NOT NULL,
      picked INTEGER DEFAULT -1
    )`);
  db.run(`
    CREATE TABLE templates (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      question_count INTEGER NOT NULL,
      operations TEXT,
      range INTEGER NOT NULL,
      penalty INTEGER NOT NULL,
      min_length INTEGER NOT NULL,
      max_length INTEGER NOT NULL,
      min_product INTEGER NOT NULL,
      max_product INTEGER NOT NULL
    )`, [], () => {
    for (const quiz of quizes())
      addQuizSchema(JSON.parse(quiz), db);
    console.log("adding");
    db.close(() => {
      console.log("DONE!")
    });
  });
}

function quizes() : string[] {
  return [
    `{
      "question_count": 6,
      "description": "Nic dodać nic ująć!",
      "min_product": 5,
      "max_product": 20,
      "min_length": 2,
      "max_length": 3,
      "range": 20,
      "penalty": 5,
      "signs": "-",
      "name": "Odejmujemy!"
    }`,
    `{
      "question_count": 12,
      "description": "To ja jestem Spartakusem!",
      "min_product": 1,
      "max_product": 1000,
      "min_length": 1,
      "max_length": 2,
      "range": 0,
      "penalty": 5,
      "signs": "-",
      "name": "Klony!"
    }`,
    `{
      "question_count": 6,
      "description": "Mnoż Mnoż!",
      "min_product": 2,
      "max_product": 25,
      "min_length": 2,
      "max_length": 4,
      "range": 40,
      "penalty": 5,
      "signs": "*",
      "name": "Mnożymy!"
    }`,
    `{
      "question_count": 6,
      "description": "Nie wybrzydzam!",
      "min_product": 5,
      "max_product": 20,
      "min_length": 2,
      "max_length": 5,
      "range": 20,
      "penalty": 5,
      "signs": "+-",
      "name": "Mieszanka studencka!"
    }`,
    `{
      "question_count": 15,
      "description": "Miej celne oko!",
      "min_product": 10,
      "max_product": 100,
      "min_length": 1,
      "max_length": 2,
      "range": 100,
      "penalty": 999,
      "signs": "+",
      "name": "Szybkie Palce!"
    }`,
    `{
      "question_count": 6,
      "description": "Dodaj tyle ile możesz!",
      "min_product": 5,
      "max_product": 20,
      "min_length": 2,
      "max_length": 3,
      "range": 20,
      "penalty": 5,
      "signs": "+",
      "name": "Dodajemy!"
    }`,
    `{
      "question_count": 10,
      "description": "Podziel się z całą klasą!",
      "min_product": 2,
      "max_product": 50,
      "min_length": 2,
      "max_length": 4,
      "range": 50,
      "penalty": 13,
      "signs": "/+*",
      "name": "Ponad podziałami!"
    }`
  ]
}

buildTable();