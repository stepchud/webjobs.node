var _ = require('lodash');
var subscriber = require('redis').createClient();
var Job = require('./job');
var Worker = require('./worker');

function Queue() {
  var self = this;
  var jobs = Promise.resolve(true);

  // listen for new jobs added
  this.start = function(concurrencyLimit) {
    subscriber.subscribe('job:created');
    subscriber.on('message', function(channel, message) {
      console.log("Message '" + message + "' on channel '" + channel + "' arrived!")
      if (channel === 'job:created') {
        var key = message;
        console.log('job created key=',key);
        jobs.then(function() {
          var w = new Worker();
          return w.work(key);
        });
      } else {
        console.log('unsubscribed event: '+channel);
      }
    });
    var STATUS = Job.prototype.STATUSES;
    // restart any jobs that are not in a final state on startup
    jobs = jobs.then(function() {
      Job.prototype.fetchAll(STATUS.none,STATUS.queued,STATUS.processing)
      .map(function(job) {
        console.log('filtered job status: '+job.status+' for key '+job.key);
        var w = new Worker();
        return w.work(job.key);
      }, {concurrency: concurrencyLimit});
    });
  }
}

module.exports = Queue;
