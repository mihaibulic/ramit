/**
 * A player of the IT game.
 * @param {Number} team The team number the player is on.
 * @param {Number} playerID The player's ID number.
 * @param {Object} opt_state A state object to build this object from.
 */
var Player = function(team, playerID, opt_state) {
  var x;
  var y;
  var aim;

  this.playerID = playerID;

  this.keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    mine: false,
    all_mines: false,
    space: false,
    shift: false,
    1: false,
    2: false,
    3: false,
    4: false
  };
  this.mouse = {
    left: false,
    middle: false,
    right: false
  };

  if (opt_state) {
    this.name = opt_state.n;
    this.team = opt_state.t;
    x = opt_state.x;
    y = opt_state.y;
    this.health = opt_state.h;
    this.maxHealth = opt_state.m;
    aim = opt_state.a;
    this.setKeyValue(opt_state.k);
    this.speed = opt_state.s;
    // TODO: Special weapon
    this.totalScore = opt_state.p;
    this.totalSpent = opt_state.c;
  } else {
    this.name = "Player " + playerID;
    this.team = team;
    var spawn = this.determineSpawn();
    x = Player.SPAWN_POINTS[team][spawn].x;
    y = Player.SPAWN_POINTS[team][spawn].y;
    this.maxHealth = 100;
    this.health = this.maxHealth;
    aim = 0;
    this.speed = 4;
    this.totalScore = 0;
    this.totalSpent = 0;
  }

  this.tank = {
    x: x,
    y: y,
    sx: x,
    sy: y,
    direction: 0,
    turretAim: aim
  };

  this.projectile = {};
  this.projectile[Projectile.Type.NORMAL] = {
    range: 0,
    damage: 5,
    speed: 10,
    lastFire: 0,
    coolDown: 10
  };
  this.projectile[Projectile.Type.MINE] = {
    range: 80,
    damage: 30,
    speed: 0,
    live: 0,
    allowed: 5,
    lastFire: 0,
    coolDown: 15
  };
  this.projectile[Projectile.Type.ROCKET] = {
    range: 40,
    damage: 20,
    speed: 7,
    lastFire: 0,
    coolDown: 120
  };
  this.special = {};
  this.special[Player.SpecialType.ROCKET] = this.projectile[Projectile.Type.ROCKET];//this is a hack
  this.special[Player.SpecialType.EMP] = {
    range: 60,
    damage: 30,
    lastFire: 0,
    coolDown: 5 * 60
  }
  this.special[Player.SpecialType.MEDIC] = {
    range: 80,
    damage: -30,
    lastFire: 0,
    coolDown: 5 * 60
  }
  this.special[Player.SpecialType.SHIELD] = {
    duration: 3 * 60,
    lastFire: 0,
    coolDown: 10 * 60,
  }

  this.hasShield = 0

  if (globals.diff) {
    if (!globals.diff.p)
      globals.diff.p = {};
    globals.diff.p[this.playerID] = this.getAbsoluteState();
  }
};

Player.SpecialType = { ROCKET: 1, EMP: 2, MEDIC: 3, SHEILD: 4 };

Player.prototype.getAbsoluteState = function() {
  var p = {};
  p.n = this.name;
  p.t = this.team;
  p.x = this.tank.x;
  p.y = this.tank.y;
  p.h = this.health;
  p.m = this.maxHealth;
  p.a = this.getAim();
  p.k = this.getKeyValue();
  p.s = this.speed;
  p.w = 0; // TODO: weapon
  p.d = this.hasShield;
  p.p = this.totalScore;
  p.c = this.totalSpent;
  return p;
};

/**
 * The factor in which diagonal speed is multiplied.
 */
Player.DIAGONAL_CONST = Math.sqrt(0.5);

/**
 * The color of the collision bound for each team.
 */
Player.TEAM_COLOR = ["#0000FF", "#FF0000"];

Player.TEAM_COLOR_LIGHT = ["#00AAFF", "#FFAA00"];

Player.HEALTH = ["#FF0000", "#FFFF00", "#00FF00"];

/**
 * The spawn points for each team.
 */
Player.SPAWN_POINTS = [
  [{x: 470, y: 250},{x: 470, y: 150},{x: 470, y: 350},
   {x: 570, y: 250},{x: 570, y: 150},{x: 570, y: 350},
   {x: 370, y: 250},{x: 370, y: 150},{x: 370, y: 350}],
  [{x: 470, y: 2690},{x: 470, y: 2790},{x: 470, y: 2590},
   {x: 370, y: 2690},{x: 370, y: 2790},{x: 370, y: 2590},
   {x: 570, y: 2690},{x: 570, y: 2790},{x: 570, y: 2590}]
];

