/**
 * Explosions damage tanks.
 * @param {Number} x The x-coordinate of the explosion.
 * @param {Number} y The y-coordinate of the explosion.
 * @param {Number} range The range that the explosion causes damage.
 * @param {Player} owner The player that fired the weapon that caused the explosion.
 * @param {Player} target The player that was directly hit by the weapon.
 * @param {Number} damage The amount of damage that the target takes when hit. All
 *     players in range of the explosion take a portion of the damage.
 *     If negative, won't affect opposing team
 * @param {Projectile} opt_projectile The projectile which exploded.
 * @param {Boolean} opt_one_team, true if you want to affect only one team
 * @param {Object} opt_state A state object to build the explosion with.
 */
var Explosion = function(x, y, range, owner, target, damage, opt_projectile, opt_one_team, opt_state) {
  this.startTime = globals.updateTime;
  this.length = 5 * (1000 / globals.fps);

  if (opt_state) {
    this.type = opt_state.t;
    this.x = opt_state.x;
    this.y = opt_state.y;
    this.range = opt_state.r;
    this.owner = opt_state.o;

    if (this.type === Special.Type.EMP || this.type === Special.Type.MEDIC) 
      globals.players[this.owner].special[this.type].lastFire = 0;
      
    return;
  }

  // affect everyone by default
  this.one_team = (!opt_one_team ? false : true);
  this.damage = damage;

  this.x = x;
  this.y = y;
  this.range = range;

  if (target && target.takeHit)
    owner.addPoints(target.takeHit(damage, owner));

  if (range > 0) {
    for (var id in globals.players) {
      var player = globals.players[id];
      if (this.canAffect(player, owner, target)) {
        var distance = player.getCenterDistance(this);
        if (distance < range)
          owner.addPoints(player.takeHit(Math.round(0.25 * damage + 0.75 * (1 - distance / range) * damage), owner));
      }
    }
  }

  if (globals.diff) {
    var diff = globals.getImmediateDiff();

    if (!diff.e)
      diff.e = [];
    var e = {};
    if (opt_projectile)
      e.i = opt_projectile.id;
    var type = Explosion.Type.PROJECTILE;
    if (damage < 0)
      type = Explosion.Type.MEDIC;
    else if (opt_one_team)
      type = Explosion.Type.EMP;
    e.t = type;
    e.x = this.x;
    e.y = this.y;
    e.r = this.range;
    e.o = this.owner;

    diff.e.push(e);
  }
};

Explosion.Type = { PROJECTILE: 0, MEDIC: 1, EMP: 2 };

/**
 * Checks if this player can be hit by the splash of an explosion
 * @returns true iff the player should be hit by the splash, false otherwise
 */
Explosion.prototype.canAffect = function(player, owner, target) {
  return player !== target && (!this.one_team || (this.damage > 0 && player.team !== owner.team) ||
          (this.damage < 0 && player.team === owner.team && player !== owner));
};

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

  if (this.type === Explosion.Type.MEDIC) { //medic
    globals.ctx.strokeStyle = Player.HEALTH[2];
  }
  else if (this.type === Explosion.Type.EMP) { // EMP
    globals.ctx.strokeStyle = "#770077";
  }
  else { //normal
    globals.ctx.strokeStyle = "#FFFF00";
  }

  var progress = (globals.updateTime - this.startTime) / this.length;
  globals.ctx.lineWidth = 5;
  globals.ctx.beginPath();
  globals.ctx.arc(xPos, yPos, Math.min(progress, 1) * range, 0 , 2 * Math.PI);
  globals.ctx.closePath();
  globals.ctx.stroke();

  globals.ctx.lineWidth = 1;
  if (progress >= 1)
    return true;
  return false;
};
