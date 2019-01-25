import './app.css';
const React = require('react');

// Constants...
const corsAnywhere = 'https://cors-anywhere.herokuapp.com/';
const baseUrl = 'https://na1.api.riotgames.com/';
const summonersApi = 'lol/summoner/v4/summoners/by-name/';
const matchlistsApi = 'lol/match/v4/matchlists/by-account/';
const matchApi = 'lol/match/v4/matches/';
const apiKey = 'RGAPI-b83c87fb-c58f-4635-96a0-66e95a36d95e';

const pad = function (n) {
  if (('' + n).length >= 2) {
    return n;
  }
  return n < 10 ? '0' + n : n;
}

class Match extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      gameTime: undefined,
      outcome: undefined,
      duration: undefined,
      champion: undefined,
      level: undefined,
      kills: undefined,
      deaths: undefined,
      assists: undefined,
      items: undefined,
      creepScore: undefined,
    };
    this.getMatch(this.props.data['gameId']);
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const y = date.getFullYear();
    const M = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const m = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    return [y, M, d].join('/') + ' ' + [h, m, s].join(':');
  }

  formatDuration(duration) {
    const s = duration % 60;
    const m = (duration - s) / 60;
    return [pad(m), pad(s)].join(':');
  }

  showItems(items) {
    // TODO: Show item names.
    return items.join(', ');
  }

  showCreepScore(creepScore, duration) {
    var rate = 60 * creepScore / duration;
    rate = Math.round(100 * rate) / 100;
    return creepScore + ' (' + rate + '/min)';
  }

  getMatch(gameId) {
    var url = corsAnywhere + baseUrl + matchApi;
    url += gameId;
    url += '?api_key=' + apiKey;

    return fetch(url)
      .then((r) => { return r.json(); })
      .then((json) => { return this.handleMatchJson(json) });
  }

  handleMatchJson(game) {
    var participantId = -1;
    var ids = game['participantIdentities'];
    for (var i in ids) {
      const player = ids[i]['player'];
      if (player['summonerId'] === this.props.summonerId) {
        participantId = i;
        break;
      }
    }

    if (participantId === -1) {
      console.log('Participant not found in match (!?)');
      return;
    }
    const playerData = game['participants'][participantId];

    const teamId = playerData['teamId'];
    const outcome = game['teams'][(teamId / 100) - 1]['win'];
    var items = [];
    for (var i = 0; i < 8; i++) {
      const key = 'item' + i;
      if (playerData['stats'][key]) {
        items.push(playerData['stats'][key]);
      }
    }

    this.setState({
      gameTime: game['gameCreation'],
      outcome: outcome,
      duration: game['gameDuration'],
      champion: this.props.data['champion'],
      level: playerData['stats']['champLevel'],
      kills: playerData['stats']['kills'],
      deaths: playerData['stats']['deaths'],
      assists: playerData['stats']['assists'],
      items: items,
      creepScore: playerData['stats']['totalMinionsKilled'],
    });

    // TODO: icons, summoner name/spells/runes
    // console.log(playerData);

    this.setState({ loaded: true });
  }

  render() {
    return this.state.loaded ? (
      <tr>
        <td>
          { this.formatDate(this.state.gameTime) }
        </td>
        <td className={ this.state.outcome === 'Win' ? 'win' : 'fail'}>
          { this.state.outcome }
        </td>
        <td>
          { this.formatDuration(this.state.duration)}
        </td>
        <td>
          { this.state.champion }
        </td>
        <td>
          { this.state.level }
        </td>
        <td>
          { this.state.kills }/{ this.state.deaths }/{ this.state.assists }
        </td>
        <td>
          { this.showItems(this.state.items) }
        </td>
        <td>
          { this.showCreepScore(this.state.creepScore, this.state.duration) }
        </td>
      </tr>
    ) : null;
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      errorText: undefined,
      summonerName: undefined,
      summonerId: undefined,
      matchlist: undefined,
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
    this.setState({
      errorText: false,
      matchlist: undefined,
    });

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
    this.setState({summonerId: json['id']});

    var url = corsAnywhere + baseUrl + matchlistsApi;
    url += json['accountId'];
    url += '?api_key=' + apiKey;

    return fetch(url)
      .then((r) => { return r.json(); })
      .then((json) => { return this.handleMatchlistJson(json); });
  }

  handleMatchlistJson(json) {
    // this.setState({matchlist: json['matches']});
    // TODO: To reduce rate for demo purposes, get only the first few.

    var toShow = [];
    for (var i in json['matches']) {
      toShow.push(json['matches'][i]);
      if (toShow.length >= 3) {
        break;
      }
    }
    this.setState({matchlist: toShow});
  }

  getStats() {
    const summonerName = document.getElementById('summoner-name').value;
    this.setState({summonerName: summonerName});
    this.getSummoner(summonerName);
  }

  render() {
    return (
      <div>
        <div className="msg">
          Notes:<br />
          To limit the rate, I'm displaying up to the first 3 returned matches.
        </div>
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
            : <table>
              <tbody>
                <tr>
                  <th>Game time</th>
                  <th>Outcome</th>
                  <th>Duration</th>
                  <th>Champion</th>
                  <th>Level</th>
                  <th>K/D/A</th>
                  <th>Items</th>
                  <th>Creep score</th>
                </tr>
                { this.state.matchlist.map((m) => <Match key={m['gameId']} data={m} summonerId={this.state.summonerId}></Match>) }
              </tbody>
            </table>
          }
        </div>
        : null}
      </div>
    );
  }
}

export default App;