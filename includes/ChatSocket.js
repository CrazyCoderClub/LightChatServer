function ChatSocket() {
  
}

ChatSocket.onMessage = function ( data, flags ) {
  console.log('onMessage ' + this.rand);
}

ChatSocket.onError = function( data ) {
  console.log('onError');
}

ChatSocket.onClose = function( code, data ) {
  console.log('onClose');
}

module.exports.ChatSocket = ChatSocket;