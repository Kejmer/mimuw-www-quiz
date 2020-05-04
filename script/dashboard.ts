const queryString = window.location.search;

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
      // let index = objectStore.index('id_idx');

      let request = objectStore.getAll();
      request.onsuccess = function(e : Event) {
        // let cursor : IDBObjectStore = e.target.result;
        console.log(request);
        let values = request.result;

        let row = document.createElement("tr");

        let cell = document.createElement("td");
        if (values.when !== undefined)
          cell.innerText = values.when;
        row.appendChild(cell);

        cell = document.createElement("td");
        if (values.quiz !== undefined)
          cell.innerText = values.quiz;
        row.appendChild(cell);

        cell = document.createElement("td");
        if (values.result !== undefined)
          cell.innerText = values.result;
        row.appendChild(cell);

        cell = document.createElement("td");
        if (values.score !== undefined)
          cell.innerText = values.score;
        row.appendChild(cell);

        cell = document.createElement("td");
        if (values.avg !== undefined)
          cell.innerText = values.avg + 's';
        row.appendChild(cell);

        cell = document.createElement("td");
        if (values.penalty !== undefined)
          cell.innerText = values.penalty;
        row.appendChild(cell);

        cell = document.createElement("td");
        if (values.fastest !== undefined)
          cell.innerText = values.fastest + 's';
        row.appendChild(cell);

        cell = document.createElement("td");
        if (values.slowest !== undefined)
          cell.innerText = values.slowest + 's';
        row.appendChild(cell);

        table.appendChild(row);
        cursor.continue();
      };
      db.close();
    };
  }
}

fillTable();
