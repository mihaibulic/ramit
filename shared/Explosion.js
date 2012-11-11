/**
 * Explosions damage tanks.
 * @param x The x-coordinate of the explosion.
 * @param y The y-coordinate of the explosion.
 * @param range The range that the explosion causes damage.
 * @param owner The player that fired the weapon that caused the explosion.
 * @param target The player that was directly hit by the weapon.
 * @param damage The amount of damage that the target takes when hit. All
 *     players in range of the explosion take a portion of the damage.
 */
var Explosion = function(x, y, range, owner, target, damage) {
  this.x = x;
  this.y = y;
  this.range = range;

  this.animationFrame = 0;

  if (target && target.takeHit)
    owner.addPoints(target.takeHit(damage));

  if (range > 0) {
    for (var id in globals.players) {
      var player = globals.players[id];
      var distance = player.getCenterDistance(this);
      if (distance < range && player !== target) {
        owner.addPoints(player.takeHit(0.25 * damage + 0.75 * (1 - distance / range) * damage);
      }
    }
  }
};

/**
 * Draws the explosion on the screen.
 * @returns {Boolean}
 */
Explosion.prototype.draw = function(levels) {
  // nothing yet, but will eventually be fantastic explosion;
};
