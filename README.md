# tiggsBot

A NodeJS IRC bot that implements [Node-IRC](https://github.com/martynsmith/node-irc). Contains several customized features for personal use. 

## Features
1. Twitch stream notifications - Writes notifications to the channel if a particular streamer is active. Uses the [Twitch API](https://github.com/justintv/Twitch-API).
2. Annoying Word Replacement - Randomly replaces nouns with key words and repeats it back at users, defaults to the word 'butt'. Uses [WordPos](https://github.com/moos/wordpos) for grammar detection.
3. Moonkin Module - Based on the World of Warcraft addon [Tongues](http://www.curse.com/addons/wow/tongues), implements the Moonkin module replacing text with Moonkin speak.


## Todo:
1. Add multiple streamer support to monitor
2. Link saving: Store images and URLs posted to be able to recall later
3. Quote detection: Stores quotes based on response (laughter detection)
