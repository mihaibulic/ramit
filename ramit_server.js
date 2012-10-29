var Level = function() {
	this.x = 0;
	this.y = 0;
	this.walls;
	this.loadLevel();
};

/**
 * Loads the walls into the level.
 */
Level.prototype.loadLevel = function() {
	var walls = [{left:0, right: 3000, top:0, bottom:125},
	             {left:0, right:125,top:0, bottom:3000},
	             {left:2875, right:3000, top:0, bottom:3000},
	             {left:0, right:3000, top:2875, bottom:3000},
	             {left:0,right:1350,top:438,bottom:563},
	             {left:1650,right:3000,top:438,bottom:563},
	             {left:0,right:1350,top:2438,bottom:2563},
	             {left:1650,right:3000,top:2438,bottom:2563},
	             {left:350,right:650,top:825,bottom:875},
	             {left:350,right:400,top:825,bottom:1125},
	             {left:850,right:900,top:750,bottom:1050},
	             {left:775,right:975,top:1050,bottom:1250},
	             {left:525,right:1225,top:1125,bottom:1175},
	             {left:1100,right:1900,top:825,bottom:875},
	             {left:1450,right:1550,top:1100,bottom:1200},
	             {left:2100,right:2150,top:750,bottom:1050},
	             {left:2025,right:2225,top:1050,bottom:1250},
	             {left:1775,right:2475,top:1125,bottom:1175},
	             {left:2350,right:2650,top:825,bottom:875},
	             {left:2600,right:2650,top:825,bottom:1125},
	             {left:350,right:1150,top:1475,bottom:1525},
	             {left:1400,right:1600,top:1400,bottom:1600},
	             {left:1850,right:2650,top:1475,bottom:1525},
	             {left:350,right:400,top:1875,bottom:2175},
	             {left:350,right:650,top:2125,bottom:2175},
	             {left:525,right:1225,top:1825,bottom:1875},
	             {left:775,right:975,top:1750,bottom:1950},
	             {left:850,right:900,top:1950,bottom:2250},
	             {left:1450,right:1550,top:1800,bottom:1900},
	             {left:1100,right:1900,top:2125,bottom:2175},
	             {left:1775,right:2475,top:1825,bottom:1875},
	             {left:2025,right:2225,top:1750,bottom:1950},
	             {left:2100,right:2150,top:1950,bottom:2250},
	             {left:2350,right:2650,top:2125,bottom:2175},
	             {left:2600,right:2650,top:1875,bottom:2175}];
	this.walls = [];
	for (var i = 0; i < walls.length; i++) {
		this.walls[i] = new Rectangle(walls[i]);
	}
};
/**
 * A player of the IT game.
 * @param {Number} team The team number the player is on.
 * @param {Number} playerID The player's ID number.
 */
var Player = function(team, playerID) {
	this.team = team;
	this.playerID = playerID;
	this.keys = {
			up: false,
			down: false,
			left: false,
			right: false
	};
	this.tank = {
			x: 470,
			y: (team == 0 ? 250 : 3000 - 310),
			sx: 470,
			sy: (team == 0 ? 250 : 3000 - 310),
			direction: 0,
			turretAim: 0
	};
	this.speed = 4;
};

/**
 * The factor in which diagonal speed is multiplied.
 */
Player.DIAGONAL_CONST = Math.sqrt(0.5);

/**
 * The color of the collision bound for each team.
 */
Player.COLLISION_BOUND_STROKE = ["#0000FF", "#FF0000"];

/**
 * Draw's the player's information.
 * @param {Object} level An object describing the state of the level.
 */
Player.prototype.draw = function(level) {
	var xPos = this.tank.x - level.x;
	var yPos = this.tank.y - level.y;
	
	// Determine a numeric value for which keys are pressed and move the tank.
	keyValue = this.getKeyValue();
	
	// Based on which keys are pressed, determine which direction to draw the
	// Tank in.
	switch (keyValue) {
	case 1: // Up key
	case 13: // Up, Left, and Right keys
		this.tank.direction = 6;
		break;
	case 2: // Down key
	case 14: // Down, Left, and Right keys
		this.tank.direction = 2;
		break;
	case 4: // Left key
	case 7: // Left, Up, and Down keys
		this.tank.direction = 4;
		break;
	case 5: // Left and Up keys
		this.tank.direction = 5;
		break;
	case 6: // Left and Down keys
		this.tank.direction = 3;
		break;
	case 8: // Right key
	case 11: // Right, Up, and Down keys
		this.tank.direction = 0;
		break;
	case 9: // Right and Up keys
		this.tank.direction = 7;
		break;
	case 10: // Right and Down keys
		this.tank.direction = 1;
		break;
	}

	// If the tank will not be displayed on the screen, do not bother drawing it.
	if (xPos > -60 && xPos < 1000 && yPos > -60 && yPos < 500) {
		// Draw the tank.
		globals.ctx.drawImage(
				globals.resources.tanks[this.team][this.tank.direction],
				xPos, yPos);
		// Draw the turret.
		globals.ctx.drawImage(
				globals.resources.turrets[this.team][this.tank.turretAim],
				xPos - 7, yPos - 7);
	}

	if (globals.queries['debug'] == "true") {
		globals.ctx.strokeStyle = Player.COLLISION_BOUND_STROKE[this.team];
		var rect = this.getCollisionBarrier();
		globals.ctx.strokeRect(rect.left - level.x, rect.top - level.y, rect.width(),
				rect.height());
	}
};

