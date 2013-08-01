function ChatServer() {
  var server = this;
  this.setInterval( 1000, function() {
    console.log( Object.keys(server.clients).length );
  } );
}

ChatServer.prototype.clients = new Object();

ChatServer.prototype.addClient = function( webSocket ) {
  this.clients[webSocket._socket.remotePort] = webSocket;
  webSocket.remotePort = webSocket._socket.remotePort;
  
  var server = this;
  
  // Message
  webSocket.on('message', function( data, flags ) {
    console.log('onMessage');
    console.log(this._socket.remotePort);
  });
  
  // Error
  webSocket.on('error', function( data ) {
    console.log('onError');
  });
  
  // Disconnect
  webSocket.on('close', function( code, data ) {
    console.log('onClose');
    console.log(this.remotePort);
    
    delete server.clients[this.remotePort];
  });
}

// Interval --------------------------------------------------------------
ChatServer.prototype._interval = null;

ChatServer.prototype.setInterval = function( duration, callback ) {
  this.stopInterval();

  if( duration >= 0 ) {
    this._interval = setInterval( callback, duration );
  }
}

ChatServer.prototype.stopInterval = function() {
  if( this._interval != null ) {
    clearInterval( this._interval );
  }
}

ChatServer.prototype.onLoop = 1;

// END Interval ----------------------------------------------------------

module.exports.ChatServer = ChatServer;