var queryString = window.location.search;
// let startBtn = document.getElementById("start") as HTMLButtonElement;
// console.log(startBtn);
function getQuiz() {
    var quiz_option = document.querySelector('#quiz');
    window.location.replace('quiz.html?quiz=' + quiz_option.value);
}
document.getElementById("start").addEventListener("click", function (e) { return getQuiz(); });
var table = document.getElementById("stats");
function fillTable() {
    if (!window.indexedDB) {
        console.log("Your browser doesn't support a stable version of IndexedDB. Statistics feature will not be available.");
    }
    else {
        var openRequest_1 = window.indexedDB.open("store");
        openRequest_1.onupgradeneeded = function () {
            var db = openRequest_1.result;
            var store = db.createObjectStore("statistics", {
                keyPath: 'id',
                autoIncrement: true
            });
            store.createIndex('id_idx', 'id', { unique: true });
        };
        openRequest_1.onerror = function (e) {
            console.log("error while opening database");
        };
        openRequest_1.onsuccess = function () {
            var db = openRequest_1.result;
            var transaction = db.transaction(["statistics"], 'readonly');
            var objectStore = transaction.objectStore("statistics");
            var index = objectStore.index('id_idx');
            index.openCursor().onsuccess = function (e) {
                var cursor = e.target.result;
                var row = document.createElement("tr");
                var cell = document.createElement("td");
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
                cursor["continue"]();
            };
            db.close();
        };
    }
}
fillTable();
