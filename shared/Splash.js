var Splash = function(x, y, range, damage) {
  this.x = x;
  this.y = y;
  this.range = range;
  this.damage = damage;
};

Splash.prototype.draw = function(levels) {
  // nothing yet, but will eventually be fantastic explosion;
};

Splash.prototype.getHits = function(globals) {
  var hits = [];
  var hitBox = this.getCollisionBarrier();
  for (var player in globals.players) {
    var playerBox = globals.players[player].getCollisionBarrier();
    var dist = Math.sqrt(Math.pow(mineBox.getYDistance(playerBox), 2) +
                         Math.pow(mineBox.getXDistance(playerBox), 2));
    if (dist < this.range) {
      hits.push(player);
    }
  }

  return hits;
};

Splash.prototype.getCollisionBarrier = function() {
  return new Rectangle( { right: this.x, left: this.x,
                          top: this.y, bottom: this.y} );
};   



