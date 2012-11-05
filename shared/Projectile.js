var Projectile = function(player, n) {
	this.n = n;
	this.x = player.tank.x;
	this.y = player.tank.y;
	var degrees = player.tank.turretAim * 2;
	var rads = degrees * Math.PI / 180;
	this.vx = Math.cos(rads);
	this.vy = Math.sin(rads);
	this.team = player.team;
	this.owner = player.playerID; // for score tracking
	this.damage = 1;
	player.lastFire = 0;
};

Projectile.prototype.draw = function(level) {
	var xPos = this.x - level.x;
	var yPos = this.y - level.y;

	if (xPos > -20 && xPos < 1000 && yPos > -20 && yPos < 500) {
		globals.ctx.strokeStyle = "#ff0000";
		globals.ctx.fillRect(xPos, yPos, 40, 40);
	}
};

Projectile.prototype.update = function(level) {
	this.move(level);	
};

Projectile.prototype.move = function(level) {
	this.x = Math.round(this.x + this.vx);
	this.y = Math.round(this.y + this.vy);
	//client does no collision detection
};

/**
 * Returns -1 if hit wall, PlayerID if hit player, undefined if no hit
 */
Projectile.prototype.checkHit = function(globals, level) {
	var box = this.getCollisionBarrier();
	for (var i = 0; i < level.walls.length; i++) {
		if (box.intersects(level.walls[i])) {
			return -1;
		}
	}
	for (var i = 0; i < 8; i++) {
		if (globals.players[i] && box.intersects(globals.players[i].getCollisionBarrier())) {
			return globals.players[i].playerID;
		}
	}
};

Projectile.prototype.getCollisionBarrier = function(location) {
	if (!location)
		location = this;
	return new Rectangle({left: location.x + 10, right: location.x + 50,
		top: location.y + 10, bottom: location.y + 50});
};

