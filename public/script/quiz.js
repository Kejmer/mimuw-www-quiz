/***************************************************************************/
/****************************** CLASSES ************************************/
/***************************************************************************/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var Question = /** @class */ (function () {
    function Question(question_no, question, options, pick, correct_answer, time) {
        this.question_no = question_no;
        this.question = question;
        this.options = options;
        this.pick = pick;
        this.correct_answer = correct_answer;
        this.time = time;
        this.scoreboard_id = 0;
        this.start_time = new Date();
    }
    Question.prototype.getQuestion = function () {
        return this.question;
    };
    Question.prototype.getOptions = function () {
        return this.options;
    };
    Question.prototype.getPick = function () {
        return this.pick;
    };
    Question.prototype.setPick = function (pick) {
        this.pick = pick;
    };
    Question.prototype.getTime = function () {
        return this.time;
    };
    Question.prototype.active = function () {
        this.start_time = new Date();
    };
    Question.prototype.getQuestionNo = function () {
        return this.question_no;
    };
    Question.prototype.getScoreboard = function () {
        return this.scoreboard_id;
    };
    Question.prototype.setScoreboard = function (id) {
        this.scoreboard_id = id;
    };
    Question.prototype.getCorrect = function () {
        return this.correct_answer;
    };
    Question.prototype.inactive = function () {
        var end_time = new Date();
        this.time += end_time.getTime() - this.start_time.getTime();
    };
    Question.prototype.getPacked = function () {
        var result = [];
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
    };
    return Question;
}());
/***************************************************************************/
/**************************** QUIZ FIELDS **********************************/
/***************************************************************************/
var questionField = document.querySelector("section#question p#equation");
var counterField = document.querySelector("section#question p#counter");
var answerField = document.querySelector("section#answers");
var btnField = document.querySelector("nav#question-btns");
var answers = document.querySelectorAll(".quiz-ans p");
/***************************************************************************/
/****************************** BUTTONS ************************************/
/***************************************************************************/
var withStatsBtn = document.getElementById('with-stats');
var noStatsBtn = document.getElementById('no-stats');
var prevBtn = document.getElementById("previous");
var cancelBtn = document.getElementById("cancel");
var startBtn = document.getElementById("start");
var nextBtn = document.getElementById("next");
var stopBtn = document.getElementById("stop");
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
var quiz_status = QuizStatus.Loaded;
var QuestionStatus;
(function (QuestionStatus) {
    QuestionStatus[QuestionStatus["Empty"] = 0] = "Empty";
    QuestionStatus[QuestionStatus["Picked"] = 1] = "Picked";
    QuestionStatus[QuestionStatus["Correct"] = 2] = "Correct";
    QuestionStatus[QuestionStatus["Incorrect"] = 3] = "Incorrect";
})(QuestionStatus || (QuestionStatus = {}));
var question_status = [];
var current_question = 0;
var picks = [];
var answered_num = 0;
var optionsRange = 4;
var score = 0;
var quiz_size;
var questions = [];
quizStart();
function isFetchData(obj) {
    return obj.questions !== undefined && obj.scoreboard_id !== undefined;
}
function createQuestions(question_desc) {
    if (isFetchData(question_desc)) {
        return question_desc.questions.map(function (q) {
            var quest = new Question(q.question_no, q.question, q.options, q.pick, q.correct, q.time);
            quest.setScoreboard(question_desc.scoreboard_id);
            return quest;
        });
    }
    window.location.replace("/");
    return [];
}
function getQuizId() {
    var url = window.location.toString();
    var id = url.substring(url.lastIndexOf('/') + 1);
    return id;
}
function quizStart() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, i, _pick, _loop_1, i;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (quiz_status !== QuizStatus.Loaded)
                        return [2 /*return*/];
                    _a = createQuestions;
                    return [4 /*yield*/, fetchQuestions()];
                case 1:
                    questions = _a.apply(void 0, [_b.sent()]);
                    quiz_size = questions.length;
                    picks = questions.map(function (x) { return x.getPick(); });
                    quiz_status = QuizStatus.Running;
                    for (i = 0; i < quiz_size; i++) {
                        _pick = picks[i];
                        if (_pick !== -1)
                            quiz_status = QuizStatus.Finished;
                        if (_pick === -1) {
                            question_status[i] = QuestionStatus.Empty;
                        }
                        else {
                            if (questions[i].getOptions()[_pick] === questions[i].getCorrect()) {
                                question_status[i] = QuestionStatus.Correct;
                            }
                            else {
                                question_status[i] = QuestionStatus.Incorrect;
                            }
                        }
                    }
                    if (quiz_status === QuizStatus.Finished) {
                        document.getElementById("timer").style.display = "none";
                        document.getElementById("time_percent").style.display = "block";
                    }
                    _loop_1 = function (i) {
                        var ans = answers[i];
                        ans.parentElement.onclick = function () {
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
                        };
                    };
                    for (i = 0; i < optionsRange; i++) {
                        _loop_1(i);
                    }
                    current_question = 0;
                    prevBtn.disabled = true;
                    if (quiz_size === 1)
                        nextBtn.disabled = true;
                    setAnswers();
                    questions[current_question].active();
                    showQuiz();
                    return [2 /*return*/];
            }
        });
    });
}
/***************************************************************************/
/****************************** DISPLAY ************************************/
/***************************************************************************/
function noPickDisplay() {
    for (var i = 0; i < optionsRange; i++) {
        var ans = answers[i];
        ans.parentElement.classList.remove("picked");
        ans.parentElement.classList.remove("correct");
        ans.parentElement.classList.remove("incorrect");
    }
}
function setAnswers() {
    noPickDisplay();
    if (quiz_status === QuizStatus.Finished) {
        updatePercent(questions[current_question].getTime());
        for (var i = 0; i < optionsRange; i++) {
            if (questions[current_question].getOptions()[i] === questions[current_question].getCorrect())
                answers[i].parentElement.classList.add("correct");
        }
    }
    if (picks[current_question] !== -1) {
        var ans = answers[picks[current_question]];
        var status_1;
        switch (question_status[current_question]) {
            case QuestionStatus.Incorrect:
                status_1 = "incorrect";
                break;
            case QuestionStatus.Correct:
                status_1 = "correct";
                break;
            case QuestionStatus.Picked:
            default:
                status_1 = "picked";
        }
        ans.parentElement.classList.add(status_1);
    }
    questionField.innerText = questions[current_question].getQuestion();
    counterField.innerText = (current_question + 1).toString() + '/' + quiz_size.toString();
    var options = questions[current_question].getOptions();
    for (var i = 0; i < optionsRange; i++) {
        var ans = answers[i];
        ans.innerText = options[i].toString();
    }
}
function showQuiz() {
    answerField.classList.remove("hidden");
    btnField.classList.remove("hidden");
    startBtn.style.display = "none";
}
function updatePercent(value) {
    document.getElementById('percent').textContent = value.toString() + "%";
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
nextBtn.addEventListener("click", function () { return nextQuestion(); });
prevBtn.addEventListener("click", function () { return prevQuestion(); });
cancelBtn.addEventListener("click", function () { return quizCancel(); });
stopBtn.addEventListener("click", function () { return quizStop(); });
/***************************************************************************/
/**************************** QUIZ "BACKEND" *******************************/
/***************************************************************************/
function fetchQuestions() {
    return new Promise(function (res, rej) {
        fetch("http://localhost:8080/q/json/" + getQuizId(), {
            method: 'GET',
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:8080'
            }
        })
            .then(function (result) { return result.json(); })
            .then(function (data) { return res(data); });
    });
}
function getTimes() {
    var array = [];
    for (var i = 0; i < questions.length; i++)
        array.push(questions[i].getTime());
    return array;
}
function postAnswers() {
    return __awaiter(this, void 0, void 0, function () {
        var csrfInput, times;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    csrfInput = document.getElementById('csrf');
                    times = getTimes();
                    return [4 /*yield*/, fetch("http://localhost:8080/q/" + getQuizId(), {
                            method: 'POST',
                            body: JSON.stringify({
                                picks: picks,
                                times: times,
                                scoreboard_id: questions[0].getScoreboard()
                            }),
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-Token': csrfInput.value
                            }
                        })];
                case 1:
                    _a.sent();
                    window.location.replace('/top/' + getQuizId());
                    return [2 /*return*/];
            }
        });
    });
}
function quizCancel() {
    if (quiz_status !== QuizStatus.Running)
        return;
    window.location.replace('cancel/' + getQuizId());
}
function quizStop() {
    if (quiz_status !== QuizStatus.Running)
        return;
    for (var i = 0; i < quiz_size; i++) {
        if (picks[i] < 0 || 4 <= picks[i])
            return;
    }
    questions[current_question].inactive();
    cancelBtn.disabled = true;
    stopBtn.disabled = true;
    postAnswers();
}
/***************************************************************************/
/**************************** TIMER ****************************************/
/***************************************************************************/
var minutesLabel = document.getElementById("minutes");
var secondsLabel = document.getElementById("seconds");
var totalSeconds = 0;
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
