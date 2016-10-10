var _ = require('lodash');
var url = require('url')
var request = require('request-promise');
var Job = require('./job');

function Worker() {
  this.work = function(key) {
    var myJob = new Job(key);
    var requestUrl = myJob.url;
    if (!requestUrl.match('^https?://')) { requestUrl = 'http://'+requestUrl };
    console.log('requestUrl='+requestUrl);
    var updated = require('../events').updated;
    myJob.setStatus('processing');

    return myJob.save()
      .then(function(job) {
        return request.get({url: requestUrl});
      })
      .then(function(body) {
        console.log("request("+myJob.url+") completed, body="+body.slice(0,100));
        myJob.setStatus('success', body);
        return myJob.save();
      })
      .then(updated)
      .catch(function(err) {
        console.log('error in worker: '+err);
        myJob.setStatus('error', err.toString());
        return myJob.save().then(updated);
      });
  }
}

module.exports = Worker;
