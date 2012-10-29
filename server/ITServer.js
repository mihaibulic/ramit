var io = require('socket.io').listen(1337);

// Globals for the server.
var server = {
	interval: null,
	numberOfPlayers: 0,
	players: {},
	colors: [0,0],
	level: new Level(),
	diff: {}
};

/**
 * Updates the game and sends out a 'diff' message to the players.
 */
var update = function() {
	var playerDiff;
	for (var player in server.players) {
		playerDiff = {};
		server.players[player].update(server.level, playerDiff);
		// Copy the differences found into the server's diff object.
		for (var diff in playerDiff) {
			if (!server.diff[player])
				server.diff[player] = {};
			server.diff[player][diff] = playerDiff[diff];
		}
	}
	if (server.diff !== {})
		io.sockets.emit('state', server.diff);
	server.diff = {};
};

/**
 * @returns {Object} The absolute state of the game.
 */
var getAbsoluteState = function() {
	return {};
};

/**
 * Sets up the actions to take when a socket is opened.
 */
io.sockets.on('connection', function(socket) {
	// If the game is full, disconnect.
	if (server.numberOfPlayers === 8) {
		socket.disconnect();
		return;
	}
	
	// If this is the first player, start the game.
	if (server.numberOfPlayers === 0)
		interval = setInterval(update, 16);
	
	// Create the player.
	numberOfPlayers++;
	var color = 0;
	if (server.colors[1] < server.colors[0])
		color = 1;
	server.colors[color]++;
	server.players[socket.id] = new Player(color, socket.id);
	
	// Actions to perform when the player presses or releases a key.
	socket.on('key', function(data) {
		if (data.u !== undefined)
			server.players[socket.id].keys.up = data.u;
		if (data.d !== undefined)
			server.players[socket.id].keys.down = data.d;
		if (data.l !== undefined)
			server.players[socket.id].keys.left = data.l;
		if (data.r !== undefined)
			server.players[socket.id].keys.right = data.r;
		
		if (!server.diff[socket.id])
			server.diff[socket.id] = {};
		server.diff[socket.id].key = server.players[socket.id].getKeyValue();
	});
	
	// Actions to perform when the player changes the tank's aim.
	socket.on('aim', function(data) {
		if (data.a !== undefined)
			server.players[socket.id].setAim(data.a);
		
		if (!server.diff[socket.id])
			server.diff[socket.id] = {};
		server.diff[socket.id].aim = server.players[socket.id].getAim();
	});
	
	// Actions to perform when the player disconnects.
	socket.on('disconnect', function() {
		server.colors[server.players[socket.id].team]--;
		delete server.players[socket.id];
		if (--numberOfPlayers === 0) {
			stopInterval(state.interval);
			state.interval = null;
		}
		// Notify the other players that a player has left.
		socket.broadcast.emit('leave', {i: socket.id});
	});
	
	// Broadcast to the other players that there is a new player.
	var playerInfo = {t: color, i: socket.id};
	socket.broadcast.emit('join', playerInfo);
	socket.emit('setup', {p: playerInfo, s: getAbsoluteState()});
});
