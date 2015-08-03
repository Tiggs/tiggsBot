
var restify = require('restify');
var server = restify.createServer();
var TiggsBot = new require('./lib/tiggsbot'),
    tiggsbot = new TiggsBot();
var Twitch = new require('./lib/twitch'),
    twitch = new Twitch();


var mode = 'test';

if (mode == 'dev') {
    tiggsbot.parseMessage("tiggs", "tiggsbot: test");
    tiggsbot.parseMessage("tiggs", "tiggsbot: help");
    while (1) {

    }
} else {
    if (!tiggsbot.isActive) {
        console.log('connecting to irc!');
        tiggsbot.connect();
    }
}

/*
server.use(restify.queryParser());

server.get('/', function (req, res, cb) {
    if (!tiggsbot.isActive) {
        console.log('connecting to irc!');
        tiggsbot.connect();
    }
    var d = new Date();
    res.send('hello, its currently ' + d);
    return cb();
});

server.get('/disconnect', function (req, res, cb) {
    tiggsbot.disconnect();
    res.send(tiggsbot.isActive);
    return cb();
});

server.get('/connect', function (req, res, cb) {
    if (!tiggsbot.isActive) {
        console.log('connecting to irc!');
        tiggsbot.connect();
    }
    var d = new Date();
    res.send('hello, its currently ' + d);
    return cb();
});

server.get('/test', function (req, res, cb) {
    res.send(tiggsbot.say());

    return cb();
});

server.listen(process.env.PORT || 5000, function () { 
    console.log('%s listening at %s', server.name, server.url);
});
*/

//server.get(/\/js|css|images\/?.*/, restify.serveStatic({
//    directory: './assets'
//}));