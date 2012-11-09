/*
 * The Mine class
 */
var Mine = function(player, m) {
	this.owner = player.playerID;
	this.damage = player.mine.damage;
	this.range = player.mine.range;
	this.x = player.x; //center of mine
	this.y = player.y; 
	this.delay = 3000; //5 sec delay
	this.m = m;
	player.mine.lastMine = 0;
};

Mine.prototype.update = function(globals) {
	var hits = [];
	if (this.delay > 0) {
		this.time--;
	}
	else {
		var mineBox = this.getCollisionBarrier();
		for (player in globals.players) {
			var playerBox = globals.players[player].getCollisionBarrier();
			var dist = Math.sqrt(Math.pow(mineBox.getYDistance(playerBox), 2) + 
									Math.pow(mineBox.getXDistance(playerBox), 2));
			if (dist < this.range) {
				hits[hits.length] = globals.players[player];
			}
		}
	}
	return hits;
};

Mine.prototype.draw = function(level) {
	console.log("drawing mine");
	var xPos = this.x - level.x;
    var yPos = this.y - level.y;

    if (xPos > -10 && xPos < 1000 && yPos > -10 && yPos < 500) {
		if (this.delay > 0) {
			globals.ctx.fillStyle = "#00FF00"; //green if not hot
		} else {
			globals.ctx.fillStyle = "#000000"; //black if hot
		}
 		globals.ctx.beginPath();
        globals.ctx.arc(xPos, yPos, rect.width()/2, 0 , 2 * Math.PI, true);
        globals.ctx.closePath();

    	if (globals.queries.debug === "true") {
			globals.ctx.strokeStyle = globals.ctx.fillStyle;
			globals.ctx.strokeRect(xPos, yPos, rect.width(), rect.height());
 			globals.ctx.beginPath();
			globals.ctx.arc(xPos, yPos, this.range + 5, 0, 2 * Math.PI, true);
        	globals.ctx.closePath();
		}
	}
};

Mine.prototype.getCollisionBarrier = function() {
	return new Rectangle( { right: this.x + 5, left: this.x - 5, 
			top: this.y - 5, bottom: this.y + 5} );
};
