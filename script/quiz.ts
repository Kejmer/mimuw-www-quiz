/***************************************************************************/
/****************************** CLASSES ************************************/
/***************************************************************************/

let json_string = `{
  "question_count": 6,
  "min_prod": 5,
  "max_prod": 20,
  "min_qlen": 2,
  "max_qlen": 3,
  "variance": 20,
  "penalty": 5,
  "signs": ["+"]
}`;

interface QuizRules {
  question_count : number;
  min_prod : number;
  max_prod : number;
  min_qlen : number;
  max_qlen : number;
  variance : number;
  penalty : number;
  signs: string[];
}

function isQuizRules(obj : any) : obj is QuizRules {
  return ( obj.penalty !== undefined &&
    obj.question_count !== undefined &&
    obj.min_prod !== undefined &&
    obj.max_prod !== undefined &&
    obj.min_qlen !== undefined &&
    obj.max_qlen !== undefined &&
    obj.variance !== undefined &&
    obj.signs !== undefined );
}

const allowed_operations : Set<string> = new Set(['+', '-', '*']);

class Quiz {
  private success : boolean;
  private rules : QuizRules;
  private signs : string[];

  constructor(rules : string) {
    const parsed = JSON.parse(rules);
    if (isQuizRules(parsed)) {
      this.success = true;
      this.rules = parsed;
      this.rules.variance = Math.floor(this.rules.variance);
      this.rules.question_count = Math.floor(this.rules.question_count);

      const temp_set : Set<string> = new Set();
      for (const sign of parsed.signs) {
        if (allowed_operations.has(sign))
          temp_set.add(sign);
      }
      this.signs = Array.from(temp_set);
      if (this.signs.length <= 0 || this.rules.min_prod > this.rules.max_prod ||
          this.rules.min_qlen > this.rules.max_qlen || this.rules.min_qlen < 1 ||
          this.rules.variance < 0 || this.rules.question_count < 1)
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

  public getSimilar(num : number) : number {
    let random = Math.floor(Math.random() * this.rules.variance);
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
  private answer : number;

  private start_time : Date;
  private end_time : Date;
  private time : number;

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
          prod--;
          break;
        case '*':
          previous_prod *= prod;
          break;
        case '+':
        case '-':
          previous_prod = prod;
      }

      if (previous_prod < 0)
        this.question += '(' + prod.toString() + ')';
      else
        this.question += prod.toString();
    }
    const correct = eval(this.question);
    for (let i = 0; i < 4; i++)
      this.options[i] = quiz_template.getSimilar(correct);
    this.options[Math.floor(Math.random() * 4)] = correct;
  }

  public getOptions() : number[] {
    return this.options;
  }

  public getQuestion() : string {
    return this.question;
  }

  public checkAnswer(guess : number) {
    return eval(this.question) === this.options[guess];
  }

  public active() {
    this.start_time = new Date();
  }

  public inactive() {
    this.end_time = new Date();
    this.time += this.end_time.getTime() - this.start_time.getTime();
  }

  public getTime() {

  }
}


/***************************************************************************/
/**************************** QUIZ FIELDS **********************************/
/***************************************************************************/

let questionField = document.querySelector("section#question") as HTMLElement;
let answerField = document.querySelector("section#answers") as HTMLElement;
let btnField = document.querySelector("nav#question-btns") as HTMLElement;
let answers = document.querySelectorAll(".quiz-ans p") as NodeList;


/***************************************************************************/
/****************************** BUTTONS ************************************/
/***************************************************************************/

let prevBtn = document.getElementById("previous") as HTMLButtonElement;
let cancelBtn = document.getElementById("cancel") as HTMLButtonElement;
let startBtn = document.getElementById("start") as HTMLButtonElement;
let nextBtn = document.getElementById("next") as HTMLButtonElement;
let stopBtn = document.getElementById("stop") as HTMLButtonElement;


/***************************************************************************/
/******************************* SETUP *************************************/
/***************************************************************************/

enum QuizStatus {
  Loaded, Running, Finished
}
let quiz_status : QuizStatus = QuizStatus.Loaded;

let current_question : number = 0;
let picks : number[] = [];
let answered_num : number = 0;

let quiz : Quiz = new Quiz(json_string);
let quiz_size = quiz.getQuestionCount()
let questions : Question[] = [];
for (let i = 0; i < quiz_size; i++)
  questions[i] = new Question(quiz);


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
        status = "picked";
    }
    ans.parentElement.classList.add(status);
  }
  questionField.innerText = questions[current_question].getQuestion();

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

nextBtn.addEventListener( "click", (e : Event) => nextQuestion());
prevBtn.addEventListener( "click", (e : Event) => prevQuestion());
startBtn.addEventListener("click", (e : Event) => quizStart());
stopBtn.addEventListener( "click", (e : Event) => quizStop());

/***************************************************************************/
/**************************** QUIZ "BACKEND" *******************************/
/***************************************************************************/

function quizStart() {
  if (quiz_status === QuizStatus.Loaded) {
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
}

function checkAnswers() {
  for (let i = 0; i < quiz_size; i++) {
    if (questions[i].checkAnswer(picks[i]))
      question_status[i] = QuestionStatus.Correct;
    else
      question_status[i] = QuestionStatus.Incorrect;
  }
}

function quizStop() {
  for (let i = 0; i < quiz_size; i++) {
    if (quiz_status !== QuizStatus.Running)
      return;
    if (picks[i] < 0 || optionsRange < picks[i])
      return;
    questions[current_question].inactive();
    stopBtn.disabled = true;
    checkAnswers();
    setAnswers();
    quiz_status = QuizStatus.Finished;
  }
}