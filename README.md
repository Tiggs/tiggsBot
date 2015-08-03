# tiggsBot

A NodeJS IRC bot that implements [Node-IRC](https://github.com/martynsmith/node-irc). Contains several customized features for personal use. 

## Features
+ Twitch stream notifications - Writes notifications to the channel if a particular streamer is active. Uses the [Twitch API](https://github.com/justintv/Twitch-API).
+ Annoying Word Replacement - Randomly replaces nouns with key words and repeats it back at users, defaults to the word 'butt'. Uses [WordPos](https://github.com/moos/wordpos) for grammar detection.

`2:31 AM <•tiggs> The quick brown fox jumps over the lazy dog`

`2:31 AM <tiggsbot> tiggs: The quick brown butt jumps over the lazy dog`

+ Moonkin Module - Based on the World of Warcraft addon [Tongues](http://www.curse.com/addons/wow/tongues), implements the Moonkin module replacing text with Moonkin speak.


## Running:
Clone out the repo, let NPM take care of the necessary packages. Edit lib/tiggsbot.js for server parameters and options, edit lib/twitch.js for streamer options. Run with 'node server'. 

## Todo:
+ Add multiple streamer support to monitor
+ Link saving: Store images and URLs posted to be able to recall later
+ Quote detection: Stores quotes based on response (laughter detection)
