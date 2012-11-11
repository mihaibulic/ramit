/**
 * Explosions damage tanks.
 * @param {Number} x The x-coordinate of the explosion.
 * @param {Number} y The y-coordinate of the explosion.
 * @param {Number} range The range that the explosion causes damage.
 * @param {Player} owner The player that fired the weapon that caused the explosion.
 * @param {Player} target The player that was directly hit by the weapon.
 * @param {Number} damage The amount of damage that the target takes when hit. All
 *     players in range of the explosion take a portion of the damage.
 * @param {Boolean} true if friendly fire is ON (can hurt teammates)
 * @param {Projectile} opt_projectile The projectile which exploded.
 * @param {Object} opt_state A state object to build the explosion with.
 */
var Explosion = function(x, y, range, owner, target, damage, opt_ff, opt_projectile, opt_state) {
  this.animationFrame = 0;

  if (opt_state) {
    this.x = opt_state.x;
    this.y = opt_state.y;
    this.range = opt_state.r;
    return;
  }

  // ff is on by default
  this.ff = opt_ff ? !!opt_ff : true;

  this.x = x;
  this.y = y;
  this.range = range;

  if (target && target.takeHit)
    owner.addPoints(target.takeHit(damage, owner.team));

  if (range > 0) {
    for (var id in globals.players) {
      var player = globals.players[id];
      if((this.ff && player !== target) || (!this.ff && player.team !== target.team)) {
        var distance = player.getCenterDistance(this);
        if (distance < range) {
          owner.addPoints(player.takeHit(Math.round(0.25 * damage + 0.75 * (1 - distance / range) * damage), owner.team));
        }
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

Explosion.Type = { PROJECTILE: 0, MEDIC: 1, EMP: 2 };

/**
 * Draws the explosion on the screen.
 * @returns {Boolean} true when complete
 */
Explosion.prototype.draw = function() {
  var xPos = this.x - globals.level.x;
  var yPos = this.y - globals.level.y;
  range = this.range;
  if (this.range === 0)
    range = 5;

  if (this.damage < 0) //EMT/medic
    globals.ctx.strokeStyle = "#00FF00";
  else if (this.damage === 0) // EMP
    globals.ctx.strokeStyle = "#440077";
  else //normal
    globals.ctx.strokeStyle = "#FFFF00";
  globals.ctx.lineWidth = 5;
  globals.ctx.beginPath();
  globals.ctx.arc(xPos, yPos, (this.animationFrame + 1) / 5 * range, 0 , 2 * Math.PI);
  globals.ctx.closePath();
  globals.ctx.stroke();

  globals.ctx.lineWidth = 1;
  this.animationFrame++;
  if (this.animationFrame > 5)
    return true;
  return false;
};
