/**
 * A Projectile is a weapon that it shot from the turret.
 * @param {Player} player The player that shot the projectile.
 * @param {Number} n An id for the projectile.
 */
var Projectile = function(player, n) {
  var speed = player.projectile.speed;
  var turretLength = 30;
  this.n = n;
  var degrees = player.tank.turretAim * 2;
  var rads = degrees * Math.PI / 180;
  this.vx = Math.cos(rads);
  this.vy = Math.sin(rads);
  // (tank center) + (turret offset)
  this.x = (player.tank.x + 25) + (this.vx * turretLength);
  this.y = (player.tank.y + 25) + (this.vy * turretLength);
  this.vx *= speed;
  this.vy *= speed;
  this.team = player.team;
  this.owner = player.playerID; // for score tracking
  this.damage = player.projectile.damage;
  player.projectile.lastFire = 0;
};

/**
 * Draws the projectile.
 * @param {Level} level The state of the level.
 */
Projectile.prototype.draw = function(level) {
  var xPos = this.x - level.x;
  var yPos = this.y - level.y;

  if (xPos > -20 && xPos < 1000 && yPos > -20 && yPos < 500) {
    var rect = this.getCollisionBarrier();

    globals.ctx.fillStyle = Player.COLLISION_BOUND_STROKE[this.team];

    globals.ctx.beginPath();
    globals.ctx.arc(xPos+5, yPos+5, rect.width()/2, 0 , 2 * Math.PI, true);
    globals.ctx.closePath();

    globals.ctx.fill();

    if (globals.queries.debug === "true") {
      globals.ctx.strokeStyle = Player.COLLISION_BOUND_STROKE[this.team];
      globals.ctx.strokeRect(xPos, yPos, rect.width(), rect.height());
    }
  }
};

/**
 * Updates the projectile.
 * @param {Level} level The state of the level.
 */
Projectile.prototype.update = function(level) {
  this.x = this.x + this.vx;
  this.y = this.y + this.vy;
};

/**
 * Checks if the projectile has hit something.
 * @param {Level} level The state of the level.
 * @returns {Object | Number} The object that was hit or null if nothing was
 *     hit.
 */
Projectile.prototype.checkHit = function(level) {
  var box = this.getCollisionBarrier();
  //check walls
  for (var i in level.walls) {
    if (box.intersects(level.walls[i])) {
      console.log("HIT WALL");
      return {};
    }
  }
  //check players of other teams
  for (var player in globals.players) {
    if (globals.players[player].team != this.team &&
        box.intersects(globals.players[player].getCollisionBarrier())) {
      console.log("HIT PLAYER");
      return globals.players[player];
    }
  }
  //check gates
  for (var g in level.gates) {
    if (this.team !== level.gates[g].team &&
        box.intersects(level.gates[g].getCollisionBarrier())) {
      console.log("HIT GATE");
      return level.gates[g];
    }
  }
  return null;
};

/**
 * @returns {Rectangle} A box describing the location of the projectile.
 */
Projectile.prototype.getCollisionBarrier = function(location) {
  if (!location)
    location = this;
  return new Rectangle({left: location.x, right: location.x + 10,
                        top: location.y, bottom: location.y + 10});
};
