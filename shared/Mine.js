/*
 * The Mine class
 */
var Mine = function(player, m) {
  this.owner = player.playerID;
  this.team = player.team;
  this.m = m;
  this.x = player.tank.x+30; //center of mine
  this.y = player.tank.y+30;
  this.range = player.mine.range;
  this.damage = player.mine.damage;

  player.mine.live++;
};

Mine.RADIUS = 10;

Mine.prototype.draw = function(level, yourTeam) {
  var xPos = this.x - level.x;
  var yPos = this.y - level.y;

  if (xPos > -10 && xPos < 1000 && yPos > -10 && yPos < 500) {
    if (yourTeam === this.team) { //mines are invisible to enemies!
      globals.ctx.fillStyle = Player.COLLISION_BOUND_STROKE[this.team];
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
