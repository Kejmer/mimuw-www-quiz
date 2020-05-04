

const queryString = window.location.search;
// let startBtn = document.getElementById("start") as HTMLButtonElement;
// console.log(startBtn);


function getQuiz() {
  const quiz_option = document.querySelector('#quiz') as HTMLSelectElement;
  window.location.replace('quiz.html?quiz=' + quiz_option.value);
}
document.getElementById("start").addEventListener("click", (e:Event) => getQuiz());



let table = document.getElementById("stats") as HTMLElement;

function fillTable() {
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
      console.log("error while opening database");
    };

    openRequest.onsuccess = () => {
      let db = openRequest.result;
      let transaction = db.transaction(["statistics"], 'readonly');
      let objectStore = transaction.objectStore("statistics");
      let index = objectStore.index('id_idx');

      index.openCursor().onsuccess = function(e : Event) {
        let cursor = e.target.result;

        let row = document.createElement("tr");

        let cell = document.createElement("td");
        if (e.target.result.value.when !== undefined)
          cell.innerText = e.target.result.value.when;
        row.appendChild(cell);

        cell = document.createElement("td");
        if (e.target.result.value.quiz !== undefined)
          cell.innerText = e.target.result.value.quiz;
        row.appendChild(cell);

        cell = document.createElement("td");
        if (e.target.result.value.result !== undefined)
          cell.innerText = e.target.result.value.result;
        row.appendChild(cell);

        cell = document.createElement("td");
        if (e.target.result.value.score !== undefined)
          cell.innerText = e.target.result.value.score;
        row.appendChild(cell);

        cell = document.createElement("td");
        if (e.target.result.value.avg !== undefined)
          cell.innerText = e.target.result.value.avg + 's';
        row.appendChild(cell);

        cell = document.createElement("td");
        if (e.target.result.value.penalty !== undefined)
          cell.innerText = e.target.result.value.penalty;
        row.appendChild(cell);

        cell = document.createElement("td");
        if (e.target.result.value.fastest !== undefined)
          cell.innerText = e.target.result.value.fastest + 's';
        row.appendChild(cell);

        cell = document.createElement("td");
        if (e.target.result.value.slowest !== undefined)
          cell.innerText = e.target.result.value.slowest + 's';
        row.appendChild(cell);

        table.appendChild(row);
        cursor.continue();
      };
      db.close();
    };
  }
}

fillTable();
