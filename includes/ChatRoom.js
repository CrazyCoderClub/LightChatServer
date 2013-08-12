function ChatRoom( id, name, type, server, creator ) {
  this.id = id;
  this.name = name;
  this.server = server;
  this.type = type;
  this.clients = {};
  this.allowedClients = {};
  this.creator = creator ? creator : null;

  if( this.creator ) {
    if( type == 'private' ) {
      this.addAllowedClientId( this.creator.remotePort );
    }

    this.addClient( this.creator );
  }
}

ChatRoom.prototype.addClient = function( client ) {
  if( this.type == 'private' && !this.allowedClients.hasOwnProperty( client.remotePort ) ) {
    throw new {
      type:        "ChatRoomAddClientException",
      message:     "Could not add client to private room"
    };
  }

  if( !this.clients.hasOwnProperty( client.remotePort ) ) {
    this.clients[ client.remotePort ] = client;
  }
};

ChatRoom.prototype.removeClient = function( client ) {
  if( this.clients.hasOwnProperty( client.remotePort ) ) {
    delete this.clients[ client.remotePort ];
  }
};

ChatRoom.prototype.addAllowedClientId = function( clientId ) {
  this.allowedClients[clientId] = clientId;
}

ChatRoom.prototype.removeAllowedClientId = function( clientId ) {
  if( this.allowedClients.hasOwnProperty( clientId ) ) {
    delete this.allowedClients[clientId];
  }
}

ChatRoom.prototype.update = function() {
  for( var remotePort in this.clients ) {
    var client = this.clients[ remotePort ];
    if( !this.server.clients.hasOwnProperty( client.remotePort ) ) {
      this.removeClient( client );
    }
  }
}

module.exports.ChatRoom = ChatRoom;