/**
 * A player of the IT game.
 * @param {Number} team The team number the player is on.
 * @param {Number} playerID The player's ID number.
 * @param {Number} opt_spawn An optional value designating the spawn point.
 */
var Player = function(team, playerID, opt_spawn) {
    this.team = team;

    if (!opt_spawn && opt_spawn !== 0)
	opt_spawn = this.determineSpawn();
    this.starting_spawn = opt_spawn;

    this.playerID = playerID;
    this.keys = {
        up: false,
        down: false,
        left: false,
        right: false,
	mine: false
    };
    this.mouse = {
        left: false,
        middle: false,
        right: false
    };
    this.tank = {
        x: Player.SPAWN_POINTS[team][opt_spawn].x,
        y: Player.SPAWN_POINTS[team][opt_spawn].y,
        sx: Player.SPAWN_POINTS[team][opt_spawn].x,
        sy: Player.SPAWN_POINTS[team][opt_spawn].y,
        direction: 0,
        turretAim: 0
    };
    this.speed = 4;
    this.initHealth = 100;
    this.health = this.initHealth;
    this.score = 0;        //for spending on upgrades
    this.totScore = 0;     //for traking total score, both incremented the same
    this.projectile = {
        damage: 5,
        speed: 10,
        lastFire: 0
    };
    this.mine = {
	damage: 20,
	range: 80,
	live: 0,
	allowed: 1
    };
    this.rocket = {
        lastFire: 0,
        live: 0,
        allowed: 1
    };
};

/**
 * The factor in which diagonal speed is multiplied.
 */
Player.DIAGONAL_CONST = Math.sqrt(0.5);

/**
 * The color of the collision bound for each team.
 */
Player.COLLISION_BOUND_STROKE = ["#00AAFF", "#FF0000"];

Player.HEALTH = ["#FF0000", "#FFFF00", "#00FF00"];

/**
 * The spawn points for each team.
 */
Player.SPAWN_POINTS = [
    [{x: 470, y: 250},{x: 470, y: 150},{x: 470, y: 350},
     {x: 570, y: 250},{x: 570, y: 150},{x: 570, y: 350},
     {x: 370, y: 250},{x: 370, y: 150},{x: 370, y: 350}],
    [{x: 470, y: 2690},{x: 470, y: 2790},{x: 470, y: 2590},
     {x: 370, y: 2690},{x: 370, y: 2790},{x: 370, y: 2590},
     {x: 570, y: 2690},{x: 570, y: 2790},{x: 570, y: 2590}]
];

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

    if (globals.queries.debug === "true") {
        globals.ctx.strokeStyle = Player.COLLISION_BOUND_STROKE[this.team];
        var rect = this.getCollisionBarrier();
        globals.ctx.strokeRect(rect.left - level.x, rect.top - level.y, rect.width(),
                rect.height());
    }
};

/**
 * Draws a tanks information, such as it's health and name.
 */
Player.prototype.drawDetails = function(level) {
    var xPos = this.tank.x - level.x;
    var yPos = this.tank.y - level.y;
    if (xPos > -60 && xPos < 1000 && yPos > -60 && yPos < 500) {
	// health bar
        globals.ctx.strokeStyle = "#00FF00";
	var color = Math.floor(this.health / this.initHealth * Player.HEALTH.length);
	if (color == Player.HEALTH.length) color--;
        globals.ctx.fillStyle = Player.HEALTH[color];
        globals.ctx.globalAlpha = 0.5;
        globals.ctx.strokeRect(xPos + 10, yPos + 2, 40, 3);
        globals.ctx.fillRect(xPos + 10, yPos + 2, 40 * this.health / this.initHealth, 3);
        globals.ctx.globalAlpha = 1;

	//name
	globals.ctx.fillStyle = "#FFFFFF";
	globals.ctx.font = "10px sans-serif";
	globals.ctx.fillText("Player " + this.playerID, xPos + 10, yPos + 1);
    }
};

/**
 * Draws the HUD, including HP, score, and the minimap.
 */
Player.prototype.drawHUD = function() {

    // Health Bar
    var color = Math.floor(this.health / this.initHealth * Player.HEALTH.length);
    if (color == Player.HEALTH.length) color--;
    globals.ctx.fillStyle = Player.HEALTH[color];
    globals.ctx.globalAlpha = 0.75;
    globals.ctx.strokeRect(10, 10, 200, 20);
    globals.ctx.fillRect(10, 10, 200 * this.health / this.initHealth, 20);
    globals.ctx.globalAlpha = 1;

    // Minimap
    globals.ctx.drawImage(globals.resources.minimap, 830, 330);
    
    var x;
    var y;
    var other;
    for (var id in globals.players) {
	other = globals.players[id];
	if (this.team === other.team || this.getCenterDistance(other) < 650) {
	    x = 830 + ((other.tank.x + 30) * 0.05);
	    y = 330 + ((other.tank.y + 30) * 0.05);
	    globals.ctx.fillStyle = Player.COLLISION_BOUND_STROKE[other.team];
	    globals.ctx.beginPath();
	    globals.ctx.arc(x, y, 2, 0, 2 * Math.PI);
	    globals.ctx.closePath();
	    globals.ctx.fill();
	}
    }

    x = 150 - ((this.tank.x + 30) * 0.05);
    y = 150 - ((this.tank.y + 30) * 0.05);
    globals.ctx.drawImage(globals.resources.minimapfade, x, y, 150, 150, 830, 330, 150, 150);
};

