
var Gate = function(team) {
	this.health = 1000;
	this.team = team;
	this.left = 1350;
	this.right = 1650;
	if (team == 0) {
		this.top = 500;
		this.bottom = 540;
	} else {
		this.top = 2500;
		this.bottom = 2540;
	}
};

Gate.prototype.takeHit = function(damage) {
	this.health -= damage;
	if (this.health < 0) this.health = 0;
};

Gate.prototype.draw = function(level) {
	var box = this.getCollisionBarrier();
    var xPos = this.left - level.x;
    var yPos = this.top - level.y;

    if (xPos > -300 && xPos < 1000 && yPos > -20 && yPos < 500) {
		globals.ctx.strokeStyle = Player.COLLISION_BOUND_STROKE[this.team];
		globals.ctx.fillStyle = Player.COLLISION_BOUND_STROKE[this.team];
		globals.ctx.strokeRect(xPos, yPos, box.width(), box.height());
		globals.ctx.globalAlpha = this.health / 1000;
		globals.ctx.fillRect(xPos, yPos, box.width(), box.height());
		globals.ctx.globalAlpha = 1;
	}
};

Gate.prototype.getCollisionBarrier = function() {
	return new Rectangle(this);
};

