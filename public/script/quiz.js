/***************************************************************************/
/****************************** CLASSES ************************************/
/***************************************************************************/
let quizes = [
    `{
  "question_count": 6,
  "description": "Nic dodać nic ująć!",
  "min_prod": 5,
  "max_prod": 20,
  "min_qlen": 2,
  "max_qlen": 3,
  "variance": 20,
  "penalty": 5,
  "signs": ["-"],
  "name": "Odejmujemy!"
}`,
    `{
  "question_count": 12,
  "description": "To ja jestem Spartakusem!",
  "min_prod": 1,
  "max_prod": 1000,
  "min_qlen": 1,
  "max_qlen": 2,
  "variance": 0,
  "penalty": 5,
  "signs": ["-"],
  "name": "Klony!"
}`,
    `{
  "question_count": 6,
  "description": "Mnoż Mnoż!",
  "min_prod": 2,
  "max_prod": 25,
  "min_qlen": 2,
  "max_qlen": 4,
  "variance": 40,
  "penalty": 5,
  "signs": ["*"],
  "name": "Mnożymy!"
}`,
    `{
  "question_count": 6,
  "description": "Nie wybrzydzam!",
  "min_prod": 5,
  "max_prod": 20,
  "min_qlen": 2,
  "max_qlen": 5,
  "variance": 20,
  "penalty": 5,
  "signs": ["+", "-", "3"],
  "name": "Mieszanka studencka!"
}`,
    `{
  "question_count": 15,
  "description": "Miej celne oko!",
  "min_prod": 10,
  "max_prod": 100,
  "min_qlen": 1,
  "max_qlen": 2,
  "variance": 100,
  "penalty": 999,
  "signs": ["+"],
  "name": "Szybkie Palce!"
}`,
    `{
  "question_count": 6,
  "description": "Dodaj tyle ile możesz!",
  "min_prod": 5,
  "max_prod": 20,
  "min_qlen": 2,
  "max_qlen": 3,
  "variance": 20,
  "penalty": 5,
  "signs": ["+"],
  "name": "Dodajemy!"
}`,
    `{
  "question_count": 10,
  "description": "Podziel się z całą klasą!",
  "min_prod": 2,
  "max_prod": 50,
  "min_qlen": 2,
  "max_qlen": 4,
  "variance": 50,
  "penalty": 13,
  "signs": ["/", "+", "*"],
  "name": "Ponad podziałami!"
}`
];
function isQuizRules(obj) {
    return (obj.penalty !== undefined &&
        obj.question_count !== undefined &&
        obj.description !== undefined &&
        obj.min_prod !== undefined &&
        obj.max_prod !== undefined &&
        obj.min_qlen !== undefined &&
        obj.max_qlen !== undefined &&
        obj.variance !== undefined &&
        obj.signs !== undefined &&
        obj.name !== undefined);
}
const allowed_operations = new Set(['+', '-', '*', '/']);
class Quiz {
    constructor(rules) {
        const parsed = JSON.parse(rules);
        if (isQuizRules(parsed)) {
            this.success = true;
            this.rules = parsed;
            this.rules.variance = Math.floor(this.rules.variance);
            this.rules.question_count = Math.floor(this.rules.question_count);
            const temp_set = new Set();
            for (const sign of parsed.signs) {
                if (allowed_operations.has(sign))
                    temp_set.add(sign);
            }
            this.signs = Array.from(temp_set);
            if (this.signs.length <= 0 || this.rules.min_prod > this.rules.max_prod ||
                this.rules.min_qlen > this.rules.max_qlen || this.rules.min_qlen < 1 ||
                this.rules.variance < 0 || this.rules.question_count < 1)
                this.success = false;
        }
        else {
            this.success = false;
        }
    }
    randomRange(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }
    getRandomProduct() {
        return this.randomRange(this.rules.min_prod, this.rules.max_prod);
    }
    getQuestionLength() {
        return this.randomRange(this.rules.min_qlen, this.rules.max_qlen);
    }
    getSign() {
        return this.signs[Math.floor(Math.random() * this.signs.length)];
    }
    getQuestionCount() {
        return this.rules.question_count;
    }
    getName() {
        return this.rules.name;
    }
    getDescription() {
        return this.rules.description;
    }
    getPenalty() {
        return this.rules.penalty;
    }
    getSimilar(num) {
        let random = Math.floor(Math.random() * this.rules.variance);
        const sign = Math.floor(Math.random() - 0.5);
        if (sign === 0)
            random = -random;
        return num + random;
    }
}
const optionsRange = 4;
class Question {
    constructor(quiz_template) {
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
                        }
                        else {
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
    getOptions() {
        return this.options;
    }
    getQuestion() {
        return this.question;
    }
    checkAnswer(guess) {
        return this.correct === this.options[guess];
    }
    active() {
        this.start_time = new Date();
    }
    inactive() {
        this.end_time = new Date();
        this.time += this.end_time.getTime() - this.start_time.getTime();
    }
    getTime() {
        return this.time;
    }
    getCorrect() {
        return this.correct;
    }
}
/***************************************************************************/
/**************************** QUIZ FIELDS **********************************/
/***************************************************************************/
let questionField = document.querySelector("section#question p#equation");
let counterField = document.querySelector("section#question p#counter");
let penaltyField = document.querySelector("#description p#penalty");
let descField = document.querySelector("#description p#desc");
let answerField = document.querySelector("section#answers");
let btnField = document.querySelector("nav#question-btns");
let quizName = document.querySelector("#quiz-name");
let answers = document.querySelectorAll(".quiz-ans p");
let table = document.querySelector("table#stats");
/***************************************************************************/
/****************************** BUTTONS ************************************/
/***************************************************************************/
let withStatsBtn = document.getElementById('with-stats');
let noStatsBtn = document.getElementById('no-stats');
let prevBtn = document.getElementById("previous");
let cancelBtn = document.getElementById("cancel");
let startBtn = document.getElementById("start");
let nextBtn = document.getElementById("next");
let stopBtn = document.getElementById("stop");
/***************************************************************************/
/******************************* SETUP *************************************/
/***************************************************************************/
var QuizStatus;
(function (QuizStatus) {
    QuizStatus[QuizStatus["Loaded"] = 0] = "Loaded";
    QuizStatus[QuizStatus["Running"] = 1] = "Running";
    QuizStatus[QuizStatus["Finished"] = 2] = "Finished";
    QuizStatus[QuizStatus["Cancel"] = 3] = "Cancel";
})(QuizStatus || (QuizStatus = {}));
let quiz_status = QuizStatus.Loaded;
let current_question = 0;
let picks = [];
let answered_num = 0;
let score = 0;
let quiz = new Quiz(quizes[Math.floor(Math.random() * quizes.length)]);
let quiz_size = quiz.getQuestionCount();
let questions = [];
for (let i = 0; i < quiz_size; i++)
    questions[i] = new Question(quiz);
penaltyField.innerText = "Kara za błędną odpowiedź: " + quiz.getPenalty().toString() + "s";
descField.innerText = quiz.getDescription();
quizName.innerText = quiz.getName();
function clearPick() {
    for (let i = 0; i < quiz_size; i++)
        picks[i] = -1;
    noPickDisplay();
}
for (let i = 0; i < optionsRange; i++) {
    const ans = answers[i];
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
    };
}
var QuestionStatus;
(function (QuestionStatus) {
    QuestionStatus[QuestionStatus["Empty"] = 0] = "Empty";
    QuestionStatus[QuestionStatus["Picked"] = 1] = "Picked";
    QuestionStatus[QuestionStatus["Correct"] = 2] = "Correct";
    QuestionStatus[QuestionStatus["Incorrect"] = 3] = "Incorrect";
})(QuestionStatus || (QuestionStatus = {}));
let question_status = [];
for (let i = 0; i < quiz_size; i++)
    question_status[i] = QuestionStatus.Empty;
