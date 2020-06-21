function getQuiz() {
  const quiz_option = document.querySelector('#quiz') as HTMLSelectElement;
  window.location.replace('top/' + quiz_option.value);
}
document.getElementById("start").addEventListener("click", (e:Event) => getQuiz());
