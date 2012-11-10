var Rocket = function(player, r) {
  this.range = player.rocket.range;
  this.damage = player.rocket.damage;
  this.owner = player.playerID;
  this.projectile = new Projectile(player, r);
  this.splash = [];

  console.log("rocket fire from (" + player.tank.x + ", " + player.tank.y);

  player.rocket.lastFire = 0;
};

Rocket.prototype.draw = function(level) {
  if(this.projectile !== undefined)
    this.projectile.draw(level);
  // else
    // draw rocket blast
};

Rocket.prototype.update = function(level) {
  if(this.projectile !== undefined)
    this.projectile.update(level);
};

Rocket.prototype.move = function(level) {
  if(this.projectile !== undefined)
    this.projectile.move(level);
};

Rocket.prototype.checkHit = function(globals, level) {
  var hit;

  if(this.projectile !== undefined) {
    hit = this.projectile.checkHit(globals, level);

    if(hit !== undefined) {
      console.log("rocket has hiti at " + this.projectile.x + ", " + this.projectile.y);
      this.splash = new Splash(this.projectile.x, this.projectile.y, this.range, this.damage);
      hit = this.splash.getHits(globals);
      delete this.projectile;
    }
  }

  return hit;
};

Rocket.prototype.getCollisionBarrier = function(location) {
  if(this.projectile !== undefined)
    return this.projectile.getCollisionBarrier(location);
  else
    return this.splash.getCollisionBarrer();
};