/**
 * Updates the player's turret's aim.
 * @param {Event} e The mouse event triggering the call.
 */
Player.prototype.updateAim = function(e) {
	var canvasPos = globals.canvas.getBoundingClientRect();
	var centerPoint = {x: canvasPos.left + 500, y: canvasPos.top + 250};
	var r = Math.atan2(e.clientY - centerPoint.y, e.clientX - centerPoint.x)
			* 180 / Math.PI;
	if (r < 0)
		r += 360;
	//this.tank.turretAim = Math.floor(r / 2);
	globals.socket.emit('aim', {a: Math.floor(r/2)});
};

/**
 * Update the player's pressed keys.
 * @param {Event} e The key event triggering the call.
 */
Player.prototype.updateKeys = function(e) {
    var diff = {};
	var value = e.type === "keydown";
	switch (e.keyCode) {
	case 87: // W
	    //this.keys.up = value;
		diff.u = value;
		break;
	case 65: // A
	    //this.keys.left = value;
		diff.l = value;
		break;
	case 83: // S
	    //this.keys.down = value;
		diff.d = value;
		break;
	case 68: // D
	    //this.keys.right = value;
		diff.r = value;
		break;
	}
    globals.socket.emit('key', diff);
};

/**
 * Update the state of the Player.
 */
Player.prototype.update = function(level, diff) {		
	this.move(level, diff);
};

/**
 * Move the tank.
 */
Player.prototype.move = function(level, diff) {
	var speed = (this.tank.direction % 2 == 0) ? this.speed :
			Player.DIAGONAL_CONST * this.speed;
	var x = this.tank.x;
	var y = this.tank.y;
	// Which direction left/right, up/down is the tank moving in.
	var xDir = 1;
	var yDir = 1;
	
	// Determine the end location based on the keys.
	if (this.keys.up) {
		y -= speed;
		yDir = -1;
	}	
	if (this.keys.down) {
		y += speed;
		yDir = 1;
	}
	if (this.keys.left) {
		x -= speed;
		xDir = -1;
	}
	if (this.keys.right) {
		x += speed;
		xDir = 1;
	}
	x = Math.round(x);
	y = Math.round(y);
	
	// The collision box of the tank.
	var tankBox = this.getCollisionBarrier();
	//The collision box after the tank moves in the Y direction.
	var rectYMovement = this.getCollisionBarrier({x: this.tank.x, y: y});
	//The collision box after the tank moves in the X direction.
	var rectXMovement = this.getCollisionBarrier({x: x, y: this.tank.y});
	var distance;
	for (var i = 0; i < level.walls.length; i++) {
		if (rectYMovement.intersects(level.walls[i])) {
			// Moving up/down collided with a wall, move up to the wall but no
			// farther.
			distance = tankBox.getYDistance(level.walls[i]);
			y = this.tank.y + ((distance - 1) * yDir);
		}
		if (rectXMovement.intersects(level.walls[i])) {
			// Moving left/right collided with a wall, move up to the wall but no
			// farther.
			distance = tankBox.getXDistance(level.walls[i]);
			x = this.tank.x + ((distance - 1) * xDir);
		}
	}
	
	if (diff && this.tank.x !== x)
		diff.x = x;
	if (diff && this.tank.y !== y)
		diff.y = y;
	
	this.tank.x = x;
	this.tank.y = y;
};

/**
 * @returns {Number} The direction the turret is aiming.
 */
Player.prototype.getAim = function() {
	return this.tank.turretAim;
};

/**
 * @param aim The direction the turret is aiming.
 */
Player.prototype.setAim = function(aim) {
	this.tank.turretAim = aim;
};

/**
 * Returns a rectangle representing the collidable area for the provided
 * location. If no location is provided, it will use the location of the tank
 * by default.
 * @param {Object} location An object that holds the location of the tank.
 * @returns {Rectangle} A rectangle of the collidable area of the tank.
 */
Player.prototype.getCollisionBarrier = function(location) {
	if (!location)
		location = this.tank;
	return new Rectangle({left: location.x + 10, right: location.x + 50, 
		  top: location.y + 10, bottom: location.y + 50});
};

/**
 * @returns {Number} A numeric value representing the keys pressed by the
 *     player.
 */
Player.prototype.getKeyValue = function() {
	var keyValue = 0;
	if (this.keys.up)
		keyValue += 1;
	if (this.keys.down)
		keyValue += 2;
	if (this.keys.left)
		keyValue += 4;
	if (this.keys.right)
		keyValue += 8;
	return keyValue;
};

