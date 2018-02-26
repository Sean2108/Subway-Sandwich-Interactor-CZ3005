var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var swipl = require('swipl');

const app = express();

const order = ["meals", "breads", "meats", "veggies", "sauces", "topups", "sides", "end"];
var progress = 0;
let skipped = new Set();

app.use(bodyParser.json());
app.use(express.static('static'));
swipl.call('consult("logic.pl")');

// parse prolog json structure into an array
function getList(ret) { 
    var data = [];
    if (ret.tail == '[]') {
        if (typeof ret.head == 'string' || ret.head instanceof String) {
            data.push(ret.head);
            return data;
        }
        return getList(ret.head);
    }
    while (ret.tail) {
        data.push(ret.head);
        ret = ret.tail;
    }
    return data;
}

// send html file on landing page
app.get('/', (request, response) => {
    response.sendFile(path.join(__dirname + '/index.html'));
});

// send results of prolog ask query as json in get request to /queries
// skip if query returns empty list (eg empty list when ask_meats(X) is called if veggie meal was chosen)
app.get('/queries', (request, response) => {
    while (progress <= 6) {
        var ret = swipl.call('ask_' + order[progress] + '(X)').X;
        var data = getList(ret);
        if (data.length > 0) break;
        skipped.add(progress);
        console.log("skippping " + order[progress]);
        progress++;
    }
    if (progress > 6) {
        data = {};
        for (var i = 0; i < order.length - 1; i++) {
            if (skipped.has(i)) continue;
            var ret = swipl.call('show_' + order[i] + '(X)').X;
            var choiceData = getList(ret);
            data[order[i]] = choiceData;
        }
    }
    response.status(200).json({"choices" : data, "query" : order[progress]});
    if (progress > 6) process.exit(0);
});

// get user's chosen options and assert chosen
app.post('/data', (request, response) => {
    if (progress <= 6) {
        var data = request.body.value;
        if (!data.length) skipped.add(progress);
        for (var i = 0; i < data.length; i++) {
            swipl.call('assert(chosen_' + order[progress] + '(' + data[i] + '))');
        }
    }
    if (progress < 7) {
        progress++;
    }
    response.redirect('/queries');
});

//listen on port 8000
app.listen(8000, '0.0.0.0');
console.log("running on port 8000");
