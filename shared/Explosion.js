/**
 * Explosions damage tanks.
 * @param {Number} x The x-coordinate of the explosion.
 * @param {Number} y The y-coordinate of the explosion.
 * @param {Number} range The range that the explosion causes damage.
 * @param {Player} owner The player that fired the weapon that caused the explosion.
 * @param {Player} target The player that was directly hit by the weapon.
 * @param {Number} damage The amount of damage that the target takes when hit. All
 *     players in range of the explosion take a portion of the damage.
 * @param {Projectile} opt_projectile The projectile which exploded.
 * @param {Object} opt_state A state object to build the explosion with.
 */
var Explosion = function(x, y, range, owner, target, damage, opt_projectile, opt_state) {
  this.animationFrame = 0;

  if (opt_state) {
    this.x = opt_state.x;
    this.y = opt_state.y;
    this.range = opt_state.r;
    return;
  }

  this.x = x;
  this.y = y;
  this.range = range;

  if (target && target.takeHit)
    owner.addPoints(target.takeHit(damage));

  if (range > 0) {
    for (var id in globals.players) {
      var player = globals.players[id];
      var distance = player.getCenterDistance(this);
      if (distance < range && player !== target) {
        owner.addPoints(player.takeHit(0.25 * damage + 0.75 * (1 - distance / range) * damage));
      }
    }
  }

  if (globals.diff) {
    if (!globals.diff.e)
      globals.diff.e = [];
    var e = {};
    if (opt_projectile)
      e.i = opt_projectile.id;
    e.x = this.x;
    e.y = this.y;
    e.r = this.range;
    globals.diff.e.push(e);
  }
};

/**
 * Draws the explosion on the screen.
 * @returns {Boolean}
 */
Explosion.prototype.draw = function() {
  // nothing yet, but will eventually be fantastic explosion;
};
