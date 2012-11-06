var Projectile = function(player, n) {
	var speed = 10; //eventually taken from player for upgrades
	var turretLength = 30;
	this.n = n;
	var degrees = player.tank.turretAim * 2;
	var rads = degrees * Math.PI / 180;
	this.vx = Math.cos(rads);
	this.vy = Math.sin(rads);
	// (tank center) + (turret offset)
	this.x = (player.tank.x + 25) + (this.vx * turretLength);
	this.y = (player.tank.y + 25) + (this.vy * turretLength);
	this.vx *= speed;
	this.vy *= speed;
	this.team = player.team;
	this.owner = player.playerID; // for score tracking
	this.damage = 1;	//eventually taken from player for upgrades
	player.lastFire = 0;
};

Projectile.prototype.draw = function(level) {
	var xPos = this.x - level.x;
	var yPos = this.y - level.y;

	if (xPos > -20 && xPos < 1000 && yPos > -20 && yPos < 500) {
		var rect = this.getCollisionBarrier();
		globals.ctx.fillStyle = Player.COLLISION_BOUND_STROKE[this.team];
		globals.ctx.fillRect(xPos, yPos, rect.width(), rect.height());
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
	console.log("CHECKING HIT %d, %d", this.x, this.y);
	var box = this.getCollisionBarrier();
	//check walls
	for (var i in level.walls.length) {
		if (box.intersects(level.walls[i])) {
			console.log("HIT WALL");
			return -1;
		}
	}
	/*
	//check players of other teams
	for (var player in globals.players) {
		if (globals.players[player].team != this.team && 
				box.intersects(globals.players[player].getCollisionBarrier())) {
			return player;
		}
	}*/
	return -2; //probably don't need this
};

Projectile.prototype.getCollisionBarrier = function(location) {
	if (!location)
		location = this;
	return new Rectangle({left: location.x, right: location.x + 10,
		top: location.y, bottom: location.y + 10});
};