/***************************************************************************/
/****************************** DISPLAY ************************************/
/***************************************************************************/
function noPickDisplay() {
    for (let i = 0; i < optionsRange; i++) {
        const ans = answers[i];
        ans.parentElement.classList.remove("picked");
        ans.parentElement.classList.remove("correct");
        ans.parentElement.classList.remove("incorrect");
    }
}
function setAnswers() {
    noPickDisplay();
    if (picks[current_question] !== -1) {
        const ans = answers[picks[current_question]];
        let status;
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
    const options = questions[current_question].getOptions();
    for (let i = 0; i < optionsRange; i++) {
        const ans = answers[i];
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
        cell.innerText = (i + 1).toString();
        row.appendChild(cell);
        cell = document.createElement("td");
        cell.innerText = questions[i].getOptions()[picks[i]].toString();
        row.appendChild(cell);
        cell = document.createElement("td");
        cell.innerText = questions[i].getCorrect().toString();
        row.appendChild(cell);
        cell = document.createElement("td");
        cell.innerText = (questions[i].getTime() / 1000).toFixed(2).toString();
        row.appendChild(cell);
        cell = document.createElement("td");
        cell.innerText = quiz.getPenalty().toString();
        row.appendChild(cell);
        table.appendChild(row);
    }
}
function getData(more_data) {
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
    let _fastest = undefined;
    let _slowest = undefined;
    let _avg = undefined;
    let _penalty = undefined;
    if (more_data) {
        _fastest = (fastest / 1000).toFixed(2);
        _slowest = (slowest / 1000).toFixed(2);
        _avg = ((avg / quiz_size) / 1000).toFixed(2);
        _penalty = penalty;
    }
    return {
        when: new Date().toLocaleString(),
        result: correct.toString() + '/' + quiz_size.toString(),
        score: score.toFixed(2),
        quiz: quiz.getName(),
        penalty: _penalty,
        avg: _avg,
        slowest: _slowest,
        fastest: _fastest
    };
}
function save(more_data) {
    if (!window.indexedDB) {
        console.log("Your browser doesn't support a stable version of IndexedDB. Statistics feature will not be available.");
    }
    else {
        let openRequest = window.indexedDB.open("store");
        openRequest.onupgradeneeded = () => {
            let db = openRequest.result;
            let store = db.createObjectStore("statistics", {
                keyPath: 'id',
                autoIncrement: true
            });
            store.createIndex('id_idx', 'id', { unique: true });
        };
        openRequest.onerror = function (e) {
            console.log("no i chuj no i cześć");
        };
        openRequest.onsuccess = () => {
            let db = openRequest.result;
            let transaction = db.transaction(["statistics"], "readwrite");
            transaction.oncomplete = function (e) {
                console.log("All done!");
                db.close();
            };
            let objectStore = transaction.objectStore("statistics");
            let request = objectStore.add(getData(more_data));
            request.onsuccess = function (e) {
                console.log(request.result);
                console.log("Added successfully");
            };
        };
    }
    setTimeout(function () { window.location.replace('dashboard.html'); }, 100);
    // window.location.replace('dashboard.html');
}
withStatsBtn.addEventListener("click", () => save(true));
noStatsBtn.addEventListener("click", () => save(false));
/***************************************************************************/
/**************************** TIMER ****************************************/
/***************************************************************************/
let minutesLabel = document.getElementById("minutes");
let secondsLabel = document.getElementById("seconds");
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
    }
    else {
        return valString;
    }
}
