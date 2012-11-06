var Projectile = function(player, n) {
	this.n = n;
	this.x = player.tank.x+20;
	this.y = player.tank.y+20;
	var degrees = player.tank.turretAim * 2;
	var rads = degrees * Math.PI / 180;
	this.vx = Math.cos(rads) * .10;
	this.vy = Math.sin(rads) * .10;
	this.team = player.team;
	this.owner = player.playerID; // for score tracking
	this.damage = 1;
	player.lastFire = 0;
};

Projectile.prototype.draw = function(level) {
	var xPos = this.x - level.x;
	var yPos = this.y - level.y;

	if (xPos > -20 && xPos < 1000 && yPos > -20 && yPos < 500) {
		globals.ctx.fillStyle = "#ff0000";
		var rect = this.getCollisionBarrier();
		globals.ctx.fillRect(rect.left - level.x, rect.top - level.y, rect.width(),
				rect.height());
	}
};

Projectile.prototype.update = function(level) {
	this.move(level);	
};

Projectile.prototype.move = function(level) {
	this.x = this.x + this.vx;
	this.y = this.y + this.vy;
	//client does no collision detection
};

/**
 * Returns -1 if hit wall, PlayerID if hit player, undefined if no hit
 */
Projectile.prototype.checkHit = function(globals, level) {
	var box = this.getCollisionBarrier();
	for (var i in level.walls.length) {
		if (box.intersects(level.walls[i])) {
			return -1;
		}
	}
	for (var player in globals.players) {
		if (box.intersects(globals.players[player].getCollisionBarrier())) {
			return player;
		}
	}
	return -2; //probably don't need this
};

Projectile.prototype.getCollisionBarrier = function(location) {
	if (!location)
		location = this;
	return new Rectangle({left: location.x, right: location.x + 20,
		top: location.y, bottom: location.y + 20});
};
