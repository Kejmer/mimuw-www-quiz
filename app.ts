import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import csurf from 'csurf';
import sqlite from 'sqlite3';
import session from 'express-session';
import cors from 'cors';

let SQLiteStore = require('connect-sqlite3')(session);

import * as database from './backend/database'
import {Question, Score, QuestionPacked, QuizRules} from './backend/models'


const app = express();
const csrfProtection = csurf({ cookie: true });

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(logger('dev'));
app.use(session({secret: "deadBEEF4242424242424242", resave: false, saveUninitialized: false, store: new SQLiteStore}));
app.use(express.static(path.join(__dirname, 'public')));

const cors_opt = {
  origin: 'http://localhost:8080',
  optionsSuccessStatus: 200
}

app.use(cors(cors_opt));

app.get('/', async (req, res, next) => {
  const quiz_set = await database.allQuizes();
  res.render('dashboard', {css_file: 'dashboard', quiz_set: quiz_set, logged_in: req.session!.user});
});

app.get('/login', csrfProtection, (req, res) => {
  if (req.session!.user) {
    res.redirect("/");
    return;
  }
  res.render('login', {css_file: 'empty', csrfToken: req.csrfToken(), logged_in: req.session!.user});
});

app.post('/login', csrfProtection, async (req, res, next) => {
  if (req.session!.user) {
    res.redirect("/");
    return;
  }
  let username = req.body.username.trim();
  let password = req.body.password;
  let user_id = await database.login(username, password);

  if (user_id !== 0) {
    req.session!.user = username;
    req.session!.user_id = user_id;
    res.redirect("/");
  } else {
    res.render('login', {css_file: 'empty', csrfToken: req.csrfToken(), logged_in: req.session!.user});
  }
});

app.get('/logout', (req, res) => {
  req.session!.user = 0;
  req.session!.user_id = 0;
  res.redirect("/");
});

app.get('/change_password', csrfProtection, (req, res) => {
  if (!req.session!.user) {
    res.redirect("/login");
    return;
  }
  res.render('change_password', {css_file : 'empty', csrfToken: req.csrfToken(), logged_in: req.session!.user});
});

app.post('/change_password', csrfProtection, async (req, res) => {
  if (req.session!.user) {
    const password = req.body.password;
    const repeated = req.body.repeated;
    if (password !== repeated || password === "") {
      res.render('change_password', {css_file : 'empty', csrfToken: req.csrfToken(), logged_in: req.session!.user});
      return;
    }
    await database.changePassword(req.session!.user_id, password);
  }
  res.redirect("/");
});

app.get('/creator', csrfProtection, (req, res, next) => {
  if (!req.session!.user) {
    res.redirect("/login");
    return;
  }

  res.render('creator', {css_file : 'quiz_maker', csrfToken: req.csrfToken(), logged_in: req.session!.user});
});

app.post('/creator', csrfProtection, (req, res, next) => {
  if (!req.session!.user) {
    res.redirect("/login");
    return;
  }
  const question_count = req.body.question_count;
  const min_product = req.body.min_product;
  const max_product = req.body.max_product;
  const min_length = req.body.min_length;
  const max_length = req.body.max_length;
  let description = req.body.description;
  if (description === undefined)
    description = "";
  const penalty = req.body.penalty;
  const range = req.body.range;
  const name = req.body.name;

  if (isNaN(question_count) || isNaN(min_product) || isNaN(max_product) || isNaN(min_length)
    || isNaN(max_length) || isNaN(penalty)) {
    next(createError(401));
    return;
  }

  if (min_product > max_product || min_length >= max_length || penalty < 0 || name === "" || name === undefined
    || min_length < 1 || question_count < 1) {
    next(createError(401));
    return;
  }

  let signs = "";
  if (req.body.adding) signs += '+';
  if (req.body.substraction) signs += '-';
  if (req.body.multiply) signs += '*';
  if (req.body.divide) signs += '/';
  if (signs === "" && max_length > 2) {
    next(createError(401));
    return;
  }

  let rules : QuizRules =
    {
      question_count : question_count,
      min_product : min_product,
      max_product : max_product,
      min_length : min_length,
      max_length : max_length,
      description : description,
      penalty : penalty,
      range : range,
      name : name,
      signs : signs
    };

  database.addQuiz(rules);
  res.redirect("/");
});

