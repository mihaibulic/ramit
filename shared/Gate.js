
var Gate = function(team) {
	this.health = 1000;
	this.team = team;
};
Gate.BARRIER = [];
var b1 = { left: 1350, right: 1650, 
					top: 500, bottom: 540 };
					/*
Gate.BARRIER[0] = new Rectangle(b1);
Gate.BARRIER[1] = new Rectangel( { left: 1350, right: 1650, 
				 	top: 2500, bottom:2540 } );
*/
Gate.prototype.takeHit = function(damage) {
	this.health -= damage;
	if (this.health < 0) this.health = 0;
};

Gate.prototype.draw = function(level) {
	var box = this.getCollisionBarrier();
    var xPos = box.x - level.x;
    var yPos = box.y - level.y;

    if (xPos > -300 && xPos < 1000 && yPos > -20 && yPos < 500) {
		globals.ctx.strokeStyle = Player.COLLISION_BOUND_STROKE[this.team];
		globals.ctx.fillStyle = Player.COLLISION_BOUND_STROKE[this.team];
		globals.ctx.strokeRect(xPos, yPos, box.width(), box.height());
		globals.ctx.globalAlpha = this.health / 1000;
		golbals.ctx.fillRect(xPos, yPos, box.width(), box.height());
		globals.ctx.globalAlpha = 1;
		consol.log("drew gate %d at %d %d", this.team, xPos, yPos);
	}
};

Gate.prototype.getCollisionBarrier = function() {
	return Gate.BARRIER[this.team];
};

