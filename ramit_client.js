/**
 * The Interactive Tanks game.
 */
var ITGame = function(team, playerID) {
    this.level = new Level();
    globals.socket = io.connect('ws://www.misquares.com');
    globals.socket.on('setup', globals.bind(function(data) {

	globals.socket.on('state', function(data) {
	  for(var id in data) {
	      if (data[id].key !== undefined) {
		  globals.players[id].keys.up = (data[id].key&1);
		  globals.players[id].keys.down = (data[id].key&2);
		  globals.players[id].keys.left = (data[id].key&4);
		  globals.players[id].keys.right = (data[id].key&8);
	      }
	      if (data[id].x !== undefined)
		  globals.players[id].tank.x = data[id].x;
	      if (data[id].y !== undefined)
		  globals.players[id].tank.y = data[id].y;
	      if (data[id].aim !== undefined)
		  globals.players[id].setAim(data[id].aim);
	  }
	});

	globals.socket.on('join', function(data) {
	  globals.players[data.i] = new Player(data.t, data.i);
	});
	globals.socket.on('leave', function(data) {
	  delete globals.players[data.i];
        });

	this.team = data.p.t;
	this.player = data.p.i;
	for (var pid in data.s) {
	    globals.players[pid] = new Player(data.s[pid].t, pid);
	    globals.players[pid].tank.x = data.s[pid].x;
	    globals.players[pid].tank.y = data.s[pid].y;
	    globals.players[pid].setAim(data.s[pid].aim);
	    globals.players[pid].setKeyValue(data.s[pid].key);
	}
	
	// Input events.
	var keyEvent = globals.bind(function(e) {
		if (!e)
			e = window.event;
		globals.players[this.player].updateKeys(e);
	}, this);
	window.addEventListener('keydown', keyEvent);
	window.addEventListener('keyup', keyEvent);
	window.addEventListener('mousemove', globals.bind(function(e) {
		if (!e)
			e = window.event;
		globals.players[this.player].updateAim(e);
	}, this));
	
	// FPS Stuff
	this.fps = 0;
	this.count = 0;
	if (globals.queries['debug'] == "true") {
		this.fpsCount = window.setInterval(globals.bind(function() {
			this.fps = this.count;
			this.count = 0;
		}, this), 1000);
	}
	
	// Game loop.
	this.interval = window.setInterval(globals.bind(function() {
		if (globals.queries['debug'] == 'true')
			this.count++;
		this.update();
		this.draw();
	}, this), 16);
    }, this));
};

/**
 * Update the game state.
 */
ITGame.prototype.update = function() {
    //globals.players[this.player].update(this.level);
		
	this.level.x = globals.players[this.player].tank.x - 470;
	this.level.y = globals.players[this.player].tank.y - 220;
};

/**
 * Draw the game state to the canvas.
 */
ITGame.prototype.draw = function() {
	globals.ctx.fillStyle = "#000000";
	globals.ctx.fillRect(0, 0, 1000, 500);

	var tileX = Math.max(Math.floor(this.level.x / 1000), 0);
	var tileY = Math.max(Math.floor(this.level.y / 1000), 0);
	var levelX = this.level.x % 1000;
	var levelY = this.level.y % 1000;
	
	// Draw up to four tiles of the map.
	if (tileX >= 0 && tileY >= 0) {
		globals.ctx.drawImage(globals.resources.level[tileX][tileY],
				-1 * levelX, -1 * levelY);
	}
	if (tileX < 2) {
		globals.ctx.drawImage(globals.resources.level[tileX + 1][tileY],
				-1 * levelX + 1000, -1 * levelY);
	}
	if (levelY > 500 && tileY < 2) {
		globals.ctx.drawImage(globals.resources.level[tileX][tileY + 1],
				-1 * levelX, -1 * levelY + 1000);
	}
	if (levelY > 500 && tileX < 2 && tileY < 2) {
		globals.ctx.drawImage(globals.resources.level[tileX + 1][tileY + 1],
				-1 * levelX + 1000, -1 * levelY + 1000);
	}
	
	for (var pid in globals.players) {
	  globals.players[pid].draw(this.level);
	}
	
	if (globals.queries['debug'] == "true") {
		globals.ctx.strokeStyle = "#00ff00";
		for (var i = 0; i < this.level.walls.length; i++) {
			globals.ctx.strokeRect(this.level.walls[i].left - this.level.x, 
					this.level.walls[i].top - this.level.y, this.level.walls[i].width(), 
					this.level.walls[i].height());
		}
		
		// Draw FPS
		globals.ctx.fillStyle = "#ffffff";
		globals.ctx.font = "normal 18px sans-serif";
		globals.ctx.textBaseline = "top";
		globals.ctx.fillText("FPS: " + this.fps, 5, 5);
	}
};
/**
 * An object of global variables and functions for use throughout the program.
 */
var globals = {
		NUMBER_OF_PLAYERS: 2,
		rawImages: {
			level: new Image(),
			tanks: new Image()
		},
		resources: {
		  level: null,
			tanks: null,
			turrets: null
		},
		canvas: null,
		ctx: null,
		remainingResources: 0,
		players: {}
};

/**
 * An object containing the query strings.
 */
