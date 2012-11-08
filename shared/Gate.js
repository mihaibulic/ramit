var Gate = function(team) {
	this.health = 1000;
	this.team = team;
}

Gate.BARRIER = [ { x: 1350, y: 500, width: 300, height: 30 }, 
				{ x: 1350, y: 2500, width: 300, height: 30 } ];

Gate.prototype.takeHit = function(damage) {
	this.health -= damage;
}

Gate.prototype.draw = function(level) {
    var xPos = Gate.BARRIER[this.team].x - level.x;
    var yPos = Gate.BARRIER[this.team].y - level.y;

    if (xPos > -300 && xPos < 1000 && yPos > -20 && yPos < 500) {
		globals.ctx.strokeStyle = Player.COLLISION_BOUND_STROKE[this.team];
		globals.ctx.fillStyle = Player.COLLISION_BOUND_STROKE[this.team];
		globals.ctx.strokeRect(xPos + 10, yPos + 40, 40, 10);
		globals.ctx.globalAlpha = this.health / 1000;
		globals.ctx.fillRect(xPos + 10, yPos + 40, 40 * this.health / this.initHealth, 10);
		globals.ctx.globalAlpha = 1;
	}
}

Gate.prototype.getCollisionBarrier = function(location) {
	return Gate.BARRIER[team];
}