/**
 * Draw's the player's information.
 * @param {Object} level An object describing the state of the level.
 */
Player.prototype.draw = function() {
  var xPos = this.tank.x - globals.level.x;
  var yPos = this.tank.y - globals.level.y;

  // Determine a numeric value for which keys are pressed and move the tank.
  keyValue = this.getKeyValue();

  // Based on which keys are pressed, determine which direction to draw the
  // Tank in.
  switch (keyValue) {
  case 1: // Up key
  case 13: // Up, Left, and Right keys
    this.tank.direction = 6;
    break;
  case 2: // Down key
  case 14: // Down, Left, and Right keys
    this.tank.direction = 2;
    break;
  case 4: // Left key
  case 7: // Left, Up, and Down keys
    this.tank.direction = 4;
    break;
  case 5: // Left and Up keys
    this.tank.direction = 5;
    break;
  case 6: // Left and Down keys
    this.tank.direction = 3;
    break;
  case 8: // Right key
  case 11: // Right, Up, and Down keys
    this.tank.direction = 0;
    break;
  case 9: // Right and Up keys
    this.tank.direction = 7;
    break;
  case 10: // Right and Down keys
    this.tank.direction = 1;
    break;
  }

  // If the tank will not be displayed on the screen, do not bother drawing it.
  if (xPos > -60 && xPos < 1000 && yPos > -60 && yPos < 500) {
    // Draw the tank.
    globals.ctx.drawImage(
      globals.resources.tanks[this.team][this.tank.direction],
      xPos, yPos);
    // Draw the turret.
    globals.ctx.drawImage(
      globals.resources.turrets[this.team][this.tank.turretAim],
      xPos - 7, yPos - 7);
    // Draw the shield.
    if (this.hasShield) {
      var grad = globals.ctx.createRadialGradient(xPos+30, yPos+30, 10, xPos+30, yPos+30, 60);
      grad.addColorStop(0, Player.TEAM_COLOR_LIGHT[this.team]);
      grad.addColorStop(1, Player.TEAM_COLOR[this.team]);
      globals.ctx.fillStyle = grad;
      globals.ctx.globalAlpha = 0.4;
      globals.ctx.beginPath();
      globals.ctx.arc(xPos + 30, yPos + 30, 35, 0, 2 * Math.PI);
      globals.ctx.closePath();
      globals.ctx.fill();
      globals.ctx.globalAlpha = 1;
    }
  }

  if (globals.queries.debug === "true") {
    globals.ctx.strokeStyle = Player.TEAM_COLOR[this.team];
    var rect = this.getCollisionBarrier();
    globals.ctx.strokeRect(rect.left - globals.level.x, rect.top - globals.level.y, rect.width(),
                           rect.height());
  }
};

/**
 * Draws a tanks information, such as it's health and name.
 */
Player.prototype.drawDetails = function() {
  var xPos = this.tank.x - globals.level.x;
  var yPos = this.tank.y - globals.level.y;
  if (xPos > -60 && xPos < 1000 && yPos > -60 && yPos < 500) {
    // health bar
    globals.ctx.strokeStyle = "#00FF00";
    var color = Math.floor(this.health / this.maxHealth * Player.HEALTH.length);
    if (color == Player.HEALTH.length) color--;
    globals.ctx.fillStyle = Player.HEALTH[color];
    globals.ctx.globalAlpha = 0.5;
    globals.ctx.strokeRect(xPos + 10, yPos + 2, 40, 3);
    globals.ctx.fillRect(xPos + 10, yPos + 2, 40 * this.health / this.maxHealth, 3);
    globals.ctx.globalAlpha = 1;

    //name
    globals.ctx.fillStyle = "#FFFFFF";
    globals.ctx.font = "10px sans-serif";
    globals.ctx.fillText(this.name, xPos + 10, yPos + 1);
  }
};

/**
 * Draws the HUD, including HP, score, and the minimap.
 */
