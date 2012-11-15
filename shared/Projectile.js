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
    this.sx = opt_state.x;
    this.sy = opt_state.y;
    this.range = opt_state.r;
    this.damage = opt_state.d;
    this.vx = opt_state.vx;
    this.vy = opt_state.vy;
    this.type = opt_state.t;

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
  this.x = Math.round(this.x);
  this.y = Math.round(this.y);
  this.vx = Math.round(this.vx);
  this.vy = Math.round(this.vy);
  this.sx = x;
  this.sy = y;

  if (type === Projectile.Type.MINE)
    player.projectile[type].live++;

  player.projectile[type].lastFire = 0;

  if (globals.diff) {
    var diff = globals.getImmediateDiff();
    if (!diff.q)
      diff.q = {};
    diff.q[this.id] = this.getAbsoluteState();
  }
};

/**
 * The types of projectiles.
 */
Projectile.Type = {NORMAL: 0, MINE: 1, ROCKET: 2};

/**
 * The ID of the next projectile.
 */
Projectile.nextID = 0;

/**
 * @returns {Object} The absolute state of the projectile.
 */
Projectile.prototype.getAbsoluteState = function() {
  var q = {};
  q.i = this.owner;
  q.t = this.type;
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
 * @param {int} team for drawing only friendly mines
 */
Projectile.prototype.draw = function(team) {
  var xPos = this.x - globals.level.x;
  var yPos = this.y - globals.level.y;

  if (xPos > -10 && xPos < 1010 && yPos > -10 && yPos < 510) {
    var rect = this.getCollisionBarrier();

    globals.ctx.fillStyle = Player.TEAM_COLOR[this.team];

    if (this.type !== Projectile.Type.MINE) {
      if (this.type === Projectile.Type.ROCKET) {
        globals.ctx.fillStyle = "#FFFF00";
        globals.ctx.beginPath();
        for (var i = 1; i < 2; i++) { //will be more
          console.log("vx, vy: " + this.vx + ", " + this.vy);
          var xTail = this.vx * i / 500;
          var yTail = this.vy * i / 500;
          console.log("xtail, yTail: " + xTail + ", " + yTail);
          globals.ctx.arc(xPos - xTail, yPos - yTail, 20, 0, 2 * Math.PI);
        }
        globals.ctx.closePath();

        globals.ctx.fill();
      }
      globals.ctx.fillStyle = Player.TEAM_COLOR[this.team];

      globals.ctx.beginPath();
      globals.ctx.arc(xPos, yPos, rect.width() / 2, 0 , 2 * Math.PI);
      globals.ctx.closePath();

      globals.ctx.fill();

    }
    else if (this.team === team) {
      var pos = Rectangle.getPos(this);
      globals.ctx.drawImage(globals.resources.mines[this.team], xPos - rect.width()/2, yPos - rect.width()/2);
    }

    if (globals.queries.debug === "true") {
      globals.ctx.strokeStyle = Player.TEAM_COLOR[this.team];
      globals.ctx.strokeRect(rect.left - globals.level.x,
                             rect.top - globals.level.y, rect.width(),
                             rect.height());
    }
  }
};

Projectile.prototype.predict = function() {
  var x = this.x;
  var y = this.y;
  this.x += Math.round(this.vx / 60);
  this.y += Math.round(this.vy / 60);

  var hit = false;
  var target;

  // Collisions with Players
  for (var pid in globals.players) {
    target = globals.players[pid];
    if (target.team === this.team)
      continue;
    if (target.getCollisionBarrier().intersects(this.getCollisionBarrier())) {
      hit = true;
      break;
    }
  }

  // Collisions with Gates
  if (!hit) {
    for (var gid in globals.level.gates) {
      target = globals.level.gates[gid];
      if (target.team === this.team)
        continue;
      if (target.getCollisionBarrier().intersects(this.getCollisionBarrier())) {
        hit = true;
        break;
      }
    }
  }

  // Collisions with HQs
  if (!hit) {
    for (var hid in globals.level.hqs) {
      target = globals.level.hqs[hid];
      if (target.team === this.team)
        continue;
      if (target.getCollisionBarrier().intersects(this.getCollisionBarrier())) {
        hit = true;
        break;
      }
    }
  }

  // Collisions with Walls
  if (!hit) {
    for (var wid in globals.level.walls) {
      if (globals.level.walls[wid].intersects(this.getCollisionBarrier())) {
        hit = true;
        break;
      }
    }
  }

  if (hit) {
    this.x = x;
    this.y = y;
  }
};

/**
 * Updates the projectile.
 * @returns {Boolean} If the projectile has exploded.
 */
Projectile.prototype.update = function() {
  this.x += Math.round(this.vx / 60);
  this.y += Math.round(this.vy / 60);

  var hit = false;
  var target;

  // Collisions with Players
  for (var pid in globals.players) {
    target = globals.players[pid];
    if (target.team === this.team)
      continue;
    if (target.getCollisionBarrier().intersects(this.getCollisionBarrier())) {
      this.vx = this.vy = 0;
      new Explosion(this.x, this.y, this.range, globals.players[this.owner],
                    target, this.damage, this, false);
      hit = true;
      break;
    }
  }

  // Collisions with Gates
  if (!hit) {
    for (var gid in globals.level.gates) {
      target = globals.level.gates[gid];
      if (target.team === this.team)
        continue;
      if (target.getCollisionBarrier().intersects(this.getCollisionBarrier())) {
        this.vx = this.vy = 0;
        new Explosion(this.x, this.y, this.range, globals.players[this.owner],
                      target, this.damage, this, false);
        hit = true;
        break;
      }
    }
  }

  // Collisions with HQs
  if (!hit) {
    for (var hid in globals.level.hqs) {
      target = globals.level.hqs[hid];
      if (target.team === this.team)
        continue;
      if (target.getCollisionBarrier().intersects(this.getCollisionBarrier())) {
        this.vx = this.vy = 0;
        new Explosion(this.x, this.y, this.range, globals.players[this.owner],
                      target, this.damage, this, false);
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
                      null, this.damage, this, false);
        hit = true;
        break;
      }
    }
  }

  if (hit && this.type === Projectile.Type.MINE)
    globals.players[this.owner].projectile[this.type].live--;

  if (!hit && globals.diff) {
    if ((this.vx || this.vy) && !globals.diff.q)
      globals.diff.q = {};
    if ((this.vx || this.vy) && !globals.diff.q[this.id])
      globals.diff.q[this.id] = {};

    if (this.vx)
      globals.diff.q[this.id].x = this.x;
    if (this.vy)
      globals.diff.q[this.id].y = this.y;
  } else if (hit) {
    if (globals.diff && globals.diff.q)
      delete globals.diff.q[this.id];
    if (globals.immediateDiff && globals.immediateDiff.q)
      delete globals.immediateDiff.q[this.id];
  }

  return hit;
};

/**
 * @returns {Rectangle} A box describing the location of the projectile.
 */
Projectile.prototype.getCollisionBarrier = function() {
  if (this.type === Projectile.Type.MINE)
    return new Rectangle({left: this.x - 14, right: this.x + 14,
                          top: this.y - 14, bottom: this.y + 14});
  return new Rectangle({left: this.x - 5, right: this.x + 5,
                        top: this.y - 5, bottom: this.y + 5});
};
