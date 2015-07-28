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
            checkTwitch: {timer: 10000, last: new Date() },
            sayTwitchStatus: {timer: 36000, last: new Date() },
            replaceNoun: {timer: 5000, last: new Date() },
            hooter: {timer: 300000, last: new Date() }
        },
        enabled: {
            sayTwitchStatus: true,
            checkTwitch: true,
            replaceNoun: true,
            hooter: false,
            help: { message: 'help - [checkTwitch, replaceNoun, hooter, quit]' },
            quit: { message: 'quitting' }
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
                self.client.say(self.channel, m);
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
        var r = new RegExp('(^!' + this.username + ') (\\w+)');
        var m = r.exec(message);
        if (m.length > 0) {
            // match result will have message as 0, trigger as 1, command as 2
            var command = m[2].toLowerCase();
            var tookAction = false;
            
            // this is really bad code
            _.forEach(self.enabled, function(val, key) {
                console.log(key + " " + command);
                if (command == key) {
                    console.log(['help', 'quit'].indexOf(command));
                    if (['help', 'quit'].indexOf(command) > -1) {
                        if (command === 'help') {
                            console.log('got here');
                            tookAction = true;
                            msg.push(from + ': Help: ' + ' [hooter, checkTwitch, replaceNoun, quit, help]');
                        }
                        if (command === 'quit') {
                            self.disconnect();
                        }
                    } else {
                        self.enabled[key] = !self.enabled[key];
                        tookAction = true;
                    }
                }
            });
            if (tookAction && command !== 'help') {
                msg.push(from + ': Ok, I toggled ' + command + ' to ' + self.enabled[command] + '.');
            } else {
                if (!tookAction) {
                    msg.push(from + ': I didn\'t understand ' + command + '. Try \'!' + self.username + ' help\' for commands!');
                }
            }
        }
    },

    checkTwitch: function(from, message) {
        // Fetch status of a particular channel 
        if (this.twitch && this.enabled.checkTwitch) {
            this.twitch.checkStatus();
        }
    },

    sayTwitchStatus: function(from, message) {
        // TODO: make getStreamStatus return a lazy array that I can iterate multiple channels for status
        if (this.twitch && this.enabled.sayTwitchStatus) {
            var status = this.twitch.getStreamStatus();
            console.log(status);
            // writes out the stream status and pushes it to msg
            if (status !== null) {
                var now = new Date();
                console.log(status.created_at);
                var start = new Date(status.created_at);
                var uptime = now - start;

                console.log(now + " " + start + " " + uptime);
                var hours = Math.floor(uptime / 36e5),
                    mins = Math.floor((uptime % 36e5) / 6e4),
                    secs = Math.floor((uptime % 6e4) / 1000);

                var str = status.channel.name + " is active! Currently playing " + status.game + " for the last " + hours + "h" + mins + "m!";
                msg.push(str);
            }
        }       
    },

    replaceNoun: function(from, message) {
        var self = this;
        if (this.enabled.replaceNoun) {
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
                        console.log(replaceValue);
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
        if (message && this.enabled.hooter) {
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
                console.log(val + " " + length + " " + dictionary.length);

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