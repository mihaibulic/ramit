/**
 * The Interactive Tanks game.
 */
var ITGame = function(team, playerID) {
	this.team = team;
	this.player = new Player(team, playerID);
	this.level = {x: 0, y: 0};
	this.loadLevel();
	
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
	
	// Game loop.
	this.interval = window.setInterval(globals.bind(function() {
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
	}
};

/**
 * Loads the walls into the level.
 */
ITGame.prototype.loadLevel = function() {
	var walls = [{left:0, right: 3000, top:0, bottom:125},
	             {left:0, right:125,top:0, bottom:3000},
	             {left:2875, right:3000, top:0, bottom:3000},
	             {left:0, right:3000, top:2875, bottom:3000},
	             {left:0,right:1350,top:438,bottom:563},
	             {left:1650,right:3000,top:438,bottom:563},
	             {left:0,right:1350,top:2438,bottom:2563},
	             {left:1650,right:3000,top:2438,bottom:2563},
	             {left:350,right:650,top:825,bottom:875},
	             {left:350,right:400,top:825,bottom:1125},
	             {left:850,right:900,top:750,bottom:1050},
	             {left:775,right:975,top:1050,bottom:1250},
	             {left:525,right:1225,top:1125,bottom:1175},
	             {left:1100,right:1900,top:825,bottom:875},
	             {left:1450,right:1550,top:1100,bottom:1200},
	             {left:2100,right:2150,top:750,bottom:1050},
	             {left:2025,right:2225,top:1050,bottom:1250},
	             {left:1775,right:2475,top:1125,bottom:1175},
	             {left:2350,right:2650,top:825,bottom:875},
	             {left:2600,right:2650,top:825,bottom:1125},
	             {left:350,right:1150,top:1475,bottom:1525},
	             {left:1400,right:1600,top:1400,bottom:1600},
	             {left:1850,right:2650,top:1475,bottom:1525},
	             {left:350,right:400,top:1875,bottom:2175},
	             {left:350,right:650,top:2125,bottom:2175},
	             {left:525,right:1225,top:1825,bottom:1875},
	             {left:775,right:975,top:1750,bottom:1950},
	             {left:850,right:900,top:1950,bottom:2250},
	             {left:1450,right:1550,top:1800,bottom:1900},
	             {left:1100,right:1900,top:2125,bottom:2175},
	             {left:1775,right:2475,top:1825,bottom:1875},
	             {left:2025,right:2225,top:1750,bottom:1950},
	             {left:2100,right:2150,top:1950,bottom:2250},
	             {left:2350,right:2650,top:2125,bottom:2175},
	             {left:2600,right:2650,top:1875,bottom:2175}];
	this.level.walls = [];
	for (var i = 0; i < walls.length; i++) {
		this.level.walls[i] = new Rectangle(walls[i]);
	}
};
