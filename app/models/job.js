var _ = require('lodash');
var Promise = require('bluebird');
var redis = require('redis');
Promise.promisifyAll(redis);
var redisClient = redis.createClient();

function Job(key_or_url) {
  // key or url required
  if (typeof(key_or_url) !== 'string') { // missing key
    throw new Error("Invalid Job: url/key is not defined for this job - "+key_or_url);
  } else if (key_or_url.match("^"+this.KEY_PRE)) { // key
    this.key = key_or_url;
    this.url = key_or_url.slice(this.KEY_PRE.length);
  } else { // url
    this.url = key_or_url;
    this.key = this.KEY_PRE + this.url;
  }

  this.status = this.STATUSES['none'];
  this.result = 'N/A';

  this.redisData = function() {
    return {
      key: this.key,
      url: this.url,
      status: this.status,
      result: this.result
    }
  }

  this.browserData = function() {
    return {
      key: this.key,
      url: this.url,
      status: this.status
    }
  }

  this.fetch = function() {
    var self = this;
    return redisClient.hgetallAsync(self.key).then(function(obj) {
      self.url = obj.url;
      self.status = obj.status;
      if (obj.result) { self.result = obj.result; }
      return self;
    }).catch(function(err) {
      self.setStatus('error', 'Redis error: '+err);
      throw err;
    });
  }

  this.save = function() {
    console.log('saving job '+this.key+', stat='+this.status+', data=');
    console.log(this.redisData());
    var self = this;
    return redisClient.hmsetAsync(this.key, this.redisData())
      .then(function() { return self; })
      .catch(function(err) {
        self.setStatus('error', 'Redis error: could not save job -- '+err);
        throw err;
      });
  }

  this.setStatus = function(status, result) {
    this.status = this.STATUSES[status];
    if (result) {
      this.result = result;
    }
  }
}

Job.prototype.KEY_PRE = 'v1:urls:';
// valid job statuses starting with none
Job.prototype.STATUSES = {
  none: 'None',
  queued: 'Queued',
  processing: 'Processing',
  success: 'Success',
  error: 'Error',
}
Job.prototype.fetchAll = function() {
  var statuses = Array.prototype.slice.call(arguments);
  var jobs = redisClient.keysAsync(this.KEY_PRE+'*')
    .map(function(key) {
      var job = new Job(key);
      console.log('fetching job: ',job.key);
      return job.fetch();
    }).filter(function(job) {
      if (statuses.length) {
        return _.includes(statuses, job.status);
      } else { // no filtering
        return true;
      }
    });
  return jobs;
}

module.exports = Job;
