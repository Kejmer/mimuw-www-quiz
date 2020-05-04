var queryString = window.location.search;
function getQuiz() {
    var quiz_option = document.querySelector('#quiz');
    window.location.replace('quiz.html?quiz=' + quiz_option.value);
}
document.getElementById("start").addEventListener("click", function (e) { return getQuiz(); });
var table = document.getElementById("stats");
function isReportedValues(obj) {
    return true;
}
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
            // let index = objectStore.index('id_idx');
            var request = objectStore.getAll();
            request.onsuccess = function (e) {
                // let cursor : IDBObjectStore = e.target.result;
                console.log(request);
                var values = request.result;
                for (var i = 0; i < values.lenght; i++)
                    if (isReportedValues(values[i])) {
                        var row = document.createElement("tr");
                        var cell = document.createElement("td");
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
                    }
                // cursor.continue();
            };
            db.close();
        };
    }
}
fillTable();
