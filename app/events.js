var _ = require('lodash');
var Promise = require('bluebird');
var url = require('url');
var Job = require('./models/job');

var broadcastWebsocket = function() {
  console.log('broadcasting current jobs to %s clients', wss.clients.length);
  Job.prototype.fetchAll().then(function(jobs) {
    var jobsData = _.map(jobs, function(j) { return j.browserData(); });
    _.each(wss.clients, function(client) {
      client.send(JSON.stringify(jobsData));
    });
  });
}

var publishRedis = function(key) {
  return redisPub.publishAsync('job:created', key)
    .then(function(result) {
      return key;
    });
}

// start the websocket server and redis publisher
var wss, redisPub;
var start = function(server) {
  var WebSocketServer = require('ws').Server;
  wss = new WebSocketServer({ server: server });
  wss.on('connection', function connection(ws) {
    var location = url.parse(ws.upgradeReq.url, true);
    ws.on('message', function incoming(message) {
      if (message) { newJob(message); }
    });

    Job.prototype.fetchAll().then(function(jobs) {
      var jobsData = _.map(jobs, function(j) { return j.browserData(); });
      ws.send(JSON.stringify(jobsData));
    });
  });

  var redis = require('redis');
  Promise.promisifyAll(redis);
  redisPub = redis.createClient();
}

var newJob = function(key) {
  var job = new Job(key);
  var publishRedisFn = _.partial(publishRedis, key);
  job.save().then(publishRedisFn).then(broadcastWebsocket);
}

var updatedJob = function(job) {
  // only web clients care about updated jobs
  broadcastWebsocket();
  return job;
}

// PUBLIC API
module.exports = {
  start: start,
  updated: updatedJob
}
