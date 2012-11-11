/**
 * A Gate protecting the player's base.
 * @param {Number} team The team number for the gate.
 */
var Gate = function(team) {
  this.health = 1000;
  this.team = team;
  this.left = 1350;
  this.right = 1650;
  if (team === 0) {
    this.top = 493;
    this.bottom = 508;
  } else {
    this.top = 2492;
    this.bottom = 2507;
  }
};

/**
 * Damage the gate.
 * @param {Number} The amount of damage the gate receives.
 * @returns {Number} The number of points earned for the hit.
 */
Gate.prototype.takeHit = function(damage) {
  this.health -= damage;
  if (this.health < 0) this.health = 0;

  if (globals.diff) {
    if (!globals.diff.b)
      globals.diff.b = [];
    globals.diff.b[this.team] = this.health;
  }

  return 0;
};

/**
 * Draws the gate.
 */
Gate.prototype.draw = function() {
  var box = this.getCollisionBarrier();
  var xPos = this.left - globals.level.x;
  var yPos = this.top - globals.level.y - 5;

  if (xPos > -300 && xPos < 1000 && yPos > -20 && yPos < 500) {
    if (this.health > 0) {
      globals.ctx.globalAlpha = this.health / 100;
      globals.ctx.drawImage(globals.resources.gates[this.team], xPos, yPos);
      globals.ctx.globalAlpha = 1;
    }
    globals.ctx.drawImage(globals.resources.gates[2], xPos, yPos);
  }

  if (globals.queries.debug === "true") {
    globals.ctx.strokeStyle = Player.COLLISION_BOUND_STROKE[this.team];
    var rect = this.getCollisionBarrier();
    globals.ctx.strokeRect(rect.left - globals.level.x, rect.top - globals.level.y, rect.width(),
                           rect.height());
  }
};

/**
 * @returns {Rectangle} A box describing the location of the gate.
 */
Gate.prototype.getCollisionBarrier = function() {
  if (this.health === 0)
    return new Rectangle();
  return new Rectangle(this);
};
