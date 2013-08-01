var WebSocketServer = require('ws').Server;
var ChatSocket = require('./includes/ChatSocket.js').ChatSocket;
var ChatServer = require('./includes/ChatServer.js').ChatServer;

var wss = new WebSocketServer({port: 8080});
var server = new ChatServer();

wss.on('connection', function(ws) {
  server.addClient( ws );
});