/**
 * @author mihai
 */

var app = require('http').createServer(function(req, res) {});
var io = require('socket.io').listen(app);
var s = 0;

app.listen(1337, '127.0.0.1');

io.sockets.on('connection', 
	function(socket) 
	{
		setInterval(
			function()
			{
				socket.emit('state', {score : s});
				console.log("STATE SENT");
			},
		1000);

		socket.on('action',
			function(data)
			{
				console.log("ACTION RECEIVED (" + s + ")");
				s += data.change;
			}
		);
	}
);
