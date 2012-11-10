/*
 * The Mine class
 */
var Mine = function(player, m) {
  this.owner = player.playerID;
  this.damage = player.mine.damage;
  this.range = player.mine.range;
  this.m = m;
  this.x = player.tank.x+30; //center of mine
  this.y = player.tank.y+30;
  this.delay = 300; //5 sec delay
  player.mine.live++;
};

Mine.prototype.update = function(globals) {
  var hits = [];
  if (this.delay > 0) {
    this.delay--;
    if (this.delay === 0)
      console.log("MINE %d IS LIVE!", this.m);
  }
  else {
    var mineBox = this.getCollisionBarrier();
    for (var player in globals.players) {
      var playerBox = globals.players[player].getCollisionBarrier();
      var dist = Math.sqrt(Math.pow(mineBox.getYDistance(playerBox), 2) +
                           Math.pow(mineBox.getXDistance(playerBox), 2));
      if (dist < this.range) {
        hits.push(player);
      }
    }
  }
  return hits;
};

Mine.prototype.draw = function(level) {
  var xPos = this.x - level.x;
  var yPos = this.y - level.y;

  if (xPos > -10 && xPos < 1000 && yPos > -10 && yPos < 500) {
    if (this.delay > 0) {
      globals.ctx.fillStyle = "#00FF00"; //green if not hot
    } else {
      globals.ctx.fillStyle = "#000000"; //black if hot
    }
    globals.ctx.beginPath();
    globals.ctx.arc(xPos, yPos, 5, 0 , 2 * Math.PI, true);
    globals.ctx.closePath();
    globals.ctx.fill();

    if (globals.queries.debug === "true") {
      globals.ctx.strokeStyle = globals.ctx.fillStyle;
      globals.ctx.strokeRect(xPos-5, yPos-5, 10, 10);
      globals.ctx.beginPath();
      globals.ctx.arc(xPos, yPos, this.range + 5, 0, 2 * Math.PI, true);
      globals.ctx.closePath();
      globals.ctx.stroke();
    }
  }
};

Mine.prototype.getCollisionBarrier = function() {
  return new Rectangle( { right: this.x + 5, left: this.x - 5,
                          top: this.y - 5, bottom: this.y + 5} );
};
