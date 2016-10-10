var _ = require('lodash');
var path = require('path');
var server = require('http').createServer();
var express = require('express');
var ejs = require('ejs');
var app = express();
var Models = require('./models');

// CONFIG PORTS
const PORT = process.env.PORT || 8000;
const WS_PORT = process.env.WS_PORT || 8111; // websockets

// EVENTS
var Events = require('./events');
Events.start(server);

// ROUTES
app.get('/jobs', function(req, res) { // list current jobs
  if (req.query.url) { // fetch specific job
    var job = new Models.Job(req.query.url);
    job.fetch().then(function(job) {
      res.render('job', {job: job});
    })
    .catch(function(err) {
      res.status(404).send('No job found.');
    });
  } else { // index jobs
    Models.Job.prototype.fetchAll().then(function(jobs) {
      var jdata = _.map(jobs, function(j) {
        return j.browserData();
      });
      res.json(jdata);
    });
  }
});

// VIEWS
app.engine('html', ejs.renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.use(express.static(__dirname + '/public'));

// JOB QUEUE
var q = new Models.Queue();
q.start(process.env.WORKERS || 5);

server.on('request', app);
server.listen(WS_PORT, function () { console.log('Listening on ' + server.address().port) });
app.listen(PORT);
