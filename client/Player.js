/**
 * A player of the IT game.
 * @param team The team number the player is on.
 * @param playerID The player's ID number.
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
			y: 220,
			direction: 0,
			turretAim: 0
	};
	this.speed = 4;
};

/**
 * Draw's the player's information.
 * @param level An object describing the state of the level.
 */
Player.prototype.draw = function(level) {
	var xPos = this.tank.x - level.x;
	var yPos = this.tank.y - level.y;
	
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
};

/**
 * Updates the player's turret's aim.
 * @param e The mouse event triggering the call.
 */
Player.prototype.updateAim = function(e) {
	var canvasPos = globals.canvas.getBoundingClientRect();
	var centerPoint = {x: canvasPos.left + 500, y: canvasPos.top + 250};
	var r = Math.atan2(e.clientY - centerPoint.y, e.clientX - centerPoint.x)
			* 180 / Math.PI;
	if (r < 0)
		r += 360;
	this.tank.turretAim = Math.floor(r / 2);
};

/**
 * Update the player's pressed keys.
 * @param e The key event triggering the call.
 */
Player.prototype.updateKeys = function(e) {
	var value = e.type === "keydown";
	switch (e.keyCode) {
	case 87: // W
		this.keys.up = value;
		break;
	case 65: // A
		this.keys.left = value;
		break;
	case 83: // S
		this.keys.down = value;
		break;
	case 68: // D
		this.keys.right = value;
		break;
	}
};

/**
 * Convert's key's into a direction
 */
Player.prototype.update = function() {	
	// Determine a numeric value for which keys are pressed and move the tank.
	var keyValue = 0;
	if (this.keys.up) {
		keyValue += 1;
		this.tank.y -= this.speed;
	}
	if (this.keys.down) {
		keyValue += 2;
		this.tank.y += this.speed;
	}
	if (this.keys.left) {
		keyValue += 4;
		this.tank.x -= this.speed;
	}
	if (this.keys.right) {
		keyValue += 8;
		this.tank.x += this.speed;
	}
	
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
};