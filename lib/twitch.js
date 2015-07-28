var _ = require('lodash');
var http = require('http');
var request = require('request');

function Twitch(params) {
    _.extend(this, {
        username: 'gamesdonequick',
        stream: null,
        client_id: 'dclpp8e34vr3qxs55blxaznfk4lxvkr'
    }, params)
}

Twitch.prototype = {

    getStreamStatus: function() {
        return this.stream;
    },

    checkStatus: function() {

        // todo: extend username to take usernameS and iterate through, checking the status of our streamer
        var self = this;
        var options = {
            url: 'https://api.twitch.tv/kraken/streams/' + this.username,
            headers: {
                'Accept': 'application/vnd.twitchtv.v3+json'
            }
        };

        function callback(error, response, body) {
          if (!error && response.statusCode == 200) {
                var info = JSON.parse(body);
                self.stream = info.stream;
            } else {
                console.log(response);
                console.log(error);
            }
        }
        request(options, callback);
    }
}

module.exports = Twitch;