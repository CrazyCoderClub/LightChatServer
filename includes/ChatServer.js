var util = require("util");
var events = require("events");
var ChatRoom = require("./ChatRoom.js").ChatRoom;

/**
 * ChatServer
 * @constructor
 */
function ChatServer() {
  /**
   * All connected clients of this server
   * @type Object
   */
  this.clients = {};

  /**
   * All Rooms of this server
   * @type Object
   */
  this.rooms = {};

  /**
   * Autoincrement value for room creation
   * @type {number}
   * @private
   */
  this._roomAutoIncrement = 0;

  /**
   * Autoincrement value for meesage id
   * @type {number}
   * @private
   */
  this._msgAutoIncrement = 0;

  /**
   * Interval function handler
   * @type {null}
   * @private
   */
  this._interval = null;

  var server = this;
  this.setInterval( 1000, function() {
    //console.log( "Clients: " + Object.keys(server.clients).length + " | Rooms: " + Object.keys(server.rooms).length );
  } );

  this.on( "userMessageReceived", this.userMessageReceived );
  this.on( "roomMessageReceived", this.roomMessageReceived );
  this.on( "netMessageReceived", this.netMessageReceived );

  this.on( "sendToClient", this.sendToClient );

  // Add default rooms
  this.addRoom( new ChatRoom( this.getNextRoomId(), "default", "public", this ) );
  this.addRoom( new ChatRoom( this.getNextRoomId(), "cool", "public", this ) );
}

util.inherits(ChatServer, events.EventEmitter);


/**
 * Returns a unique room number for room creation
 * @returns {number}
 */
ChatServer.prototype.getNextRoomId = function() {
  return this._roomAutoIncrement++;
}

/**
 * Returns a unique room number for room creation
 * @returns {number}
 */
ChatServer.prototype.getNextMsgId = function() {
  return this._msgAutoIncrement++;
}

// Protocol ---------------------------------------------------------------------------------------

/**
 * User message handler
 * @param socket Object
 * @param data Object
 */
ChatServer.prototype.userMessageReceived = function( socket, data ) {
  console.log("user message received: " + socket.remotePort);

  switch( data.action ) {
    case 'user.join.room':
      if( this.rooms.hasOwnProperty(data.room)) {
        this.rooms[ data.room ].addClient( socket );
      }
      break;

    case 'user.leave.room':
      if( this.rooms.hasOwnProperty(data.room)) {
        this.rooms[ data.room ].removeClient( socket );
      }
      break;

    case 'user.data':
      socket.name = data.username
      break;

    case 'user.msg':
      if( this.rooms.hasOwnProperty( data.to ) ) {
        var client = this.clients[ socket.remotePort ];

        var msg = {
          action: 'msg.text',
          mine: 'text/plain',
          data: data.msg,
          from: client.name,
          to: data.to,
          id: this.getNextMsgId(),
          num: 1,
          all: 1
        };

        this.sendToRoom( this.rooms[ data.to ], msg, socket );

      } else {
        var msg = this.generateInfoMessage( "warning", 4001, "Invalid message target" );
        this.emit("sendToClient", socket, msg);
      }

      break;
  }
};

/**
 * Room message handler
 * @param socket Object
 * @param data Object
 */
ChatServer.prototype.roomMessageReceived = function( socket, data ) {
  console.log("room message received: " + socket.remotePort);

  switch( data.action ) {
    case 'room.list':
      var msg = {
        action: 'room.list',
        rooms: this.rooms
      };

      this.emit("sendToClient", socket, msg);

      break;

    case 'room.create':
      var roomId = this.getNextRoomId();
      var room  = new ChatRoom( roomId, data.name, data.type, this, socket );
      this.addRoom( room );

      var msg = {
        action: 'room.added',
        id: roomId,
        name: data.name,
        type: data.type
      };

      this.emit("sendToClient", socket, msg);

      break;
  }
};

/**
 * Network message handler
 * @param socket Object
 * @param data Object
 */
ChatServer.prototype.netMessageReceived = function( socket, data ) {
  console.log("net message received: " + socket.remotePort);
};

// END Protocol -----------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------------------
/**
 * Removes a room by ID
 * @param id
 */
