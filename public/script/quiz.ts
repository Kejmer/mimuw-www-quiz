/***************************************************************************/
/****************************** CLASSES ************************************/
/***************************************************************************/

function isQuizRules(obj : any) : obj is QuizRules {
  return ( obj.penalty !== undefined &&
    obj.question_count !== undefined &&
    obj.description !== undefined &&
    obj.min_prod !== undefined &&
    obj.max_prod !== undefined &&
    obj.min_qlen !== undefined &&
    obj.max_qlen !== undefined &&
    obj.range !== undefined &&
    obj.signs !== undefined &&
    obj.name !== undefined
  );
}

const allowed_operations : Set<string> = new Set(['+', '-', '*', '/']);

class Quiz {
  private success : boolean;
  private rules : QuizRules;
  private signs : string[];

  constructor(rules : string) {
    const parsed = JSON.parse(rules);
    if (isQuizRules(parsed)) {
      this.success = true;
      this.rules = parsed;
      this.rules.range = Math.floor(this.rules.range);
      this.rules.question_count = Math.floor(this.rules.question_count);

      const temp_set : Set<string> = new Set();
      for (const sign of parsed.signs) {
        if (allowed_operations.has(sign))
          temp_set.add(sign);
      }
      this.signs = Array.from(temp_set);
      if (this.signs.length <= 0 || this.rules.min_prod > this.rules.max_prod ||
          this.rules.min_qlen > this.rules.max_qlen || this.rules.min_qlen < 1 ||
          this.rules.range < 0 || this.rules.question_count < 1)
        this.success = false;
    } else {
      this.success = false;
    }
  }

  private randomRange(min : number, max : number) : number {
    return Math.floor(Math.random() * (max - min) + min);
  }

  public getRandomProduct() : number {
    return this.randomRange(this.rules.min_prod, this.rules.max_prod);
  }

  public getQuestionLength() : number {
    return this.randomRange(this.rules.min_qlen, this.rules.max_qlen);
  }

  public getSign() : string {
    return this.signs[Math.floor(Math.random() * this.signs.length)];
  }

  public getQuestionCount() : number {
    return this.rules.question_count;
  }

  public getName() : string {
    return this.rules.name;
  }

  public getDescription() : string {
    return this.rules.description;
  }

  public getPenalty() : number {
    return this.rules.penalty;
  }

  public getSimilar(num : number) : number {
    let random = Math.floor(Math.random() * this.rules.range);
    const sign = Math.floor(Math.random() - 0.5);
    if (sign === 0)
      random = -random;
    return num + random;
  }
}

const optionsRange : number = 4;

class Question {
  private options : number[];
  private question : string;

  private start_time : Date;
  private end_time : Date;
  private time : number;
  private correct : number;

  constructor(quiz_template : Quiz) {
    this.time = 0;
    this.question = '';
    this.options = [];
    let previous_prod = quiz_template.getRandomProduct();

    if (previous_prod < 0)
      this.question += '(' + previous_prod.toString() + ')';
    else
      this.question += previous_prod.toString();

    const length = quiz_template.getQuestionLength();
    for (let i = 1; i < length; i++) {
      let prod = quiz_template.getRandomProduct();
      const sign = quiz_template.getSign();
      this.question += sign;

      switch (sign) {
        case '/':
          if (prod == 0)
            prod++;
          while (previous_prod % prod) {
            if (prod < 0) {
              prod++;
            } else {
              prod--;
            }
          }
          previous_prod /= prod;
          break;
        case '*':
          previous_prod *= prod;
          break;
        case '+':
        case '-':
          previous_prod = prod;
      }

      if (prod < 0)
        this.question += '(' + prod.toString() + ')';
      else
        this.question += prod.toString();
    }
    this.correct = eval(this.question);
    for (let i = 0; i < 4; i++)
      this.options[i] = quiz_template.getSimilar(this.correct);
    this.options[Math.floor(Math.random() * 4)] = this.correct;
  }