Player.prototype.drawHUD = function() {
  // Health Bar
  var color = Math.floor(this.health / this.maxHealth * Player.HEALTH.length);
  if (color == Player.HEALTH.length) color--;
  globals.ctx.fillStyle = Player.HEALTH[color];
  globals.ctx.strokeStyle = Player.HEALTH[color];
  globals.ctx.globalAlpha = 0.75;
  globals.ctx.strokeRect(20, 20, 200, 20);
  globals.ctx.fillRect(20, 20, 200 * this.health / this.maxHealth, 20);
  globals.ctx.globalAlpha = 1;

  // Draw Score
  globals.ctx.fillStyle = "#ffffff";
  globals.ctx.textAlign = "right";
  globals.ctx.font = "24px serif";
  globals.ctx.fillText("$" + (this.totalScore - this.totalSpent), 980, 35);
  globals.ctx.textAlign = "left";

  // Minimap
  globals.ctx.drawImage(globals.resources.minimap, 830, 330);

  var x;
  var y;
  var other;
  for (var id in globals.players) {
    other = globals.players[id];
    if (this.team === other.team || this.getCenterDistance(other) < 650) {
      x = 830 + ((other.tank.x + 30) * 0.05);
      y = 330 + ((other.tank.y + 30) * 0.05);
      if (other.team)
        globals.ctx.fillStyle = Player.TEAM_COLOR[other.team];
      else
        globals.ctx.fillStyle = Player.TEAM_COLOR_LIGHT[other.team];
      globals.ctx.beginPath();
      globals.ctx.arc(x, y, 2, 0, 2 * Math.PI);
      globals.ctx.closePath();
      globals.ctx.fill();
    }
  }

  x = 150 - ((this.tank.x + 30) * 0.05);
  y = 150 - ((this.tank.y + 30) * 0.05);
  globals.ctx.drawImage(globals.resources.minimapfade, x, y, 150, 150, 830, 330, 150, 150);
};

/**
 * Updates the player's turret's aim.
 * @param {Event} e The mouse event triggering the call.
 */
Player.prototype.updateAim = function(e) {
  var canvasPos = globals.canvas.getBoundingClientRect();
  var centerPoint = {x: canvasPos.left + 500, y: canvasPos.top + 250};
  var r = Math.atan2(e.clientY - centerPoint.y, e.clientX - centerPoint.x) * 180 / Math.PI;
  if (r < 0)
    r += 360;
  //this.tank.turretAim = Math.floor(r / 2);
  globals.socket.emit('aim', {a: Math.floor(r/2)});
};

Player.prototype.updateMouse = function(e) {
  var diff = {};
  var value = e.type === "mousedown";

  if (!e.which && e.button)
  {
    if (e.button & 1) e.which = 1;      // Left
    else if (e.button & 4) e.which = 2; // Middle
    else if (e.button & 2) e.which = 3; // Right
  }

  switch (e.which)
  {
  case 1: // left
    diff.l = value;
    break;
  case 2: // middle
    diff.m = value;
    break;
  case 3: // right
    diff.r = value;
    break;
  }
  globals.socket.emit('mouse', diff);
};

/**
 * Update the player's pressed keys.
 * @param {Event} e The key event triggering the call.
 */
Player.prototype.updateKeys = function(e) {
  var diff = {};
  var value = !!(e.type === "keydown");
  switch (e.keyCode) {
  case 87: // W
    if ((!!this.keys.up) !== value)
      diff.u = value;
    this.keys.up = value;
    break;
  case 65: // A
    if ((!!this.keys.left) !== value)
      diff.l = value;
    this.keys.left = value;
    break;
  case 83: // S
    if ((!!this.keys.down) !== value)
      diff.d = value;
    this.keys.down = value;
    break;
  case 68: // D
    if ((!!this.keys.right) !== value)
      diff.r = value;
    this.keys.right = value;
    break;
  case 32: // Space
    if ((!!this.keys.space) !== value)
      diff.s = value;
    this.keys.space = value;
    break;
  case 69: //e
    if ((!!this.keys.mine) !== value)
      diff.e = value;
    this.keys.mine = value;
    break;
  case 81: // q
    if((!!this.keys.all_mines) !== value)
      diff.q = value;
    this.keys.all_mines = value;
    break;
  }

  if (!globals.isObjectEmpty(diff))
    globals.socket.emit('key', diff);
};

/**
 * Update the state of the Player.
 */
Player.prototype.update = function() {
  this.move();
  this.projectile[Projectile.Type.NORMAL].lastFire++;
  this.projectile[Projectile.Type.MINE].lastFire++;
  this.projectile[Projectile.Type.ROCKET].lastFire++;
  this.special[Player.SpecialType.SHIELD].lastFire++;

  if (this.hasShield) {
    this.hasShield--;
    if (globals.diff && !this.hasShield) {
      if (!globals.diff.p)
        globals.diff.p = {};
      if (!globals.diff.p[this.playerID])
        globals.diff.p[this.playerID] = {};
      globals.diff.p[this.playerID].d = 0;
    }
  }
};

/**
 * Move the tank.
 */
