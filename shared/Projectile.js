var Projectile = function(team, owner, x, y, vx, vy, damage) {
	this.x = x;
	this.y = y;
	this.vx = vx;
	this.vy = vy;
	this.team = team;
	this.owner = owner; //for point tracking
	this.damage = damage;
};

Player.prototype.draw = function(level) {
	var xPos = this.tank.x - level.x;
	var yPos = this.tank.y - level.y;
	
	if (xPos > -20 && xPos < 1000 && yPos > -20 && yPos < 500) {
		globals.ctx.fillRect(xPow, yPos, 40, 40);
	}
	
};

Player.prototype.update = function(level) {
	this.move(level);	
};

Player.prototype.move = function(level) {
	this.x = Math.round(this.x + this.vx);
	this.y = Math.round(this.y + this.vy);
	
	//get collision box of projectile
	var box = this.getCollisionBarrier();
	for (var i = 0; i < level.walls.length; i++) {
		if (box.intersects(level.walls[i])) {
			//hit wall
		}
	}
	//player hits
	//diff?
};

Player.prototype.getCollisionBarrier = function(location) {
	if (!location)
		location = this;
	return new Rectangle({left: location.x + 10, right: location.x + 50,
		top: location.y + 10, bottom: location.y + 50});
};