ChatServer.prototype.removeRoom = function( id ) {
  if( this.rooms.hasOwnProperty( id ) ) {
    delete this.rooms[id];
  }
}

/**
 * Add a room to chatroom list
 * @param room
 */
ChatServer.prototype.addRoom = function( room ) {
  var count = 0;
  for( var roomItem in this.rooms ) {
    if( roomItem.name == room ) {
      count++;
    }
  }

  if( count > 0 ) {
    room.name += " ("+count+")";
  }

  this.rooms[ room.id ] = room;
}

/**
 * Removes a client from server
 * @param webSocket
 */
ChatServer.prototype.removeClient = function( webSocket ) {
  if( this.clients.hasOwnProperty( webSocket.remotePort ) ) {
    delete this.clients[webSocket.remotePort];
  }
}
/**
 * Add a connected client to the server and prepares it for later usage
 * @param webSocket Object
 */
ChatServer.prototype.addClient = function( webSocket ) {
  // save port in socket
  this.clients[webSocket._socket.remotePort] = webSocket;
  webSocket.remotePort = webSocket._socket.remotePort;

  this.rooms[0].addClient( webSocket );

  var server = this;
  
  // Message
  webSocket.on('message', function( data, flags ) {
    // Prepare Data for protocol ------------------------------------------------------------------
    var raw = data;
    try {
      data = JSON.parse(data);
    } catch( e ) {
      data = {
        action: false
      };
    }

    if( !data.action ) {
      console.log("onMessage Exception: Invalid Message Format: " + raw);

      var msg = server.generateInfoMessage("error", 4000, "Invalid Message Format: " + raw);
      server.emit("sendToClient", this, msg);

      return;
    } else {
      // memory usage improment
      raw = null;

      // Debug Print
      console.log( "----------------------------\r\nMessage received by port:" + this.remotePort );
      console.log( "Message: " + JSON.stringify( data, null, '\t' ) + "\r\n----------------------------" );
    }

    // Execute protocol routing ------------------------------------------------------------------

    var actionParts = data.action.split('.');

    switch( actionParts[0] ) {
      case 'user':
        server.emit("userMessageReceived", this, data);
        break;

      case 'room':
        server.emit("roomMessageReceived", this, data);
        break;

      case 'net':
        server.emit("netMessageReceived", this, data);
        break;
    }
  });
  
  // Error
  webSocket.on('error', function( data ) {
    console.log('onError');
  });
  
  // Disconnect
  webSocket.on('close', function( code, data ) {
    console.log('onClose');
    console.log(this.remotePort);
    
    server.removeClient( this );
  });
}

/**
 * Sends a Message to all users of a room
 * @param room int ID/index of room
 * @param data Object Message
 * @param sender Object Sender
 */
ChatServer.prototype.sendToRoom = function( room, data, sender ) {
  for( var remotePort in room.clients ) {
    var ws = room.clients[ remotePort ];
    if( ws ) {
      this.emit("sendToClient", ws, data);
    } else {
      room.removeClient( ws );
    }
  }
}

/**
 * Sends a message to a client
 * @param socket Object
 * @param data Object
 */
ChatServer.prototype.sendToClient = function( socket, data ) {
  socket.send( JSON.stringify( data ) );
}

/**
 * Generates an info message
 * @param type string
 * @param id int
 * @param msg object
 * @returns Object
 */
ChatServer.prototype.generateInfoMessage = function( type, id, msg ) {
  return {
    action: 'info.' + type,
    id: id,
    msg: msg
  }
}

// Interval ----------------------------------------------------------------------------------
/**
 * Sets an interval function for ongoing actions
 * @param duration int
 * @param callback object
 */
ChatServer.prototype.setInterval = function( duration, callback ) {
  this.stopInterval();

  if( duration >= 0 ) {
    this._interval = setInterval( callback, duration );
  }
}

/**
 * Stops an interval function and remove it
 */
ChatServer.prototype.stopInterval = function() {
  if( this._interval != null ) {
    clearInterval( this._interval );
  }
}

// END Interval ------------------------------------------------------------------------------

module.exports.ChatServer = ChatServer;