Player.prototype.move = function() {
  var speed = (this.tank.direction % 2 === 0) ? this.speed : Player.DIAGONAL_CONST * this.speed;
  var x = this.tank.x;
  var y = this.tank.y;
  // Which direction left/right, up/down is the tank moving in.
  var xDir = 1;
  var yDir = 1;

  // Determine the end location based on the keys.
  if (this.keys.up) {
    y -= speed;
    yDir = -1;
  }
  if (this.keys.down) {
    y += speed;
    yDir = 1;
  }
  if (this.keys.left) {
    x -= speed;
    xDir = -1;
  }
  if (this.keys.right) {
    x += speed;
    xDir = 1;
  }
  x = Math.round(x);
  y = Math.round(y);

  // The collision box of the tank.
  var tankBox = this.getCollisionBarrier();
  //The collision box after the tank moves in the Y direction.
  var rectYMovement = this.getCollisionBarrier({x: this.tank.x, y: y});
  //The collision box after the tank moves in the X direction.
  var rectXMovement = this.getCollisionBarrier({x: x, y: this.tank.y});
  var distance;

  //check walls
  for (var i in globals.level.walls) {
    if (rectYMovement.intersects(globals.level.walls[i])) {
      // Moving up/down collided with a wall, move up to the wall but no
      // farther.
      distance = tankBox.getYDistance(globals.level.walls[i]);
      y = this.tank.y + ((distance - 1) * yDir);
    }
    if (rectXMovement.intersects(globals.level.walls[i])) {
      // Moving left/right collided with a wall, move up to the wall but no
      // farther.
      distance = tankBox.getXDistance(globals.level.walls[i]);
      x = this.tank.x + ((distance - 1) * xDir);
    }
  }

  // check gates
  for (var g in globals.level.gates) {
    // ignore own team's gate
    if (globals.level.gates[g].team !== this.team) {
      var box = globals.level.gates[g].getCollisionBarrier();
      if (rectYMovement.intersects(box)) {
        // Moving up/down collided with a gate, move up to the gate but no
        // farther.
        distance = tankBox.getYDistance(box);
        y = this.tank.y + ((distance - 1) * yDir);
      }
      if (rectXMovement.intersects(box)) {
        // Moving left/right collided with a gate, move up to the gate but no
        // farther.
        distance = tankBox.getXDistance(box);
        x = this.tank.x + ((distance - 1) * xDir);
      }
    }
  }

  // check other tanks
  var barrier;
  for (var p in globals.players) {
    if (globals.players[p] === this) // Do not collide with myself
      continue;
    barrier =    globals.players[p].getCollisionBarrier();
    if (rectYMovement.intersects(barrier)) {
      // Moving up/down collided with a wall, move up to the wall but no
      // farther.
      distance = tankBox.getYDistance(barrier);
      y = this.tank.y + ((distance - 1) * yDir);
    }
    if (rectXMovement.intersects(barrier)) {
      // Moving left/right collided with a wall, move up to the wall but no
      // farther.
      distance = tankBox.getXDistance(barrier);
      x = this.tank.x + ((distance - 1) * xDir);
    }
  }

  // Update the diff for this player.
  if (globals.diff) {
    var diff = {};
    if (this.tank.x !== x)
      diff.x = x;
    if (this.tank.y !== y)
      diff.y = y;

    if (!globals.isObjectEmpty(diff)) {
      if (!globals.diff.p)
        globals.diff.p = {};
      if (!globals.diff.p[this.playerID])
        globals.diff.p[this.playerID] = {};

      if (diff.x)
        globals.diff.p[this.playerID].x = diff.x;
      if (diff.y)
        globals.diff.p[this.playerID].y = diff.y;
    }
  }

  this.tank.x = x;
  this.tank.y = y;
};

/**
 * @returns {Number} The direction the turret is aiming.
 */
Player.prototype.getAim = function() {
  return this.tank.turretAim;
};

/**
 * @param aim {Number} The direction the turret is aiming.
 */
Player.prototype.setAim = function(aim) {
  this.tank.turretAim = aim;
};

Player.prototype.canFire = function(type) {
  return this.projectile[type].lastFire >= this.projectile[type].coolDown;
};

/**
 * Causes damage to tank. Kills tank if dead (returns to spawn point)
 * @param damage {Number} The amount of damage the player has taken.
 * @param ownerTeam {Number} For point tracking negative for wrong team.
 * @returns {Number} The number of points the hit earned.
 */
