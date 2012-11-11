/**
 * A Projectile is a weapon that it shot from the turret.
 * @param {Player} player The player that shot the projectile.
 * @param {Projectile.Type} type The type of the projectile.
 * @param {Number} id An id for the projectile.
 * @param {Object} opt_state An optional state to build the Projectile with.
 */
var Projectile = function(player, type, id, opt_state) {
  if (opt_state) {
    this.id = id;
    this.owner = opt_state.i;
    this.team = globals.players[this.owner].team;
    this.x = opt_state.x;
    this.y = opt_state.y;
    this.range = opt_state.r;
    this.damage = opt_state.d;
    this.vx = opt_state.vx;
    this.vy = opt_state.vy;

    if (!this.vx && !this.vy)
      this.type = Projectile.Type.MINE;
    else if (this.range)
      this.type = Projectile.Type.ROCKET;
    else
      this.type = Projectile.Type.NORMAL;

    return;
  }

  this.team = player.team;
  this.owner = player.playerID; // for score atracking
  this.type = type;
  this.id = id;
  this.range = player.projectile[type].range;
  this.damage = player.projectile[type].damage;

  var speed = player.projectile[type].speed;
  this.x = player.tank.x + 30;
  this.y = player.tank.y + 30;

  if (speed) {
    var degrees = player.tank.turretAim * 2;
    var rads = degrees * Math.PI / 180;
    this.vx = Math.cos(rads);
    this.vy = Math.sin(rads);
    // Add (turret direction * length)
    this.x += (this.vx * 30);
    this.y += (this.vy * 30);
    this.vx *= speed;
    this.vy *= speed;
  } else {
    this.vx = 0;
    this.vy = 0;
  }

  if (type === Projectile.Type.MINE)
    player.projectile[type].live++;
  else
    player.projectile[type].lastFire = 0;

  if (globals.diff) {
    if (!globals.diff.q)
      globals.diff.q = {};
    globals.diff.q[this.id] = this.getAbsoluteState();
  }
};

/**
 *
 */
Projectile.Type = {NORMAL: 0, MINE: 1, ROCKET: 2};

/**
 *
 */
Projectile.nextID = 0;

Projectile.prototype.getAbsoluteState = function() {
  var q = {};
  q.i = this.owner;
  q.x = this.x;
  q.y = this.y;
  q.r = this.range;
  q.d = this.damage;
  q.vx = this.vx;
  q.vy = this.vy;
  return q;
};

/**
 * Draws the projectile.
 */
Projectile.prototype.draw = function() {
  var xPos = this.x - globals.level.x;
  var yPos = this.y - globals.level.y;

  if (xPos > -10 && xPos < 1010 && yPos > -10 && yPos < 510) {
    var rect = this.getCollisionBarrier();

    globals.ctx.fillStyle = Player.COLLISION_BOUND_STROKE[this.team];

    globals.ctx.beginPath();
    globals.ctx.arc(xPos, yPos, rect.width() / 2, 0 , 2 * Math.PI);
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
 * @returns {Boolean} If the projectile has exploded.
 */
Projectile.prototype.update = function() {
  this.x += this.vx;
  this.y += this.vy;

  var hit = false;

  // Collisions with Players
  for (var pid in globals.players) {
    var target = globals.players[pid];
    if (target.team === this.team)
      continue;
    if (target.getCollisionBarrier().intersects(this.getCollisionBarrier())) {
      this.vx = this.vy = 0;
      new Explosion(this.x, this.y, this.range, globals.players[this.owner],
                    target, this.damage, this);
      hit = true;
      break;
    }
  }

  // Collisions with Gates
  if (!hit) {
    for (var gid in globals.level.gates) {
      var target = globals.level.gates[gid];
      if (target.team === this.team)
        continue;
      if (target.getCollisionBarrier().intersects(this.getCollisionBarrier())) {
        this.vx = this.vy = 0;
        new Explosion(this.x, this.y, this.range, globals.players[this.owner],
                      target, this.damage, this);
        hit = true;
        break;
      }
    }
  }

  // Collisions with Walls
  if (!hit) {
    for (var wid in globals.level.walls) {
      if (globals.level.walls[wid].intersects(this.getCollisionBarrier())) {
        this.vx = this.vy = 0;
        new Explosion(this.x, this.y, this.range, globals.players[this.owner],
                      null, this.damage, this);
        hit = true;
        break;
      }
    }
  }

  if (globals.diff) {
    if (!globals.diff.q)
      globals.diff.q = {};
    if (!globals.diff.q[this.id])
      globals.diff.q[this.id] = {};

    if (this.vx)
      globals.diff.q[this.id].x = this.x;
    if (this.vy)
      globals.diff.q[this.id].y = this.y;
  }

  return hit;
};

/**
 * @returns {Rectangle} A box describing the location of the projectile.
 */
Projectile.prototype.getCollisionBarrier = function() {
  if (this.type === Projectile.Type.MINE)
    return new Rectangle({left: this.x - 10, right: this.x + 10,
                          top: this.y - 10, bottom: this.y + 10});
  return new Rectangle({left: this.x - 5, right: this.x + 5,
                        top: this.y - 5, bottom: this.y + 5});
};