/**
 * Updates the player's turret's aim.
 * @param {Event} e The mouse event triggering the call.
 */
Player.prototype.updateAim = function(e) {
    var canvasPos = globals.canvas.getBoundingClientRect();
    var centerPoint = {x: canvasPos.left + 500, y: canvasPos.top + 250};
    var r = Math.atan2(e.clientY - centerPoint.y, e.clientX - centerPoint.x) * 180 / Math.PI;
    if (r < 0)
        r += 360;
    //this.tank.turretAim = Math.floor(r / 2);
    globals.socket.emit('aim', {a: Math.floor(r/2)});
};

Player.prototype.updateMouse = function(e) {
    var diff = {};
    var value = e.type === "mousedown";

    if (!e.which && e.button) 
    {
        if (e.button & 1) e.which = 1;      // Left
        else if (e.button & 4) e.which = 2; // Middle
        else if (e.button & 2) e.which = 3; // Right
    }

    switch (e.which)
    {
    case 1: // left
        diff.l = value;
        break;
    case 2: // middle
        diff.m = value;
        break;
    case 3: // right
        diff.r = value;
        break;
    }
    globals.socket.emit('mouse', diff);
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
    case 32: // Space
        //this.keys.space = value;
        diff.s = value;
        break;
	case 69: //e
		diff.e = value;
		break;
    }
    globals.socket.emit('key', diff);
};

/**
 * Update the state of the Player.
 */
Player.prototype.update = function(level, diff) {        
    this.move(level, diff);
    this.rocket.lastFire++;
    this.projectile.lastFire++;
};

/**
 * Move the tank.
 */
Player.prototype.move = function(level, diff) {
    var speed = (this.tank.direction % 2 === 0) ? this.speed : Player.DIAGONAL_CONST * this.speed;
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
    
    //check walls
    for (var i in level.walls) {
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
    
    // check gates
    for (var g in level.gates) {
	// ignore own team's gate
	if (level.gates[g].team !== this.team) {
	    var box = level.gates[g].getCollisionBarrier();
	    if (rectYMovement.intersects(box)) {
		// Moving up/down collided with a gate, move up to the gate but no
		// farther.
		distance = tankBox.getYDistance(box);
		y = this.tank.y + ((distance - 1) * yDir);
	    }
	    if (rectXMovement.intersects(box)) {
		// Moving left/right collided with a gate, move up to the gate but no
		// farther.
		distance = tankBox.getXDistance(box);
		x = this.tank.x + ((distance - 1) * xDir);
	    }
	}
    }

    // check other tanks
    var barrier;
    for (var p in globals.players) {
	if (globals.players[p] === this) // Do not collide with myself
	    continue;
	barrier =  globals.players[p].getCollisionBarrier();
        if (rectYMovement.intersects(barrier)) {
            // Moving up/down collided with a wall, move up to the wall but no
            // farther.
            distance = tankBox.getYDistance(barrier);
            y = this.tank.y + ((distance - 1) * yDir);
        }
        if (rectXMovement.intersects(barrier)) {
            // Moving left/right collided with a wall, move up to the wall but no
            // farther.
            distance = tankBox.getXDistance(barrier);
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
 * Causes damage to tank. Kills tank if dead (returns to spawn point)
 */
Player.prototype.takeHit = function(damage) {
    this.health -= damage;
    if (this.health <= 0) {
	var spawn = this.determineSpawn();
        this.tank.x = Player.SPAWN_POINTS[this.team][spawn].x;
        this.tank.y = Player.SPAWN_POINTS[this.team][spawn].y;
        this.health = this.initHealth;
    }
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

Player.prototype.getCenterDistance = function(object) {
    if (object instanceof Player)
	return Math.sqrt((this.tank.x - object.tank.x) * (this.tank.x - object.tank.x) +
			 (this.tank.y - object.tank.y) * (this.tank.y - object.tank.y));
    return 0;
};

Player.prototype.determineSpawn = function() {
    var spawn;
    var finished = false;
    var tank;
    var spawn_coords;
    var rect;
    for (spawn = 0; spawn < 9 && !finished; spawn++) {
	finished = true;
	spawn_coords = Player.SPAWN_POINTS[this.team][spawn];
	// Determine the rectangle for the spawn point.
	rect = new Rectangle({top: spawn_coords.y, bottom: spawn_coords.y + 40,
			      left: spawn_coords.x, right: spawn_coords.x + 40});
	for (var id in globals.players) {
	    tank = globals.players[id];
	    if (tank === this) // Don't compare me to myself.
		continue;
	    // If the tank is on the spawn point, move to the next one.
	    if (tank.getCollisionBarrier().intersects(rect)) {
		finished = false;
		break;
	    }
	}
    }
    // Exiting the for loop incremented it by one.
    return --spawn;
};