globals.queries = (function() {
	var result = {};
	var queryString = location.search.substring(1);
	var re = /([^&=]+)=([^&]*)/g;
	var m;
	
	while (m = re.exec(queryString)) {
		result[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
	}

	return result;
})();

/**
 * Binds a function to an object.
 * @param fn The function to be bound.
 * @param context The 'this' object for the function.
 * @returns A function which calls fn in the correct context.
 */
globals.bind = function(fn, context) {
	return fn.bind(context);
};

/**
 * Load the raw images into memory. This looks at the field names of the
 * rawImages variable and begins loading them into memory. Images should be
 * located in the 'images' folder, be PNG files, and be named the same as the
 * field in rawImages that they are loaded into. (ex: rawImages.tanks loads the
 * file 'images/tanks.png')
 * @param callback A function that is called when the game is finished loading.
 */
globals.load = function(callback) {
	globals.resourceLoaded = function() {
		globals.remainingResources--;
		// Nothing else needs to be loaded. Call the callback.
		if (globals.remainingResources === 0 && !!callback)
			callback();
	};
	
	for (img in globals.rawImages) {
		if (globals.rawImages[img] instanceof Image) {
			++globals.remainingResources;
			globals.rawImages[img].onload = function(e) {
				if (!e)
					e = window.event;
				
				var start = e.target.src.lastIndexOf("/") + 1;
				var end = e.target.src.lastIndexOf(".");
				var target = e.target.src.substring(start, end);
				
				// Perform any special tasks on the image if need be.
				if (target === "tanks")
					globals.renderTanks();
				else if (target === "level")
					globals.renderLevelTiles();
				
				globals.resourceLoaded();
			};
			globals.rawImages[img].src = "images/" + img + ".png";
		}
	}
};

/**
 * Renders the level image into 1000x1000 pixel tiles so that it can drawn more
 * quickly.
 */
globals.renderLevelTiles = function() {
	var width = Math.ceil(globals.rawImages.level.width / 1000);
	var height = Math.ceil(globals.rawImages.level.height / 1000);
	globals.remainingResources += width * height;
	globals.resources.level = [];
	
	var renderer = document.getElementById('renderer');
	var ctx = renderer.getContext('2d');
	
	// Renders a level tile.
	var render = function(i, j) {
		renderer.width = 1000;
		renderer.height = 1000;
		ctx.drawImage(globals.rawImages.level, i * 1000, j * 1000, 1000, 1000, 0,
				0, 1000, 1000);
		var img = new Image();
		img.src = renderer.toDataURL();
		img.onload = function() {
			if (!globals.resources.level[i])
				globals.resources.level[i] = [];
			globals.resources.level[i][j] = img;
			globals.resourceLoaded();
			if (++i >= 3) {
				i = 0;
				++j;
			}
			if (j < 3)
				render(i, j);
		};
	};
	
	render(0, 0);
};

/**
 * Renders the tank images from the raw image. Each tank is rendered into 8
 * images, one for each direction. Each turret is rendered into 180 images,
 * each separated by 2 degrees of rotation.
 */
globals.renderTanks = function()
{
	globals.remainingResources += globals.NUMBER_OF_PLAYERS * 188;
	var renderer = document.getElementById('renderer');
	var ctx = renderer.getContext('2d');
	var i = 0;
	globals.resources.tanks = [];
	globals.resources.turrets = [];
	
	// Render the tank rotation images.
	var renderTank = function(num) {
		renderer.width = 60;
		renderer.height = 60;
		ctx.clearRect(0, 0, 60, 60);
		ctx.save();
		ctx.translate(30, 30);
		ctx.rotate(45 * i * Math.PI / 180);
		ctx.drawImage(globals.rawImages.tanks, num * 42, 0, 40, 40, -20, -20, 40,
				40);
		ctx.restore();
		var img = new Image();
		img.src = renderer.toDataURL();
		img.onload = function() {
			if (!globals.resources.tanks[num])
				globals.resources.tanks[num] = [];
			globals.resources.tanks[num].push(img);
			globals.resourceLoaded();
			if (++i < 8) {
				renderTank(num);
			} else {
				i = 0;
				renderTurret(num);
			}
		};
	};
	// Renders the turret rotation images.
	var renderTurret = function(num) {
		renderer.width = 74;
		renderer.height = 74;
		ctx.clearRect(0, 0, 74, 74);
		ctx.save();
		ctx.translate(37, 37);
		ctx.rotate(i * 2 * Math.PI / 180);
		ctx.drawImage(globals.rawImages.tanks, num * 42, 40, 42, 22, -10, -11, 42,
				22);
		ctx.restore();
		var img = new Image();
		img.src = renderer.toDataURL();
		img.onload = function() {
			if (!globals.resources.turrets[num])
				globals.resources.turrets[num] = [];
			globals.resources.turrets[num].push(img);
			globals.resourceLoaded();
			if (++i < 180) {
				renderTurret(num);
			} else if (++num < globals.NUMBER_OF_PLAYERS) {
				i = 0;
				renderTank(num);
			}
		};
	};
		
	renderTank(0);
};

/**
 * Initialize the state and begin.
 */
window.onload = function() {
	globals.canvas = document.getElementById('cnv');
	globals.ctx = globals.canvas.getContext('2d');
	globals.load(function() 
	{
		globals.game = new ITGame(0,0);
	});
};
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
