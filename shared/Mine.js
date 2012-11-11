/*
 * The Mine class
 */
var Mine = function(player, m) {
  //owner is for awarding points
  this.owner = player.playerID;
  //team is for activating for enemies only
  //and drawing for friendlies only
  this.team = player.team;
  //keeps track of how many mines the owner has active
  //decremented when the mine explodes
  player.mine.live++; 

  //m is the number of the mine
  this.m = m;

  //x,y of center of the mine
  this.x = player.tank.x+30;
  this.y = player.tank.y+30;

  //these are saved for creating an Explosion
  this.range = player.mine.range;
  this.damage = player.mine.damage;
};

Mine.RADIUS = 10;

// Draws the mine for friendlies.
// In debug mode, draws collision box and range for everyone.
Mine.prototype.draw = function(level, yourTeam) {
  var xPos = this.x - level.x;
  var yPos = this.y - level.y;

  if (xPos > -10 && xPos < 1000 && yPos > -10 && yPos < 500) {
    globals.ctx.fillStyle = Player.COLLISION_BOUND_STROKE[this.team];
    if (yourTeam === this.team) {
      globals.ctx.beginPath();
      globals.ctx.arc(xPos, yPos, Mine.RADIUS, 0 , 2 * Math.PI, true);
      globals.ctx.closePath();
      globals.ctx.fill();
    }

    if (globals.queries.debug === "true") {
      globals.ctx.strokeStyle = globals.ctx.fillStyle;
      globals.ctx.strokeRect(xPos-Mine.RADIUS, yPos-Mine.RADIUS, Mine.RADIUS*2, Mine.RADIUS*2);
      globals.ctx.beginPath();
      globals.ctx.arc(xPos, yPos, this.range, 0, 2 * Math.PI, true);
      globals.ctx.closePath();
      globals.ctx.stroke();
    }
  }
};

Mine.prototype.getCollisionBarrier = function() {
  return new Rectangle( { right: this.x + Mine.RADIUS, left: this.x - Mine.RADIUS,
                          top: this.y - Mine.RADIUS, bottom: this.y + Mine.RADIUS} );
};

