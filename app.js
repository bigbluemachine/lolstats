import './app.css';
const React = require('react');

// Constants...
const corsAnywhere = 'https://cors-anywhere.herokuapp.com/';
const baseUrl = 'https://na1.api.riotgames.com/';
const summonersApi = 'lol/summoner/v4/summoners/by-name/';
const matchlistsApi = 'lol/match/v4/matchlists/by-account/';
const matchApi = '/lol/match/v4/matches/';
const apiKey = 'RGAPI-b83c87fb-c58f-4635-96a0-66e95a36d95e';

class Match extends React.Component {
  constructor(props) {
    super(props);
    console.log(this.props.data);
  }

  render() {
    return (
      <div className="match">
        <span>
          { this.props.data['gameId'] }
        </span>
        <span>
          { this.props.data['champion'] }
        </span>
        <span>
          { this.props.data['lane'] }
        </span>
        <span>
          { this.props.data['role'] }
        </span>
      </div>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      errorText: false,
      summonerName: false,
      matchlist: false,
    };
    this.getStats = this.getStats.bind(this);
  }

  handleErrors(response) {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response;
  }

  getSummoner(name) {
    this.setState({errorText: false});

    var url = corsAnywhere + baseUrl + summonersApi;
    url += name;
    url += '?api_key=' + apiKey;

    return fetch(url)
      .then(this.handleErrors)
      .then((r) => { return r.json(); })
      .then((json) => { return this.handleSummonerJson(json) })
      .catch((e) => { this.setState({errorText: 'Summoner not found!'}); });
  }

  handleSummonerJson(json) {
    var url = corsAnywhere + baseUrl + matchlistsApi;
    url += json['accountId'];
    url += '?api_key=' + apiKey;

    return fetch(url)
      .then((r) => { return r.json(); })
      .then((json) => { return this.handleMatchlistJson(json); });
  }

  handleMatchlistJson(json) {
    this.setState({matchlist: json['matches']});
  }

  getStats() {
    const summonerName = document.getElementById('summoner-name').value;
    this.setState({summonerName: summonerName});
    this.getSummoner(summonerName);
  }

  render() {
    return (
      <div>
        <div className="fields">
          <input id="summoner-name"
                 type="text"
                 size="32"
                 placeholder="Enter summoner name" />
          <button onClick={this.getStats}>Get Stats</button>
          <span className="errorText">{this.state.errorText}</span>
        </div>
        { this.state.summonerName ?
        <div className="stats">
          { !this.state.matchlist ?
            <span>Loading match history...</span>
            : this.state.matchlist.map((m) => <Match key={m['gameId']} data={m}></Match>)
          }
        </div>
        : null}
      </div>
    );
  }
}

export default App;