app.get('/top/:quizId(\\d+)', async (req, res, next) => {
  const id = parseInt(req.params.quizId, 10);
  const rules : QuizRules = await database.getQuizRules(id);
  if (rules === undefined) {
    res.redirect("/");
    return;
  }
  const quiz_avg = await database.getAvgTime(id);
  res.render('top', {css_file: 'dashboard', scoreboard_rows: await database.getBestScores(id),
    quiz_name: rules.name, quiz_id: id, quiz_avg : quiz_avg, logged_in: req.session!.user})
});

app.get('/q/json/:quizId(\\d+)', async (req, res, next) => {
  const id = parseInt(req.params.quizId, 10);
  console.log("Request for " + id + " quiz");
  if (!req.session!.user_id) {
    next(createError(401));
    return;
  }
  const scoreboard_id = await database.getQuizScoreboard(id, req.session!.user_id);
  let questions : QuestionPacked[] = await database.quizFromScoreboard(scoreboard_id);

  if (questions[0].pick === -1) {
    for (let q of questions)
      q.correct = 0;
  }

  res.json({
    questions : questions,
    scoreboard_id : scoreboard_id
  });
});

app.post('/cancel/:quizId(\\d+)', csrfProtection, async function(req, res, next) {
  if (!req.session!.user_id) {
    res.redirect("/login");
    return;
  }
  const quiz_id = parseInt(req.params.quizId, 10);
  const user_id = req.session!.user_id;
  await database.deactivate(user_id, quiz_id);
  res.redirect("/top/" + quiz_id);
})

app.get('/q/:quizId(\\d+)', csrfProtection, async function(req, res, next) {
  if (!req.session!.user_id) {
    res.redirect("/login");
    return;
  }
  const quiz_id = parseInt(req.params.quizId, 10);
  const user_id = req.session!.user_id;

  const rules : QuizRules = await database.getQuizRules(quiz_id);
  if (rules === undefined) {
    res.redirect("/")
    return;
  }

  res.render('quiz', {css_file: 'quiz', rules: rules, id: quiz_id, csrfToken: req.csrfToken(), logged_in: req.session!.user});
});

function isArray(obj : any) : obj is any {
  return typeof(obj) == 'object' && obj instanceof Array;
}

app.post('/q/:quizId(\\d+)', csrfProtection, async function (req, res, next) {
  if (!req.session!.user_id) {
    res.redirect("/login");
    return;
  }

  const scoreboard_id : number = req.body.scoreboard_id;
  const picks : number[] = req.body.picks;
  const times : number[] = req.body.times;
  const id = parseInt(req.params.quizId, 10);
  const rules : QuizRules = await database.getQuizRules(id);
  if (rules === undefined) {
    res.redirect("/");
    return;
  }

  if (isNaN(scoreboard_id) || !isArray(picks) || !isArray(times)) {
    next(createError(401));
    return;
  }

  if (picks.length !== rules.question_count || rules.question_count !== times.length) {
    next(createError(401));
    return;
  }

  for (const i of times) {
    if (isNaN(i) || i < 0) {
      next(createError(401));
      return;
    }
  }

  for (const i of picks) {
    if (isNaN(i) || i < 0 || 3 < i) {
      next(createError(401));
      return;
    }
  }

  const start_time : number = await database.getStartTime(scoreboard_id);
  const total_time : number = (Date.now() - start_time);
  let score : number = total_time / 1000;
  const avg_seconds : number = score / rules.question_count;

  const times_percentage = times.map(x => +(x * 100 / total_time).toFixed(1)); // '+' konwertuje string -> float

  const questions = await database.quizFromScoreboard(scoreboard_id);
  for (let i = 0; i < picks.length; i++) {
    if (questions[i].correct !== questions[i].options[picks[i]])
      score += rules.penalty;
  }

  const score_fixed : number = parseFloat(score.toFixed(2));
  console.log(score_fixed);

  await database.sendAnswers(scoreboard_id, picks, times_percentage, score_fixed, avg_seconds.toFixed(2));

  res.redirect("/top/" + id);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err : any, req : any, res : any, next : any) {
  // set locals, only providing error in development
  console.log("ERROR");
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {logged_in: req.session!.user});
});

app.listen(8080, () => {
    console.log('App is running at http://localhost:8080/');
    console.log('Press Ctrl+C to stop.');
});
