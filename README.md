# OBS Remote Clipping

Authors: 
- [Mark](https://github.com/MarkSmrnw)
- [Elias](https://github.com/TeelichtFoxy)

# PLEASE NOTE,
I only intended this to be used on windows systems.
I might add linux soon, maybe... Idrk

# HOW TO RUN:

## For Server:
You run the "server.py" file inside of pyserver.
This will start a Webserver and a Flask server that will manage everything

In the "Commands" tab you can start by typing "help" into the cli

## For Client:
Make sure you have OBS version 28 or newer. Those have Websocket support.
Turn on the websocket under TOOLS > WEBSOCKET and turn OFF authentication. Password support has NOT been implemented yet.

Make sure the websocket port is also on 4455.