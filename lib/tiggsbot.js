/* Bot interface, works by running an event loop that tracks
input by users, and buffers messages into a global msg queue. Messages
get written every this.interval miliseconds to prevent spamming the IRC server */


var irc = require('irc')
var WordPOS = require('wordpos'), 
    wordpos = new WordPOS(); 

var _ = require('lodash');
var msg = new Array();

var Twitch = new require('./twitch'),
    twitch = new Twitch();
    

function TiggsBot(params) {
    _.extend(this, {
        isActive: false,
        username: 'tiggsbot',
        channel: '#tiggstest',
        server: 'irc.freenode.net',
        client: null,
        opts: {
            replaceQuantity: 1,
        },
        interval: 1000,
        delay: {
            setCommand: {timer: 1000, last: new Date() },
            replaceNoun: {timer: 3600000, last: new Date() },
            hooter: {timer: 3600000, last: new Date() },
            checkTwitch: {timer: 3600000, last: new Date() }
        },
        commands: {
            twitch: { funcName: 'sayTwitchStatus' },
            checkTwitch: false,
            replaceNoun: false,
            hooter: false,
            help: { message: 'Available commands: [help, checkTwitch, replaceNoun, hooter, quit]' },
            quit: { message: 'quitting', funcName: 'disconnect' }
        },
        twitch: new Twitch(),
    }, params);
}

TiggsBot.prototype = {
    connect: function() {
        var self = this;
        this.client = new irc.Client(this.server, this.username, {
            channels: [this.channel],
        });

        this.isActive = true;

        this.client.addListener('error', function(message) {
            console.log('error: ', message);
        });

        this.client.addListener('message' + this.channel, function (from, message) {
                self.parseMessage(from, message);
            }
        );

        setInterval(this.checkTwitch.bind(this), this.delay.checkTwitch.delay);
        setInterval(this.say.bind(this), this.interval);
    },

    disconnect: function() {
        this.client.disconnect();
        console.log('disconnecting');
        this.isActive = false;
    },

    say: function() {
        // Store messages into an array and pop them through the event loop
        // Probably would be easier to just have an observer watching changes in msg
        var self = this;
        if (msg.length > 0) {
            msg.forEach(function(m) {
                console.log('trying to write ' + msg);
                if (self.isActive) {
                    self.client.say(self.channel, m);
                }
                msg.pop(m);
            });
        } 
    },

    parseMessage: function(from, message) {
        var self = this;
        var now = new Date();

        // we want to set "tasks" so we're not spamming the channel
        var queue = [];
        var delay = self.delay;
        console.log(from + ':' + message);

        _.forEach(delay, function(val, key) {
            var last = delay[key].last;
            var diff = now - last;
            if (diff > delay[key].timer) {
                self.delay[key].last = now;

                // calls all the function names in the self.delay object
                // then runs it, passing the from/message strings in
                self[key](from, message);
            }            
        });
    },

    setCommand: function(from, message) {
        // allows users to control the via IRC
        // Control is triggered by prepending a message with ![this.username] then command
        // List of commands:

        // quit - turns bot off
        // help - lists these commands
        // twitch - toggles twitch checking on/off
        // replacenoun - toggles mirroring people's nouns with words
        // hooter - toggles hooter 

        var self = this;
        // get a trigger
        var r = new RegExp('^(' + this.username + '):? (\\w+)');
        var m = r.exec(message);
        if (m !== null && m.length > 0) {
            // match result will have message as 0, trigger as 1, command as 2
            var command = m[2];
            var options = Object.keys(self.commands);
            console.log(message, options.indexOf(command));

            if (options.indexOf(command) > -1) {
                options.forEach(function(key) {
                    if (command === key.toString()) {
                        console.log(typeof self.commands[key]);
                        if (typeof self.commands[key] === 'object' && self.commands[key].hasOwnProperty('message')) {
                            console.log(self.commands[key].message);
                            msg.push(from + ": '" + command + "' - " + self.commands[key].message);
                        } else if (typeof self.commands[key] === 'object' && self.commands[key].hasOwnProperty('funcName')) {
                            self[self.commands[key].funcName]();
                        } else {
                            self.commands[key] = !self.commands[key];
                            msg.push(from + ': Ok, I toggled ' + command + ' to ' + self.commands[command] + '.');
                        }
                    }
                });
            }
        }
    },

    checkTwitch: function() {
        // Fetch status of a particular channel 
        if (this.twitch && this.commands.checkTwitch) {
            this.twitch.checkStatus();
        }
    },

    sayTwitchStatus: function() {
        var self = this;
        // TODO: make getStreamStatus return a lazy array that I can iterate multiple channels for status
        if (this.twitch && this.commands.checkTwitch) {
            var status = this.twitch.getStreamStatus();
            // writes out the stream status and pushes it to msg
            if (status !== null) {
                var now = new Date();
                var start = new Date(status.created_at);
                var uptime = this.timeStamp(now - start);
                var str = status.channel.name + " is active! Currently playing " + status.game + " for the last " + uptime.hours + "h" + uptime.mins + "m!";
                msg.push(str);
            }
        } else {
            this.checkTwitch();
        }       
    },

    timeStamp: function(miliseconds) { 
        return {
            hours: Math.floor(miliseconds / 36e5),
            mins:  Math.floor((miliseconds % 36e5) / 6e4),
            secs: Math.floor((miliseconds % 6e4) / 1000)
        }
    },

    replaceNoun: function(from, message) {
        var self = this;
        if (this.commands.replaceNoun) {
            var replaceTerm = 'butt';
            wordpos.getNouns(message, function(result) {
                if (result) {
                    for (var i = result.length - 1; i--;) {
                        if (result[i] === replaceTerm) {
                            result.splice(i, 1);
                        }
                    }
                    for (var i = 0; i < self.opts.replaceQuantity; i++) {
                        var replaceValue = result[Math.floor(Math.random() * result.length)];
                        message = message.replace(replaceValue, replaceTerm);
                        console.log(message);
                    }
                    msg.push(from + ": " + message);
                }   
            });
        }
    },

    hooter: function(from, message) {
        // Replaces individual words with n-grams of moonkin speak from world of warcraft
        
        var self = this;
        if (message && this.commands.hooter) {
            var dictionary = [[ "h", "w", "l", "o" ],
                             [ "ho", "wo", "ol", "o" ],
                             [ "hoh", "woh", "hol", "oow", "koo", "ool" ],
                             [ "hoot", "hool", "holl", "ooow", "kooo", "oool" ],
                             [ "howol", "wohol", "hohol", "oooow", "kokoo", "ooool"],
                             [ "hoot", "wohwol", "holhol", "oowoow", "oolool", "oohhooo"]];

            var replaceWord = function (length) {         
                var ngram = dictionary[length];
                return dictionary[length][Math.floor(Math.random() * ngram.length)];
            };

            var newMessage = [];

            _.forEach(message.trim().split(" "), function(val, index) {
                var length = val.length;
                if (length > dictionary.length) {
                    length = dictionary.length - 1;
                }
                if (val.match(/[a-zA-Z]/)) {
                    newMessage.push(replaceWord(length - 1));
                } else {
                    newMessage.push(val);
                }
            });
            msg.push(from + ": " + newMessage.join(" "));
        }
    }
}

module.exports = TiggsBot;