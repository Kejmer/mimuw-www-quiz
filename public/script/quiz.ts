/***************************************************************************/
/****************************** CLASSES ************************************/
/***************************************************************************/

class Question {
  private question_no : number;
  private question : string;
  private options : number[];
  private pick : number;
  private correct_answer : number;
  private scoreboard_id : number;

  private time : number;
  private start_time : Date;

  constructor(question_no : number, question : string, options : number[], pick : number, correct_answer : number, time : number) {
    this.question_no = question_no;
    this.question = question;
    this.options = options;
    this.pick = pick;
    this.correct_answer = correct_answer;
    this.time = time;
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

  public getCorrect() : number {
    return this.correct_answer;
  }

  public inactive() {
    let end_time = new Date();
    this.time += end_time.getTime() - this.start_time.getTime();
  }

  public getPacked() : any[] {
    let result : any[] = [];
    result.push(this.scoreboard_id);
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

interface QuestionPacked {
  question_no : number,
  question : string,
  options : number[],
  pick : number,
  time : number,
  correct : number
}

/***************************************************************************/
/**************************** QUIZ FIELDS **********************************/
/***************************************************************************/
console.log("FIELDS");

let questionField = document.querySelector("section#question p#equation") as HTMLElement;
let counterField = document.querySelector("section#question p#counter") as HTMLElement;
let answerField = document.querySelector("section#answers") as HTMLElement;
let btnField = document.querySelector("nav#question-btns") as HTMLElement;
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

enum QuestionStatus {
  Empty, Picked, Correct, Incorrect
}
let question_status : QuestionStatus[] = [];

let current_question : number = 0;
let picks : number[] = [];
let answered_num : number = 0;
const optionsRange = 4;

let score : number = 0;
let quiz_size : number;
let questions : Question[] = [];
quizStart();

interface fetchData {
  questions : QuestionPacked[];
}

function isFetchData(obj : any) : obj is fetchData {
  return obj.questions !== undefined;
}

function createQuestions(question_desc : JSON) : Question[] {
  if (isFetchData(question_desc)) {
    return question_desc.questions.map((q) => {
      return new Question(q.question_no, q.question, q.options, q.pick, q.correct, q.time);
    })
  }
  window.location.replace("/");
  return [];
}

function getQuizId() {
  const url = window.location.toString();
  const id = url.substring(url.lastIndexOf('/') + 1);
  return id;
}

async function quizStart() {
  if (quiz_status !== QuizStatus.Loaded)
    return;

  questions = createQuestions(await fetchQuestions());
  quiz_size = questions.length;
  picks = questions.map((x) => {return x.getPick();});

  quiz_status = QuizStatus.Running;
  for (let i = 0; i < quiz_size; i++) {
    const _pick = picks[i];
    if (_pick !== -1)
      QuizStatus.Finished;
    if (_pick === -1) {
      question_status[i] = QuestionStatus.Empty;
    } else {
      if (questions[i].getOptions()[_pick] === questions[i].getCorrect()) {
        question_status[i] = QuestionStatus.Correct;
      } else {
        question_status[i] = QuestionStatus.Incorrect;
      }
    }
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
      questions[current_question].setPick(i);
      picks[current_question] = i;
    }
  }

  current_question = 0;
  prevBtn.disabled = true;
  if (quiz_size === 1)
    nextBtn.disabled = true;

  setAnswers();
  questions[current_question].active();
  showQuiz();
}

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
    if (status === "incorrect") {
      // zaznacz prawdziwe
    }
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
// startBtn.addEventListener("click", () => quizStart());
stopBtn.addEventListener("click", () => quizStop());

/***************************************************************************/
/**************************** QUIZ "BACKEND" *******************************/
/***************************************************************************/

async function fetchQuestions() : Promise<JSON> {
  return new Promise((res, rej) => {
    fetch("http://localhost:8080/q/json/" + getQuizId(), {
      method: 'GET',
      headers: {
        'Access-Control-Allow-Origin' : 'http://localhost:8080'
      }
    })
      .then(result => result.json())
      .then(data => res(data));
  })

}


function quizCancel() {
  if (quiz_status !== QuizStatus.Running)
    return;
  window.location.replace('cancel/' + getQuizId());
}

// function checkAnswers() {
//   for (let i = 0; i < quiz_size; i++) {
//     if (questions[i].checkAnswer(picks[i]))
//       question_status[i] = QuestionStatus.Correct;
//     else {
//       question_status[i] = QuestionStatus.Incorrect;
//       score += quiz.getPenalty();
//     }
//     score += questions[i].getTime() / 1000;
//   }
// }

function quizStop() {
  if (quiz_status !== QuizStatus.Running)
    return;
  for (let i = 0; i < quiz_size; i++) {
    if (picks[i] < 0 || 4 <= picks[i])
      return;
  }
  questions[current_question].inactive();
  cancelBtn.disabled = true;
  stopBtn.disabled = true;
  // checkAnswers();
  // setAnswers();
  // generateStats();
  // document.querySelector('section#summary').classList.remove('hidden');
  // quiz_status = QuizStatus.Finished;
  save();
}

/***************************************************************************/
/***************************** STATISTICS **********************************/
/***************************************************************************/

// function generateStats() {
//   for (let i = 0; i < quiz_size; i++) {
//     let row = document.createElement("tr");
//     if (question_status[i] === QuestionStatus.Correct)
//       row.classList.add("correct");
//     else
//       row.classList.add("incorrect");

//     let cell = document.createElement("td");
//     cell.innerText = (i+1).toString();
//     row.appendChild(cell);

//     cell = document.createElement("td");
//     cell.innerText = questions[i].getOptions()[picks[i]].toString();
//     row.appendChild(cell);

//     cell = document.createElement("td");
//     cell.innerText = questions[i].getCorrect().toString();
//     row.appendChild(cell);

//     cell = document.createElement("td");
//     cell.innerText = (questions[i].getTime()/1000).toFixed(2).toString();
//     row.appendChild(cell);

//     cell = document.createElement("td");
//     cell.innerText = quiz.getPenalty().toString();
//     row.appendChild(cell);

//     table.appendChild(row);
//   }
// }

function getData(more_data : boolean) {
  let correct = 0;
  let penalty = 0;
  let avg = 0.;
  let slowest = 0;
  let fastest = 100000000000000000000;

  for (let i = 0; i < quiz_size; i++) {
    if (question_status[i] === QuestionStatus.Correct)
      correct++;
    // else
      // penalty += quiz.getPenalty();
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
    // result: correct.toString() + '/' + quiz_size.toString() ,
    score: score.toFixed(2),
    penalty: _penalty,
    avg: _avg,
    slowest: _slowest,
    fastest: _fastest
  }
}

function save() {
  // if (!window.indexedDB) {
  //   console.log("Your browser doesn't support a stable version of IndexedDB. Statistics feature will not be available.");
  // } else {
  //   let openRequest = window.indexedDB.open("store");

  //   openRequest.onsuccess = () => {
  //     let db = openRequest.result;
  //     let transaction = db.transaction(["statistics"], "readwrite");

  //     transaction.oncomplete = function(e : Event) {
  //       console.log("All done!");
  //       db.close();
  //     };

  //     let objectStore = transaction.objectStore("statistics");
  //     let request = objectStore.add(getData(more_data));
  //     request.onsuccess = function(e : Event) {
  //       console.log(request.result);
  //       console.log("Added successfully");
  //     };
  //   };
  // }
  setTimeout(function(){ window.location.replace('/top/' + getQuizId()); }, 100);
  // window.location.replace('dashboard.html');
}

// withStatsBtn.addEventListener("click", () => save(true));
// noStatsBtn.addEventListener("click", () => save(false));

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

function pad(val : number) {
  var valString = val + "";
  if (valString.length < 2) {
    return "0" + valString;
  } else {
    return valString;
  }
}