  public getOptions() : number[] {
    return this.options;
  }

  public getQuestion() : string {
    return this.question;
  }

  public checkAnswer(guess : number) {
    return this.correct === this.options[guess];
  }

  public active() {
    this.start_time = new Date();
  }

  public inactive() {
    this.end_time = new Date();
    this.time += this.end_time.getTime() - this.start_time.getTime();
  }

  public getTime() : number {
    return this.time;
  }

  public getCorrect() : number {
    return this.correct;
  }
}

/***************************************************************************/
/**************************** QUIZ FIELDS **********************************/
/***************************************************************************/

let questionField = document.querySelector("section#question p#equation") as HTMLElement;
let counterField = document.querySelector("section#question p#counter") as HTMLElement;
let penaltyField = document.querySelector("#description p#penalty") as HTMLElement;
let descField = document.querySelector("#description p#desc") as HTMLElement;
let answerField = document.querySelector("section#answers") as HTMLElement;
let btnField = document.querySelector("nav#question-btns") as HTMLElement;
let quizName = document.querySelector("#quiz-name") as HTMLElement;
let answers = document.querySelectorAll(".quiz-ans p") as NodeList;
let table = document.querySelector("table#stats") as HTMLElement;

/***************************************************************************/
/****************************** BUTTONS ************************************/
/***************************************************************************/

let withStatsBtn = document.getElementById('with-stats') as HTMLButtonElement;
let noStatsBtn = document.getElementById('no-stats') as HTMLButtonElement;
let prevBtn = document.getElementById("previous") as HTMLButtonElement;
let cancelBtn = document.getElementById("cancel") as HTMLButtonElement;
let startBtn = document.getElementById("start") as HTMLButtonElement;
let nextBtn = document.getElementById("next") as HTMLButtonElement;
let stopBtn = document.getElementById("stop") as HTMLButtonElement;

/***************************************************************************/
/******************************* SETUP *************************************/
/***************************************************************************/

enum QuizStatus {
  Loaded, Running, Finished, Cancel
}
let quiz_status : QuizStatus = QuizStatus.Loaded;

let current_question : number = 0;
let picks : number[] = [];
let answered_num : number = 0;

let score : number = 0;
let quiz : Quiz = new Quiz(quizes[Math.floor(Math.random() * quizes.length)]);
let quiz_size = quiz.getQuestionCount()
let questions : Question[] = [];
for (let i = 0; i < quiz_size; i++)
  questions[i] = new Question(quiz);

penaltyField.innerText = "Kara za błędną odpowiedź: " + quiz.getPenalty().toString() + "s";
descField.innerText = quiz.getDescription() ;
quizName.innerText = quiz.getName();

function clearPick() {
  for (let i = 0; i < quiz_size; i++)
    picks[i] = -1;
  noPickDisplay();
}

for (let i = 0; i < optionsRange; i++) {
  const ans = answers[i] as HTMLDivElement;
  ans.parentElement.onclick = () => {
    if (quiz_status !== QuizStatus.Running)
      return;

    noPickDisplay();
    question_status[i] = QuestionStatus.Picked;
    ans.parentElement.classList.add("picked");
    if (picks[current_question] === -1) {
      answered_num++;
      if (answered_num === questions.length)
        stopBtn.disabled = false;
    }
    picks[current_question] = i;
  }
}

enum QuestionStatus {
  Empty, Picked, Correct, Incorrect
}
let question_status : QuestionStatus[] = [];

for (let i = 0; i < quiz_size; i++)
  question_status[i] = QuestionStatus.Empty;

/***************************************************************************/
/****************************** DISPLAY ************************************/
/***************************************************************************/

function noPickDisplay() {
  for (let i = 0; i < optionsRange; i++) {
    const ans = answers[i] as HTMLDivElement;
    ans.parentElement.classList.remove("picked");
    ans.parentElement.classList.remove("correct");
    ans.parentElement.classList.remove("incorrect");
  }
}

