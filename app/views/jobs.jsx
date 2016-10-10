var React = require('react');

var JobCreator = React.createClass({
  propTypes: {
    onCreate: React.PropTypes.func.isRequired
  },
  getInitialState: function() {
    return {
      url: ''
    };
  },
  changeUrl: function(ev) {
    this.setState({
      url: ev.target.value
    });
  },
  addJob: function(ev) {
    ev.preventDefault();

    this.props.onCreate(this.state.url);

    this.setState({
      url: ''
    });
  },
  render: function() {
    return (
      <form onSubmit={this.addJob}>
        <h4><label htmlFor='url'>Request A Url</label></h4>
        <div>
          <input type='text' id='Url' value={this.state.url} onChange={this.changeUrl} placeholder='www.google.com' size="64" maxlength="256" /><br />
          <button type='submit'>Submit Job</button>
        </div>
      </form>
    );
  }
});

var Jobs = React.createClass({
  componentDidMount: function() {
    var host = document.location.host.replace(/:.*/, '');
    this.ws = new WebSocket('ws://' + host + ':8111');
    this.ws.onmessage = this.onUpdate;
  },
  componentWillUnmount: function() {
    this.ws.close();
  },
  getInitialState: function() {
    return {
      jobs: (this.props.jobs || [])
    };
  },
  onCreate: function(url) {
    this.ws.send(url);
  },
  onUpdate: function(event) {
    var jobs = JSON.parse(event.data);
    this.setState({
      jobs: jobs
    });
  },
  render: function() {
    var jobs = this.state.jobs.map(function(job) {
      return <Job key={job.key} url={job.url} status={job.status} ></Job>;
    });
    if (!jobs.length) { jobs = <div><h3>Submit a url to begin</h3></div>; }

    return (
      <div>
        <h1>Jobs</h1>
        <JobCreator onCreate={this.onCreate}></JobCreator>
        <div>
        <table>
          <thead>
            <tr>
              <th>URL</th>
              <th>Status</th>
              <th>View Results</th>
            </tr>
          </thead>
          <tbody>
            {jobs}
          </tbody>
        </table>
        </div>
      </div>
    );
  }
});

var Job = React.createClass({
  render: function() {
    console.log('job status='+this.props.status);
    var href = "/jobs?url="+this.props.url
    var result_link = (['Success','Error'].indexOf(this.props.status) != -1) ?
      (<a href={href}>View Results</a>) :
      "Results pending..."
    return (
      <tr>
        <td>{this.props.url}</td>
        <td>{this.props.status}</td>
        <td>{result_link}</td>
      </tr>
    );
  }
});

module.exports.Jobs = Jobs;
