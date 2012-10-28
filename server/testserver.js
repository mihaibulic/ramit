/**
 * @author mihai
 */

var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var fs = require('fs');
var s = 0;

app.listen(1337);

function handler(request, response) 
{
	console.log("received request");
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.write('Hello World\n');
    response.end();
}

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


