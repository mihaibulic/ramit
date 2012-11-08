
var Gate = function(team) {
    this.health = 1000;
    this.team = team;
    this.left = 1350;
    this.right = 1650;
    if (team == 0) {
	this.top = 480;
	this.bottom = 495;
    } else {
	this.top = 2505;
	this.bottom = 2520;
    }
};

Gate.prototype.takeHit = function(damage) {
    this.health -= damage;
    if (this.health < 0) this.health = 0;
};

Gate.prototype.draw = function(level) {
    var box = this.getCollisionBarrier();
    var xPos = this.left - level.x;
    var yPos = this.top - level.y - 5;
    
    if (xPos > -300 && xPos < 1000 && yPos > -20 && yPos < 500) {
	if (this.health > 0)
	    globals.ctx.drawImage(globals.resources.gates[this.team], xPos, yPos);
	globals.ctx.drawImage(globals.resources.gates[2], xPos, yPos);
    }
};

Gate.prototype.getCollisionBarrier = function() {
    return new Rectangle(this);
};

