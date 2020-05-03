var queryString = window.location.search;
// let startBtn = document.getElementById("start") as HTMLButtonElement;
// console.log(startBtn);
function getQuiz() {
    // const ref_link = document.getElementById('quiz-submit') as HTMLLinkElement;
    var quiz_option = document.querySelector('#quiz');
    // startBtn.href = 'quiz.html?quiz=' + quiz_option.value;
    window.location.replace('quiz.html?quiz=' + quiz_option.value);
}
document.getElementById("start").addEventListener("click", function (e) { return getQuiz(); });
