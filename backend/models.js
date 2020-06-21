"use strict";
exports.__esModule = true;
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
exports.Question = Question;