Player.prototype.takeHit = function(damage, ownerTeam) {
  if (this.hasShield)
    return 0;

  this.health -= damage;
  var points = damage;

  if (this.health <= 0) {
    var spawn = this.determineSpawn();
    this.tank.x = Player.SPAWN_POINTS[this.team][spawn].x;
    this.tank.y = Player.SPAWN_POINTS[this.team][spawn].y;
    this.health = this.maxHealth;
    points += 25;

    if (globals.diff) {
      if (!globals.diff.p)
        globals.diff.p = {};
      if (!globals.diff.p[this.playerID])
        globals.diff.p[this.playerID] = {};

      globals.diff.p[this.playerID].x = this.tank.x;
      globals.diff.p[this.playerID].y = this.tank.y;
    }
  }

  if (globals.diff) {
    if (!globals.diff.p)
      globals.diff.p = {};
    if (!globals.diff.p[this.playerID])
      globals.diff.p[this.playerID] = {};

    globals.diff.p[this.playerID].h = this.health;
  }

  if (ownerTeam === this.team) {
    console.log("FRIENDLY FIRE!");
    points *= -1;
  }
  return points;
};

/**
 * Adds points to the player's score.
 * @param {Number} amount The amount of points earned.
 */
Player.prototype.addPoints = function(amount) {
  this.totalScore += amount;
  if (this.totalScore < this.totalSpent)
    this.totalScore = this.totalSpent;

  if (globals.diff) {
    if (!globals.diff.p)
      globals.diff.p = {};
    if (!globals.diff.p[this.playerID])
      globals.diff.p[this.playerID] = {};

    globals.diff.p[this.playerID].p = this.totalScore;
  }
};

Player.prototype.armShield = function() {
  this.hasShield = this.special[Player.SpecialType.SHIELD].duration;
  if (globals.diff) {
    if (!globals.diff.p)
      globals.diff.p = {};
    if (!globals.diff.p[this.playerID])
      globals.diff.p[this.playerID] = {};

    globals.diff.p[this.playerID].d = this.hasShield;
  }
};

/**
 * Returns a rectangle representing the collidable area for the provided
 * location. If no location is provided, it will use the location of the tank
 * by default.
 * @param {Object} location An object that holds the location of the tank.
 * @param {Boolean} useShield Return the barrier of the shield if there is one.
 * @returns {Rectangle} A rectangle of the collidable area of the tank.
 */
Player.prototype.getCollisionBarrier = function(location, useShield) {
  if (!location)
    location = this.tank;

  if (useShield && this.hasShield) {
    return new Rectangle({left: location.x + 5, right: location.x + 55,
                          top: location.y + 5, bottom: location.y + 55});
  }

  return new Rectangle({left: location.x + 10, right: location.x + 50,
                        top: location.y + 10, bottom: location.y + 50});
};

/**
 * @returns {Number} A numeric value representing the keys pressed by the
 *               player.
 */
Player.prototype.getKeyValue = function() {
  var keyValue = 0;
  if (this.keys.up)
    keyValue += 1;
  if (this.keys.down)
    keyValue += 2;
  if (this.keys.left)
    keyValue += 4;
  if (this.keys.right)
    keyValue += 8;
  return keyValue;
};

Player.prototype.setKeyValue = function(keyValue) {
  this.keys.up = (keyValue & 1);
  this.keys.down = (keyValue & 2);
  this.keys.left = (keyValue & 4);
  this.keys.right = (keyValue & 8);
};

Player.prototype.getCenterDistance = function(object) {
  if (object instanceof Player)
    return Math.sqrt((this.tank.x - object.tank.x) * (this.tank.x - object.tank.x) +
                     (this.tank.y - object.tank.y) * (this.tank.y - object.tank.y));
  if (object instanceof Explosion)
    return Math.sqrt((this.tank.x + 30 - object.x) * (this.tank.x + 30 - object.x) +
                     (this.tank.y + 30 - object.y) * (this.tank.y + 30 - object.y));
  return 0;
};

Player.prototype.determineSpawn = function() {
  var spawn;
  var finished = false;
  var tank;
  var spawn_coords;
  var rect;
  for (spawn = 0; spawn < 9 && !finished; spawn++) {
    finished = true;
    spawn_coords = Player.SPAWN_POINTS[this.team][spawn];
    // Determine the rectangle for the spawn point.
    rect = new Rectangle({top: spawn_coords.y, bottom: spawn_coords.y + 40,
                          left: spawn_coords.x, right: spawn_coords.x + 40});
    for (var id in globals.players) {
      tank = globals.players[id];
      if (tank === this) // Don't compare me to myself.
        continue;
      // If the tank is on the spawn point, move to the next one.
      if (tank.getCollisionBarrier().intersects(rect)) {
        finished = false;
        break;
      }
    }
  }
  // Exiting the for loop incremented it by one.
  return --spawn;
};
