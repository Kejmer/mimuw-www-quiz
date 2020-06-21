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
  res.render('dashboard', {css_file: 'dashboard', quiz_set: quiz_set});
});

app.get('/login', csrfProtection, (req, res) => {
  if (req.session!.user) {
    res.redirect("/");
    return;
  }
  res.render('login', {css_file: 'empty', csrfToken: req.csrfToken()});
});

app.post('/login', csrfProtection, async (req, res, next) => {
  if (req.session!.user) {
    res.redirect("/");
    return;
  }
  let username = req.body.username;
  let password = req.body.password;
  let user_id = await database.login(username, password);

  if (user_id !== 0) {
    req.session!.user = username;
    req.session!.user_id = user_id;
    res.redirect("/");
  } else {
    res.render('login', {css_file: 'empty', csrfToken: req.csrfToken()});
  }
});

app.get('/logout', (req, res) => {
  req.session!.user = 0;
  req.session!.user_id = 0;
  res.redirect("/");
});

app.get('/change_password', csrfProtection, (req, res) => {
  if (!req.session!.user) {
      console.log("siem");
    res.redirect("/login");
    return;
  }
  res.render('change_password', {css_file : 'empty', csrfToken: req.csrfToken()});
});

app.post('/change_password', csrfProtection, async (req, res) => {
  if (req.session!.user) {
    const password = req.body.password;
    const repeated = req.body.repeated;
    if (password !== repeated || password === "") {
      res.render('change_password', {css_file : 'empty', csrfToken: req.csrfToken()});
      return;
    }
    await database.changePassword(req.session!.user_id, password);
  }
  res.redirect("/");
});

// app.get('/creator', csrfProtection, (req, res, next) => {

// });

// app.post('/creator', csrfProtection, (req, res, next) => {

// });

app.get('/top/:quizId(\\d+)', async (req, res, next) => {
  const id = parseInt(req.params.quizId, 10);
  const rules : QuizRules = await database.getQuizRules(id);
  console.log(rules.name);
  res.render('top', {css_file: 'empty', scoreboard_rows: [], quiz_name: rules.name, quiz_id: id})
});

app.get('/q/json/:quizId(\\d+)', async (req, res, next) => {
  const id = parseInt(req.params.quizId, 10);
  console.log("Request for " + id + " quiz");
  if (!req.session!.user_id) {
    next(createError(401));
    return;
  }
  const scoreboard_id = await database.getQuizScoreboard(id, req.session!.user_id);
  let questions : QuestionPacked[] = await database.quizFromScoreboard(id);

  if (questions[0].pick === -1) {
    for (let q of questions)
      q.correct = 0;
  }

  res.json({
    questions : questions
  });
});

app.post('/cancel/:quizId(\\d+)')

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

  res.render('quiz', {css_file: 'quiz', rules: rules, id: quiz_id, csrfToken: req.csrfToken()});
});

app.post('/q/:quizId(\\d+)', csrfProtection, async function (req, res, next) {
  if (!req.session!.user) {
    res.redirect("/login");
    return;
  }

  const id = parseInt(req.params.quizId, 10);
  const rules : QuizRules = await database.getQuizRules(id);
  if (rules === undefined) {
    res.redirect("/");
    return;
  }



  // const id = parseInt(req.params.memeId, 10);
  // if (isNaN(req.body.price)) {
  //   next(createError(400));
  //   return;
  // }
  // const price = req.body.price;

  // const pickedMeme = await memer.getMeme(db,id);
  // if (pickedMeme === undefined) {
  //   next(createError(404));
  //   return;
  // }
  // await pickedMeme.setPrice(db, price, req.session.user);

  // const history = await pickedMeme.getHistory(db);
  // res.render('meme', {meme: pickedMeme, history: history, csrfToken: req.csrfToken()});

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
  res.render('error');
});

app.listen(8080, () => {
    console.log('App is running at http://localhost:8080/');
    console.log('Press Ctrl+C to stop.');
});