Player.prototype.setKeyValue = function(keyValue) {
    this.keys.up = (keyValue & 1);
    this.keys.down = (keyValue & 2);
    this.keys.left = (keyValue & 4);
    this.keys.right = (keyValue & 8);
};
/**
 * A rectangle.
 */
var Rectangle = function(box) {
	this.left = 0;
	this.right = 0;
	this.top = 0;
	this.bottom = 0;
	if (box) {
		this.left = box.left;
		this.right = box.right;
		this.top = box.top;
		this.bottom = box.bottom;
	}
};

/**
 * @param rect The other rectangle to check.
 * @returns {Boolean} true if the rectangles are intersecting.
 */
Rectangle.prototype.intersects = function(rect) {
	return (this.left <= rect.right &&
      rect.left <= this.right &&
      this.top <= rect.bottom &&
      rect.top <= this.bottom);
};

/**
 * @returns {Number} The height of the rectangle.
 */
Rectangle.prototype.width = function() {
	return this.right - this.left;
};

/**
 * @returns {Number} The height of the rectangle.
 */
Rectangle.prototype.height = function() {
	return this.bottom - this.top;
};

/**
 * Calculates the X distance between two rectangles. The rectangles should not
 * be intersecting.
 * @param {Rectangle} rect The rectangle to check.
 * @returns {Number} The X distance between this rectangle and the other.
 */
Rectangle.prototype.getXDistance = function(rect) {
	return Math.min(Math.abs(this.left - rect.right),
			Math.abs(rect.left - this.right));
};

/**
 * Calculates the Y distance between two rectangles. The rectangles should not
 * be intersecting.
 * @param {Rectangle} rect The rectangle to check.
 * @returns {Number} The Y distance between this rectangle and the other.
 */
Rectangle.prototype.getYDistance = function(rect) {
	return Math.min(Math.abs(this.top - rect.bottom),
			Math.abs(rect.top - this.bottom));
};
/**
 * @author ryjust
 */
var io = require('socket.io').listen(1337);

// Globals for the server.
var server = {
	interval: null,
	numberOfPlayers: 0,
	players: {},
	socketToId: {},
	playerIDQueue: [7,6,5,4,3,2,1,0],
	colors: [0,0],
	level: new Level(),
	diff: {},
	usedDiff: false
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
			server.usedDiff = true;
		}
	}
	if (server.usedDiff)
		io.sockets.emit('state', server.diff);
	server.diff = {};
	server.usedDiff = false;
};

/**
 * @returns {Object} The absolute state of the game.
 */
var getAbsoluteState = function() {
  var state = {};
  for (var id in server.players) {
    state[id] = {};
    state[id].t = server.players[id].team;
    state[id].x = server.players[id].tank.x;
    state[id].y = server.players[id].tank.y;
    state[id].aim = server.players[id].getAim();
    state[id].key = server.players[id].getKeyValue();
  }
  return state;
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
		interval = setInterval(update, 33);
	
	// Create the player.
	server.numberOfPlayers++;
	var color = 0;
	if (server.colors[1] < server.colors[0])
		color = 1;
	server.colors[color]++;
	var id = server.playerIDQueue.pop();
	server.socketToId[socket.id] = id;
	server.players[id] = new Player(color, id);
	
	// Actions to perform when the player presses or releases a key.
	socket.on('key', function(data) {
		if (data.u !== undefined)
			server.players[id].keys.up = data.u;
		if (data.d !== undefined)
			server.players[id].keys.down = data.d;
		if (data.l !== undefined)
			server.players[id].keys.left = data.l;
		if (data.r !== undefined)
			server.players[id].keys.right = data.r;
		
		if (!server.diff[id])
			server.diff[id] = {};
		server.diff[id].key = server.players[id].getKeyValue();
		server.usedDiff = true;
	});
	
	// Actions to perform when the player changes the tank's aim.
	socket.on('aim', function(data) {
		if (data.a !== undefined)
			server.players[id].setAim(data.a);
		
		if (!server.diff[id])
			server.diff[id] = {};
		server.diff[id].aim = server.players[id].getAim();
		server.usedDiff = true;
	});
	
	// Actions to perform when the player disconnects.
	socket.on('disconnect', function() {
		server.colors[server.players[id].team]--;
		delete server.players[id];
		if (--server.numberOfPlayers === 0) {
			clearInterval(server.interval);
			server.interval = null;
		}
		// Notify the other players that a player has left.
		socket.broadcast.emit('leave', {i: id});
		server.playerIDQueue.push(id);
		delete server.socketToId[socket.id];
	});
	
	// Broadcast to the other players that there is a new player.
	var playerInfo = {t: color, i: id};
	socket.broadcast.emit('join', playerInfo);
	socket.emit('setup', {p: playerInfo, s: getAbsoluteState()});
});
