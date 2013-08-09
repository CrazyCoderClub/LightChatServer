function ChatRoom( id, name, type, server ) {
  this.id = id;
  this.name = name;
  this.server = server;
  this.type = type;
  this.clients = {};
}

ChatRoom.prototype.addClient = function( client ) {
  if( !this.clients.hasOwnProperty( client.remotePort ) ) {
    this.clients[ client.remotePort ] = client;
  }
};

ChatRoom.prototype.removeClient = function( client ) {
  if( this.clients.hasOwnProperty( client.remotePort ) ) {
    delete this.clients[ client.remotePort ];
  }
};

ChatRoom.prototype.update = function() {
  for( var remotePort in this.clients ) {
    var client = this.clients[ remotePort ];
    if( !this.server.clients.hasOwnProperty( client.remotePort ) ) {
      this.removeClient( client );
    }
  }
}

module.exports.ChatRoom = ChatRoom;