function setAnswers() {
  noPickDisplay();
  if (picks[current_question] !== -1) {
    const ans = answers[picks[current_question]] as HTMLDivElement;
    let status : string;
    switch (question_status[current_question]) {
      case QuestionStatus.Incorrect:
        status = "incorrect";
        break;
      case QuestionStatus.Correct:
        status = "correct";
        break;
      case QuestionStatus.Picked:
      default:
        status = "picked";
    }
    ans.parentElement.classList.add(status);
  }

  questionField.innerText = questions[current_question].getQuestion();
  counterField.innerText = (current_question + 1).toString() + '/' + quiz_size.toString();

  const options : number[] = questions[current_question].getOptions();
  for (let i = 0; i < optionsRange; i++) {
    const ans = answers[i] as HTMLDivElement;
    ans.innerText = options[i].toString();
  }
}

function showQuiz() {
  answerField.classList.remove("hidden");
  btnField.classList.remove("hidden");
  startBtn.style.display = "none";
}


/***************************************************************************/
/************************* QUESTION NAVIGATION *****************************/
/***************************************************************************/

function nextQuestion() {
  if (current_question >= quiz_size - 1)
    return;
  if (quiz_status === QuizStatus.Running)
    questions[current_question].inactive();

  current_question++;
  setAnswers();
  questions[current_question].active();

  if (quiz_size > 1)
    prevBtn.disabled = false;
  if (current_question >= quiz_size - 1)
    nextBtn.disabled = true;
}

function prevQuestion() {
  if (current_question <= 0)
    return;
  if (quiz_status === QuizStatus.Running)
    questions[current_question].inactive();

  current_question--;
  setAnswers();
  questions[current_question].active();

  if (quiz_size > 1)
    nextBtn.disabled = false;
  if (current_question <= 0)
    prevBtn.disabled = true;
}

nextBtn.addEventListener("click", () => nextQuestion());
prevBtn.addEventListener("click", () => prevQuestion());
cancelBtn.addEventListener("click", () => quizCancel());
startBtn.addEventListener("click", () => quizStart());
stopBtn.addEventListener("click", () => quizStop());

/***************************************************************************/
/**************************** QUIZ "BACKEND" *******************************/
/***************************************************************************/

function quizStart() {
  if (quiz_status !== QuizStatus.Loaded)
    return;
  current_question = 0;
  prevBtn.disabled = true;
  if (quiz_size === 1)
    nextBtn.disabled = true;
  clearPick();
  setAnswers();
  questions[current_question].active();
  showQuiz();
  quiz_status = QuizStatus.Running;
}

function quizCancel() {
  if (quiz_status !== QuizStatus.Running)
    return;
  window.location.replace('dashboard.html');
}

function checkAnswers() {
  for (let i = 0; i < quiz_size; i++) {
    if (questions[i].checkAnswer(picks[i]))
      question_status[i] = QuestionStatus.Correct;
    else {
      question_status[i] = QuestionStatus.Incorrect;
      score += quiz.getPenalty();
    }
    score += questions[i].getTime() / 1000;
  }
}

function quizStop() {
  for (let i = 0; i < quiz_size; i++) {
    if (quiz_status !== QuizStatus.Running)
      return;
    if (picks[i] < 0 || optionsRange < picks[i])
      return;
    questions[current_question].inactive();
    cancelBtn.disabled = true;
    stopBtn.disabled = true;
    checkAnswers();
    setAnswers();
    generateStats();
    document.querySelector('section#summary').classList.remove('hidden');
    quiz_status = QuizStatus.Finished;
  }
}

/***************************************************************************/
/***************************** STATISTICS **********************************/
/***************************************************************************/

