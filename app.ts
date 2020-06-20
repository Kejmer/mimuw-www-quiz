import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import csurf from 'csurf';
import sqlite from 'sqlite3';
import * as database from './backend/database'
let SQLiteStore = require('connect-sqlite3')(session);
import session from 'express-session';


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


app.get('/', (req, res, next) => {
  res.render('dashboard', {});
});

app.get('/login', csrfProtection, (req, res) => {
  if (req.session.user) {
    res.redirect("/");
    return;
  }
  res.render('login', {title: "Logowanie"});
});

app.post('/login', async (req, res, next) => {
  if (req.session.user) {
    res.redirect("/");
    return;
  }
  let username = req.body.username;
  let password = req.body.password;
  let user_id = await database.login(username, password);

  if (user_id !== 0) {
    req.session.user = username;
    req.session.user_id = user_id;
    res.redirect("/");
  } else {
    res.render('login', {});
  }
});

app.get('/logout', (req, res) => {
  req.session.user = 0;
  res.redirect("/");
});

app.get('/creator', csrfProtection, (req, res, next) => {

});

app.post('/creator', csrfProtection, (req, res, next) => {

});

app.get('/top/:quizId(\\d+)', (req, res, next) => {

});

app.get('/q/:quizId(\\d+)', csrfProtection, async function(req, res, next) {
  const id = parseInt(req.params.memeId, 10);

  const pickedMeme = await memer.getMeme(db,id);
  if (pickedMeme === undefined) {
    next(createError(404));
    return;
  }

  const history = await pickedMeme.getHistory(db);
res.render('meme', {meme: pickedMeme, history: history, csrfToken: req.csrfToken()});
});

app.post('/q/:quizId(\\d+)', csrfProtection, async function (req, res, next) {
  if (!req.session.user) {
    next(createError(401));
    return;
  }

  const id = parseInt(req.params.memeId, 10);
  if (isNaN(req.body.price)) {
    next(createError(400));
    return;
  }
  const price = req.body.price;

  const pickedMeme = await memer.getMeme(db,id);
  if (pickedMeme === undefined) {
    next(createError(404));
    return;
  }
  await pickedMeme.setPrice(db, price, req.session.user);

  const history = await pickedMeme.getHistory(db);
  res.render('meme', {meme: pickedMeme, history: history, csrfToken: req.csrfToken()});

});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  console.log("ERROR");
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

