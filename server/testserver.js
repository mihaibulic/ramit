/**
 * @author mihai
 */
var io = require('socket.io').listen(1337);
var s = 0;

io.sockets.on('connection', function(socket) {
  setInterval(function() {
    socket.emit('state', {score : s});
    console.log("STATE SENT");
  }, 1000);

  socket.on('action', function(data) {
    console.log("ACTION RECEIVED (" + s + ")");
    s += data.change;
  });
});