function generateStats() {
  for (let i = 0; i < quiz_size; i++) {
    let row = document.createElement("tr");
    if (question_status[i] === QuestionStatus.Correct)
      row.classList.add("correct");
    else
      row.classList.add("incorrect");

    let cell = document.createElement("td");
    cell.innerText = (i+1).toString();
    row.appendChild(cell);

    cell = document.createElement("td");
    cell.innerText = questions[i].getOptions()[picks[i]].toString();
    row.appendChild(cell);

    cell = document.createElement("td");
    cell.innerText = questions[i].getCorrect().toString();
    row.appendChild(cell);

    cell = document.createElement("td");
    cell.innerText = (questions[i].getTime()/1000).toFixed(2).toString();
    row.appendChild(cell);

    cell = document.createElement("td");
    cell.innerText = quiz.getPenalty().toString();
    row.appendChild(cell);

    table.appendChild(row);
  }
}

function getData(more_data : boolean) {
  let correct = 0;
  let penalty = 0;
  let avg = 0.;
  let slowest = 0;
  let fastest = 100000000000000000000;

  for (let i = 0; i < quiz_size; i++) {
    if (question_status[i] === QuestionStatus.Correct)
      correct++;
    else
      penalty += quiz.getPenalty();
    let time = questions[i].getTime();
    avg += time;
    slowest = Math.max(slowest, time);
    fastest = Math.min(fastest, time);
  }

  let _fastest : string | undefined = undefined;
  let _slowest : string | undefined = undefined;
  let  _avg : string | undefined = undefined;
  let _penalty : number | undefined = undefined;
  if (more_data) {
    _fastest = (fastest / 1000).toFixed(2);
    _slowest = (slowest / 1000).toFixed(2);
    _avg = ((avg / quiz_size)/1000).toFixed(2);
    _penalty = penalty;
  }

  return {
    when: new Date().toLocaleString(),
    result: correct.toString() + '/' + quiz_size.toString() ,
    score: score.toFixed(2),
    quiz: quiz.getName(),
    penalty: _penalty,
    avg: _avg,
    slowest: _slowest,
    fastest: _fastest
  }
}

function save(more_data : boolean) {
  if (!window.indexedDB) {
    console.log("Your browser doesn't support a stable version of IndexedDB. Statistics feature will not be available.");
  } else {
    let openRequest = window.indexedDB.open("store");

    openRequest.onupgradeneeded = () => {
      let db = openRequest.result;
      let store = db.createObjectStore("statistics", {
        keyPath: 'id',
        autoIncrement: true
      });
      store.createIndex('id_idx', 'id', { unique: true });
    };

    openRequest.onerror = function(e : Event) {
      console.log("no i chuj no i cześć");
    };

    openRequest.onsuccess = () => {
      let db = openRequest.result;
      let transaction = db.transaction(["statistics"], "readwrite");

      transaction.oncomplete = function(e : Event) {
        console.log("All done!");
        db.close();
      };

      let objectStore = transaction.objectStore("statistics");
      let request = objectStore.add(getData(more_data));
      request.onsuccess = function(e : Event) {
        console.log(request.result);
        console.log("Added successfully");
      };
    };
  }
  setTimeout(function(){ window.location.replace('dashboard.html'); }, 100);
  // window.location.replace('dashboard.html');
}

withStatsBtn.addEventListener("click", () => save(true));
noStatsBtn.addEventListener("click", () => save(false));

/***************************************************************************/
/**************************** TIMER ****************************************/
/***************************************************************************/

let minutesLabel = document.getElementById("minutes") as HTMLElement;
let secondsLabel = document.getElementById("seconds") as HTMLElement;
let totalSeconds = 0;
setInterval(setTime, 1000);

function setTime() {
  if (quiz_status == QuizStatus.Running)
    ++totalSeconds;
  secondsLabel.innerHTML = pad(totalSeconds % 60).toString();
  minutesLabel.innerHTML = pad(parseInt((totalSeconds / 60).toString()));
}

function pad(val) {
  var valString = val + "";
  if (valString.length < 2) {
    return "0" + valString;
  } else {
    return valString;
  }
}