var _ = require('lodash');
var http = require('http');
var request = require('request');

function Weather(params) {
    _.extend(this, {
        usernames: 'chu8',
        data: null,
        api_id: ''
    }, params)
}

Twitch.prototype = {

    getWeatherStatus: function() {
        return this.stream;
    },

    checkStatus: function(zip) {
        // todo: extend username to take usernameS and iterate through, checking the status of our streamer
        var self = this;
        var options = {
            url: 'http://api.openweathermap.org/data/2.5/weather?zip='+zip+',us'
            headers: {
                'Accept': 'application/vnd.twitchtv.v3+json'
            }
        };

        function callback(error, response, body) {
          if (!error && response.statusCode == 200) {
                var info = JSON.parse(body);
            } else {
                console.log(response);
                console.log(error);
            }
        }
        request(options, callback);
    }
}

module.exports = Weather;