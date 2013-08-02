function ChatRoom( id, server, type ) {
  this.id = id;
  this.server = server;
  this.type = type;
}

ChatRoom.prototype.id = -1;
ChatRoom.prototype.name = "default";
ChatRoom.prototype.type = "private";
ChatRoom.prototype.server = null;
ChatRoom.prototype.clients = [];

ChatRoom.prototype.addClient = function( clientID ) {
  this.clients[ this.clients.length ] = clientID;
};

ChatRoom.prototype.removeClient = function( clientID ) {
  var index = -1;
  for( var i=0; i<this.clients.length; i++ ) {
    if( this.clients[i] == clientID ) {
      index = i;
      break;
    }
  }

  if( index != -1 ) {
    this.clients.slice( index, 1 );
  }
};

ChatRoom.prototype.update = function() {
  for( var i =0; i < this.clients.length; i++ ) {
    if( !this.server.clients.hasOwnProperty( this.clients[i] ) ) {
      this.clients.slice( i, 1 );
      i--;
    }
  }
}


module.exports.ChatRoom = ChatRoom;