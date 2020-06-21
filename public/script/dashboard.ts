// const queryString = window.location.search;

function getQuiz() {
  const quiz_option = document.querySelector('#quiz') as HTMLSelectElement;
  window.location.replace('top/' + quiz_option.value);
}
document.getElementById("start").addEventListener("click", (e:Event) => getQuiz());

// let table = document.getElementById("stats") as HTMLElement;

// interface reportedValues {
//   when: string;
//   quiz: string;
//   result: string;
//   score: string;
//   avg: string;
//   fastest: string;
//   slowest: string;
//   penalty: string;
// }

// function isReportedValues(obj : any) : obj is reportedValues {
//   return true;
// }

// interface Result {
//   result: any;
// }

// function hasResult(obj : any) : obj is Result {
//   return obj.result !== undefined;
// }

// interface Value_ {
//   value: any;
//   continue: any;
// }

// function hasValue(obj : any) : obj is Value_ {
//   return obj.values !== undefined ;
// }


// function fillTable() {
//   if (!window.indexedDB) {
//     console.log("Your browser doesn't support a stable version of IndexedDB. Statistics feature will not be available.");
//   } else {
//     let openRequest = window.indexedDB.open("store");

//     openRequest.onupgradeneeded = () => {
//       let db = openRequest.result;
//       let store = db.createObjectStore("statistics", {
//         keyPath: 'id',
//         autoIncrement: true
//       });
//       store.createIndex('id_idx', 'id', { unique: true });
//     };

//     openRequest.onerror = function(e : Event) {
//       console.log("error while opening database");
//     };

//     openRequest.onsuccess = () => {
//       let db = openRequest.result;
//       let transaction = db.transaction(["statistics"], 'readonly');
//       let objectStore = transaction.objectStore("statistics");
//       let index = objectStore.index('id_idx');

//       index.openCursor().onsuccess = function(e : Event) {
//         if (hasResult(e.target)) {
//           let cursor = e.target.result;
//           if (cursor) {

//             let values = cursor.value;
//             let row = document.createElement("tr");

//             let cell = document.createElement("td");
//             if (values.when !== undefined)
//               cell.innerText = values.when;
//             row.appendChild(cell);

//             cell = document.createElement("td");
//             if (values.quiz !== undefined)
//               cell.innerText = values.quiz;
//             row.appendChild(cell);

//             cell = document.createElement("td");
//             if (values.result !== undefined)
//               cell.innerText = values.result;
//             row.appendChild(cell);

//             cell = document.createElement("td");
//             if (values.score !== undefined)
//               cell.innerText = values.score;
//             row.appendChild(cell);

//             cell = document.createElement("td");
//             if (values.avg !== undefined)
//               cell.innerText = values.avg + 's';
//             row.appendChild(cell);

//             cell = document.createElement("td");
//             if (values.penalty !== undefined)
//               cell.innerText = values.penalty;
//             row.appendChild(cell);

//             cell = document.createElement("td");
//             if (values.fastest !== undefined)
//               cell.innerText = values.fastest + 's';
//             row.appendChild(cell);

//             cell = document.createElement("td");
//             if (values.slowest !== undefined)
//               cell.innerText = values.slowest + 's';
//             row.appendChild(cell);

//             table.appendChild(row);
//             cursor.continue();
//           }
//         }
//       };
//       db.close();
//     };
//   }
// }
// fillTable();
