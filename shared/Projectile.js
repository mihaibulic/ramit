/**
 * A Projectile is a weapon that it shot from the turret.
 * @param {Player} player The player that shot the projectile.
 * @param {Projectile.Type} type The type of the projectile.
 * @param {Number} id An id for the projectile.
 * @param {Object} opt_state An optional state to build the Projectile with.
 */
var Projectile = function(player, type, id, opt_state) {
  this.hitWall = false;
  this.id = id;
 
  if (opt_state) {
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
  }
  else {
    this.team = player.team;
    this.owner = player.playerID; // for score tracking
    this.type = type;
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
    this.sx = this.x;
    this.sy = this.y;

    if (globals.diff) {
      var diff = globals.getImmediateDiff();
      if (!diff.q)
        diff.q = {};
      diff.q[this.id] = this.getAbsoluteState();
    }
  }

  globals.players[this.owner].projectile[this.type].lastFire.reset();

  if (this.type === Projectile.Type.MINE)
    globals.players[this.owner].projectile[this.type].live++;
  else if (this.type === Projectile.Type.BOMB) 
    globals.players[this.owner].projectile[this.type].allowed--;
};

/**
 * The types of projectiles.
 */
Projectile.Type = {NORMAL: 0, MINE: 1, ROCKET: 2, BOMB: 3};

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
  if (this.hitWall)
    return;
  var xPos = this.x - globals.level.x;
  var yPos = this.y - globals.level.y;

  if (xPos > -10 && xPos < 1010 && yPos > -10 && yPos < 510) {
    var rect = this.getCollisionBarrier();

    globals.ctx.fillStyle = Player.TEAM_COLOR[this.team];

    if (this.type === Projectile.Type.BOMB) 
      globals.ctx.drawImage(globals.resources.bomb, xPos - rect.width()/2, yPos - rect.width()/2);
    else if (this.type !== Projectile.Type.MINE) {
      if (this.type === Projectile.Type.ROCKET) {
        globals.ctx.fillStyle = "#FFFF00";
        globals.ctx.beginPath();
        for (var i = 1; i < 5; i++) { //will be more
          var xTail = this.vx * i * i / 200;
          var yTail = this.vy * i * i / 200;
          globals.ctx.arc(xPos - xTail, yPos - yTail, 3, 0, 2 * Math.PI);
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
  var sx = this.sx;
  var sy = this.sy;
  this.x += Math.round(this.vx * globals.dt/1000);
  this.y += Math.round(this.vy * globals.dt/1000);
  this.sx += Math.round(this.vx * globals.dt/1000);
  this.sy += Math.round(this.vy * globals.dt/1000);

  var hit = false;
  var target;

  var barrier = this.getCollisionBarrier({x: this.sx, y: this.sy});

  // Collisions with Players
  for (var pid in globals.players) {
    target = globals.players[pid];
    if (target.team === this.team)
      continue;
    if (target.getCollisionBarrier().intersects(barrier) && this.type !== Projectile.Type.BOMB) {
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
      if (target.getCollisionBarrier().intersects(barrier) && this.type !== Projectile.Type.BOMB) {
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
      if (target.getCollisionBarrier().intersects(barrier)) {
        hit = true;
        break;
      }
    }
  }

  // Collisions with Walls
  if (!hit) {
    for (var wid in globals.level.walls) {
      if (globals.level.walls[wid].intersects(barrier)) {
        hit = true;
        break;
      }
    }
  }

  // Move back if collision detected
  if (hit) {
    this.hitWall = true;
    this.x = x;
    this.y = y;
    this.sx = sx;
    this.sy = sy;
  }

  var pos = Rectangle.getPos(this.getCollisionBarrier());
  // It is not visible so no smoothing needed.
  if (!pos.draw) {
    this.x = this.sx;
    this.y = this.sy;
  } else {
    var diff;
    var dir;
    if (this.sx !== this.x) {
      diff = Math.abs(this.sx - this.x);
      dir = (this.sx - this.x) / diff;
      if (diff > 50)
        this.x = this.sx;
      else
        this.x += dir * Math.min(2, diff);
    }

    if (this.sy !== this.y) {
      diff = Math.abs(this.sy - this.y);
      dir = (this.sy - this.y) / diff;
      if (diff > 50)
        this.y = this.sy;
      else
        this.y += dir * Math.min(2, diff);
    }
  }


};

/**
 * Updates the projectile.
 * @returns {Boolean} If the projectile has exploded.
 */
Projectile.prototype.update = function() {
  this.x += Math.round(this.vx * globals.dt/1000);
  this.y += Math.round(this.vy * globals.dt/1000);

  var hit = false;
  var target;
  var proj = this;
  
  // Collisions with Players
  for (var pid in globals.players) {
    target = globals.players[pid];
    if (target.team === this.team)
      continue;
    if (target.getCollisionBarrier().intersects(this.getCollisionBarrier())) {
      if(this.type === Projectile.Type.BOMB) 
        proj = null;
      else {
        this.vx = this.vy = 0;
        hit = true;
      }
      new Explosion(this.x, this.y, this.range, globals.players[this.owner],
                    target, this.damage, proj, false);
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
        if(this.type === Projectile.Type.BOMB) 
          proj = null;
        else {
          this.vx = this.vy = 0;
          hit = true;
        }
        new Explosion(this.x, this.y, this.range, globals.players[this.owner],
                      target, this.damage, proj, false);
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
Projectile.prototype.getCollisionBarrier = function(location) {
  if (!location)
    location = this;

  if (this.type === Projectile.Type.MINE)
    return new Rectangle({left: location.x - 14, right: this.x + 14,
                          top: location.y - 14, bottom: this.y + 14});
  else if (this.type === Projectile.Type.BOMB)
    return new Rectangle({left: location.x - 30, right: this.x + 30,
                          top: location.y - 30, bottom: this.y + 30});
  else 
    return new Rectangle({left: location.x - 5, right: location.x + 5,
                          top: location.y - 5, bottom: location.y + 5});
};
