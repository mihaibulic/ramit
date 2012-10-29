/**
 * The Interactive Tanks game.
 */
var ITGame = function(team, playerID) {
	this.team = team;
	this.player = new Player(team, playerID);
	this.level = new Level();
	
	// Input events.
	var keyEvent = globals.bind(function(e) {
		if (!e)
			e = window.event;
		this.player.updateKeys(e);
	}, this);
	window.addEventListener('keydown', keyEvent);
	window.addEventListener('keyup', keyEvent);
	window.addEventListener('mousemove', globals.bind(function(e) {
		if (!e)
			e = window.event;
		this.player.updateAim(e);
	}, this));
	
	// FPS Stuff
	this.fps = 0;
	this.count = 0;
	if (globals.queries['debug'] == "true") {
		this.fpsCount = window.setInterval(globals.bind(function() {
			this.fps = this.count;
			this.count = 0;
		}, this), 1000);
	}
	
	// Game loop.
	this.interval = window.setInterval(globals.bind(function() {
		if (globals.queries['debug'] == 'true')
			this.count++;
		this.update();
		this.draw();
	}, this), 16);
};

/**
 * Update the game state.
 */
ITGame.prototype.update = function() {
	this.player.update(this.level);
		
	this.level.x = this.player.tank.x - 470;
	this.level.y = this.player.tank.y - 220;
};

/**
 * Draw the game state to the canvas.
 */
ITGame.prototype.draw = function() {
	globals.ctx.fillStyle = "#000000";
	globals.ctx.fillRect(0, 0, 1000, 500);

	var tileX = Math.max(Math.floor(this.level.x / 1000), 0);
	var tileY = Math.max(Math.floor(this.level.y / 1000), 0);
	var levelX = this.level.x % 1000;
	var levelY = this.level.y % 1000;
	
	// Draw up to four tiles of the map.
	if (tileX >= 0 && tileY >= 0) {
		globals.ctx.drawImage(globals.resources.level[tileX][tileY],
				-1 * levelX, -1 * levelY);
	}
	if (tileX < 2) {
		globals.ctx.drawImage(globals.resources.level[tileX + 1][tileY],
				-1 * levelX + 1000, -1 * levelY);
	}
	if (levelY > 500 && tileY < 2) {
		globals.ctx.drawImage(globals.resources.level[tileX][tileY + 1],
				-1 * levelX, -1 * levelY + 1000);
	}
	if (levelY > 500 && tileX < 2 && tileY < 2) {
		globals.ctx.drawImage(globals.resources.level[tileX + 1][tileY + 1],
				-1 * levelX + 1000, -1 * levelY + 1000);
	}
	
	this.player.draw(this.level);
	
	if (globals.queries['debug'] == "true") {
		globals.ctx.strokeStyle = "#00ff00";
		for (var i = 0; i < this.level.walls.length; i++) {
			globals.ctx.strokeRect(this.level.walls[i].left - this.level.x, 
					this.level.walls[i].top - this.level.y, this.level.walls[i].width(), 
					this.level.walls[i].height());
		}
		
		// Draw FPS
		globals.ctx.fillStyle = "#ffffff";
		globals.ctx.font = "normal 18px sans-serif";
		globals.ctx.textBaseline = "top";
		globals.ctx.fillText("FPS: " + this.fps, 5, 5);
	}
};
