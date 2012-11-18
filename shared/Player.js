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
  this.leaving = false;

  this.keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    mine: false,
    all_mines: false,
    space: false,
    shift: false,
    mounted: 1,
    u: false
  };
  this.sentKeys = {
    up: false,
    down: false,
    left: false,
    right: false,
    mine: false,
    all_mines: false,
    space: false,
    shift: false,
    mounted: 1,
    u: false
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
    this.deathCounter = 0;
    this.health = opt_state.h;
    this.maxHealth = opt_state.m;
    aim = opt_state.a;
    this.setKeyValue(opt_state.k);
    this.speed = opt_state.s;
    this.mounted = opt_state.w;
    this.hasShield = opt_state.d;
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
    this.speed = 4 * 60;
    this.mounted = Player.SpecialType.ROCKET;
    this.hasShield = 0;
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

  this.projectile = [];
  this.projectile[Projectile.Type.NORMAL] = {
    range: 0,
    damage: 5,
    speed: 8 * 60,
    lastFire: 20,
    coolDown: 20
  };
  this.projectile[Projectile.Type.MINE] = {
    range: 80,
    damage: 30,
    speed: 0,
    live: 0,
    allowed: 1,
    lastFire: 15,
    coolDown: 15
  };
  this.projectile[Projectile.Type.ROCKET] = {
    range: 40,
    damage: 20,
    speed: 9 * 60,
    lastFire: 120,
    coolDown: 120
  };
  this.projectile[Projectile.Type.BOMB] = {
    range: 200,
    damage: 5000,
    speed: 60,
    fired: false,
    lastFire: 1,
    coolDown: 0, 
    allowed: 0 // should be 0, 1 for testing
  };

  this.special = [];
  this.special[Player.SpecialType.ROCKET] = this.projectile[Projectile.Type.ROCKET];
  this.special[Player.SpecialType.BOMB] = this.projectile[Projectile.Type.BOMB];
  this.special[Player.SpecialType.EMP] = {
    range: 60,
    damage: 30,
    lastFire: 5 * 60,
    coolDown: 5 * 60
  };
  this.special[Player.SpecialType.MEDIC] = {
    range: 80,
    damage: -30,
    lastFire: 5 * 60,
    coolDown: 5 * 60
  };
  this.special[Player.SpecialType.SHIELD] = {
    duration: 5 * 60,
    lastFire: 6 * 60,
    coolDown: 5 * 60
  };

  if (globals.diff) {
    var diff = globals.getImmediateDiff();
    if (!diff.p)
      diff.p = {};
    diff.p[this.playerID] = this.getAbsoluteState();
  }
};

Player.SpecialType = { ROCKET: 1, EMP: 2, MEDIC: 3, SHIELD: 4 , BOMB:5};

Player.prototype.getAbsoluteState = function() {
  var p = {};
  p.n = this.name;
  p.t = this.team;
  p.x = this.tank.sx;
  p.y = this.tank.sy;
  p.h = this.health;
  p.m = this.maxHealth;
  p.a = this.getAim();
  p.k = this.getKeyValue();
  p.s = this.speed;
  p.w = this.mounted;
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
    if (this.leaving) globals.ctx.globalAlpha = 0.5;
    // Draw the tank.
    globals.ctx.drawImage(
      globals.resources.tanks[(this.health > 0 ? this.team : 2)][this.tank.direction],
      xPos, yPos);
    // Draw the turret.
    globals.ctx.drawImage(
      globals.resources.turrets[(this.health > 0 ? this.team : 2)][this.tank.turretAim],
      xPos - 7, yPos - 7);
    if (this.leaving) {
      globals.ctx.globalAlpha = 1;
      return;
    }
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

    if (this.hasShield) {
      rect = this.getCollisionBarrier(null, true);
      globals.ctx.strokeRect(rect.left - globals.level.x, rect.top - globals.level.y, rect.width(),
                             rect.height());

    }
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
    if (color === Player.HEALTH.length) color--;
    globals.ctx.fillStyle = Player.HEALTH[color];
    globals.ctx.strokeStyle = Player.HEALTH[color];
    globals.ctx.globalAlpha = 0.5;
    drawRoundRect(globals.ctx, xPos + 10, yPos + 2, 40, 3, 1);
    globals.ctx.stroke();
    drawRoundRect(globals.ctx, xPos + 10, yPos + 2, 40 * this.health / this.maxHealth, 3, 1);
    globals.ctx.fill();
    globals.ctx.globalAlpha = 1;

    //name
    globals.ctx.fillStyle = "#FFFFFF";
    globals.ctx.font = "10px sans-serif";
    globals.ctx.fillText(this.name, xPos + 10, yPos + 1);
  }
};

/**
 * Draws the HUD, including HP, score, event messages and the minimap.
 */
Player.prototype.drawHUD = function() {
  // Health Bar
  var color = Math.floor(this.health / this.maxHealth * Player.HEALTH.length);
  if (color === Player.HEALTH.length) color--;
  globals.ctx.textAlign = "left";
  globals.ctx.fillStyle = "#ffffff";
  globals.ctx.font = "24px sans-serif";
  globals.ctx.fillText("hp", 20, 40);
  globals.ctx.fillStyle = Player.HEALTH[color];
  globals.ctx.strokeStyle = Player.HEALTH[color];
  globals.ctx.globalAlpha = 0.75;
  drawRoundRect(globals.ctx, 55, 20, 300, 20, 10);
  globals.ctx.stroke();
  drawRoundRect(globals.ctx, 55, 20, 300 * this.health / this.maxHealth, 20, 10);
  globals.ctx.fill();
  globals.ctx.globalAlpha = 1;

  // Special weapons + cooldowns
  globals.ctx.globalAlpha = 0.75;
  globals.ctx.fillStyle = "#8a8a8a";
  drawRoundRect(globals.ctx, 15 + 40*(this.mounted), 45, 40, 40);
  globals.ctx.fillStyle = Player.TEAM_COLOR[this.team]; 

  for (var s in this.special) {
    globals.ctx.fillRect(20 + 40*(s), 50, 30, 30);
    
    // if this weapon is not allowed, draw a grayed out box on top of it
    if (this.special[s].allowed <= 0) {
      globals.ctx.fillStyle = "#8a8a8a"; 
      globals.ctx.fillRect(20 + 40*(s), 50, 30, 30);
      globals.ctx.fillStyle = Player.TEAM_COLOR[this.team]; 
    }
  }
  globals.ctx.globalAlpha = 1;

  // Draw Name and Score
  globals.ctx.textAlign = "right";
  globals.ctx.fillStyle = "#ffffff";
  globals.ctx.font = "24px serif";
  globals.ctx.fillText(this.name + ": $" + (this.totalScore - this.totalSpent), 980, 35);
  globals.ctx.textAlign = "left";

  // Event messages
  globals.ctx.textAlign = "center";
  globals.ctx.font = "24px sans-serif";
  if (globals.messages.length > 0) {
    if (globals.messageCounter > 0) {
      for (var m in globals.messages) {
        globals.ctx.fillText(globals.messages[m], 500, 450);
        globals.messageCounter--;
        if (globals.messageCounter === 0) {
          delete globals.messages[m];
          globals.messageCounter = 120;
        }
        break;
      }
    }
  }
  globals.ctx.textAlign = "left";

  // Minimap
  globals.ctx.drawImage(globals.resources.minimap, 830, 330);

  // draws gates on minimap
  for (var g in globals.level.gates) {
    var gate = globals.level.gates[g];
    if (gate.health > 0) {
      x = 830 + ((gate.left + 30) * 0.05);
      y = 330 + ((gate.top + 30) * 0.05);

      globals.ctx.fillStyle = Player.TEAM_COLOR[gate.team];
      globals.ctx.fillRect(x, y-2, 12, 3);
    }
  }

  // draws hqs on minimap
  for (var h in globals.level.hqs) {
    var hq = globals.level.hqs[h];
    if (hq.health > 0) {
      x = 830 + ((hq.left + 30) * 0.05);
      y = 330 + ((hq.top + 30) * 0.05);

      globals.ctx.strokeStyle = Player.TEAM_COLOR[hq.team];
      globals.ctx.lineWidth = 2;
      globals.ctx.beginPath();
      globals.ctx.arc(x, y, 3, 0, 2 * Math.PI);
      globals.ctx.closePath();
      globals.ctx.stroke();
    }
  }

  // draws players on minimap
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
  if (this.health <= 0) return;

  var canvasPos = globals.canvas.getBoundingClientRect();
  var centerPoint = {x: canvasPos.left + 500, y: canvasPos.top + 250};
  var r = Math.atan2(e.clientY - centerPoint.y, e.clientX - centerPoint.x) * 180 / Math.PI;
  if (r < 0)
    r += 360;
  var aim = Math.floor(r / 2);
  if (this.tank.turretAim !== aim)
    globals.socket.emit('aim', {a: aim});
  this.tank.turretAim = aim;
};

Player.prototype.updateMouse = function(e) {
  if (this.health <= 0) return;

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
    var canvasPos = globals.canvas.getBoundingClientRect();
    var x = e.clientX - canvasPos.left;
    var y = e.clientY - canvasPos.top;

    // mouse is in weapons area, so click should be used to mount another weapon rather than aim
    if (x > 20 && x < (20+40*this.special.length) && y > 50 && y < 80) { 
      this.keys.mounted = this.mounted = diff.m = Math.floor((x - 20)/40);
      globals.socket.emit('key', diff);
      return;
    }
    
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
  if (this.health <= 0) return;

  var diff = {};
  var value = Boolean(e.type === "keydown");
  var mounting = false;
  switch (e.keyCode) {
  case 87: // W
    if (Boolean(this.sentKeys.up) !== value) {
      diff.u = value;
      this.sentKeys.up = value;
      if (!value)
        this.keys.up = false;
    }
    break;
  case 65: // A
    if (Boolean(this.sentKeys.left) !== value) {
      diff.l = value;
      this.sentKeys.left = value;
      if (!value)
        this.keys.left = value;
    }
    break;
  case 83: // S
    if (Boolean(this.sentKeys.down) !== value) {
      diff.d = value;
      this.sentKeys.down = value;
      if (!value)
        this.keys.down = value;
    }
    break;
  case 68: // D
    if (Boolean(this.sentKeys.right) !== value) {
      diff.r = value;
      this.sentKeys.right = value;
      if (!value)
        this.keys.right = value;
    }
    break;
  case 32: // Space
    if (Boolean(this.keys.space) !== value) {
      diff.s = value;
      this.keys.space = value;
    }
    break;
  case 69: //e
    if (Boolean(this.keys.mine) !== value) {
      diff.e = value;
      this.keys.mine = value;
    }
    break;
  case 81: // q
    if(Boolean(this.keys.all_mines) !== value) {
      diff.q = value;
      this.keys.all_mines = value;
    }
    break;
  case 16: //shift fire_special
    if (Boolean(this.keys.shift) !== value) {
      diff.w = value;
      this.keys.shift = value;
    }
    break;
  case 49: //1
  case 50: //2
  case 51: //3
  case 52: //4
  case 53: //5
    if(value) 
      this.mounted = this.keys.mounted = diff.m = e.keyCode - 48;
    break;
  case 85:
    if (value && !this.keys.u) {
      globals.socket.emit('upgrade', { d: Upgrade.Device.MINE,
                                       t: Upgrade.Type.ALLOWED });
      this.keys.u = true;
      console.log("requesting upgrade");
    } else if (!value) {
      this.keys.u = false;
    }
    break;
  }
  if (!globals.isObjectEmpty(diff)) {
    globals.socket.emit('key', diff);
  }
};

/**
 * Load the state from the server message.
 * @param {Object} state message of player
 * @param {Number} player id of local player
 */
Player.prototype.loadState = function(data, you) {
  var oldHealth = this.health;

  var moveData = false;
  if (data) { //merge with server
    if (data.n !== undefined)
      this.name = data.n;
    if (data.t !== undefined)
      this.team = data.t;
    if (data.h !== undefined) {
      if (this.health !== data.h && data.h === 0) {
        var deadName = (this.playerID != you ? this.name : "you");
        var killer = globals.players[data.b];
        if (killer === undefined)
          globals.messages.push(deadName + " died.");
        else {
          killerName = (you === data.b ? "You" : killer.name);
          if (killer.playerID === this.playerID)
            globals.messages.push(killerName + " committed suicide!");
          else if (killer.team === this.team)
            globals.messages.push(killerName + " betrayed " + deadName + "!");
          else
            globals.messages.push(killerName + " killed " + deadName + ".");
        }
      }
      this.health = data.h;
    }
    if (data.m !== undefined)
      this.maxHealth = data.m;
    if (data.a !== undefined && this.playerID != you)
      this.setAim(data.a);
    if (data.k !== undefined)
      this.setKeyValue(data.k);
    if (data.s !== undefined)
      this.speed = data.s;
    if (data.w !== undefined)
      this.mounted = data.w;
    if (data.d !== undefined)
      this.hasShield = data.d;
    if (data.p !== undefined)
      this.totalScore = data.p;
    if (data.c !== undefined) {
       if (this.totalSpent !== data.c)
          console.log(this.name + " bought an upgrade");
      this.totalSpent = data.c;
    }
    if (data.x !== undefined) {
      this.tank.sx = data.x;
      if (oldHealth === 0 && this.health !== 0)
        this.tank.x = data.x;
    }
    if (data.y !== undefined) {
      this.tank.sy = data.y;
      if (oldHealth === 0 && this.health !== 0)
        this.tank.y = data.y;
    }
  }
};

Player.prototype.predict = function() {
  // Do nothing if dead.
  if (this.health === 0)
    return;

  var pos = Rectangle.getPos(this.getCollisionBarrier());

  this.move();

  // If player is offscreen, no smooth merge needed
  if (!pos.draw) {
    this.tank.x = this.tank.sx;
    this.tank.y = this.tank.sy;
  } else {
    var diff;
    var dir;
    if (this.tank.sx !== this.tank.x) {
      diff = Math.abs(this.tank.sx - this.tank.x);
      dir = (this.tank.sx - this.tank.x) / diff;
      if (diff > 50)
        this.tank.x = this.tank.sx;
      else
        this.tank.x += dir * Math.min(2, diff);
    }

    if (this.tank.sy !== this.tank.y) {
      diff = Math.abs(this.tank.sy - this.tank.y);
      dir = (this.tank.sy - this.tank.y) / diff;
      if (diff > 50)
        this.tank.y = this.tank.sy;
      else
        this.tank.y += dir * Math.min(2, diff);
    }
  }

  if (this.hasShield)
    this.hasShield = Math.max(0, this.hasShield - globals.dt);
};

/**
 * Update the state of the Player.
 */
Player.prototype.update = function() {
  if (this.deathCounter > 0) {
    this.deathCounter++;
    if(this.deathCounter >= 120 && !this.leaving) {
      this.respawn();
    }
  }
  else {
    this.move();
    this.projectile[Projectile.Type.NORMAL].lastFire++;
    this.projectile[Projectile.Type.MINE].lastFire++;
    this.special[Player.SpecialType.ROCKET].lastFire++;
    this.special[Player.SpecialType.EMP].lastFire++;
    this.special[Player.SpecialType.MEDIC].lastFire++;
    if (this.hasShield === 0)
      this.special[Player.SpecialType.SHIELD].lastFire++;
  }
  if (this.hasShield) {
    this.hasShield--;
  }
};

/**
 * Move the tank.
 */
Player.prototype.move = function() {
  var speed = Math.round(this.speed * globals.dt / 1000);
  speed = (this.tank.direction % 2 === 0) ? speed : Player.DIAGONAL_CONST * speed;

  var x = this.tank.sx;
  var y = this.tank.sy;
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
  var tankBox = this.getCollisionBarrier({x: this.tank.sx, y: this.tank.sy});
  //The collision box after the tank moves in the Y direction.
  var rectYMovement = this.getCollisionBarrier({x: this.tank.sx, y: y});
  //The collision box after the tank moves in the X direction.
  var rectXMovement = this.getCollisionBarrier({x: x, y: this.tank.sy});
  var distance;

  //check walls
  for (var i in globals.level.walls) {
    if (rectYMovement.intersects(globals.level.walls[i])) {
      // Moving up/down collided with a wall, move up to the wall but no
      // farther.
      distance = tankBox.getYDistance(globals.level.walls[i]);
      y = this.tank.sy + ((distance - 1) * yDir);
    }
    if (rectXMovement.intersects(globals.level.walls[i])) {
      // Moving left/right collided with a wall, move up to the wall but no
      // farther.
      distance = tankBox.getXDistance(globals.level.walls[i]);
      x = this.tank.sx + ((distance - 1) * xDir);
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
        y = this.tank.sy + ((distance - 1) * yDir);
      }
      if (rectXMovement.intersects(box)) {
        // Moving left/right collided with a gate, move up to the gate but no
        // farther.
        distance = tankBox.getXDistance(box);
        x = this.tank.sx + ((distance - 1) * xDir);
      }
    }
  }

  // check HQs
  for (var h in globals.level.hqs) {
    var hqBox = globals.level.hqs[h].getCollisionBarrier();
    if (rectYMovement.intersects(hqBox)) {
      // Moving up/down collided with a hq, move up to the gate but no
      // farther.
      distance = tankBox.getYDistance(hqBox);
      y = this.tank.sy + ((distance - 1) * yDir);
    }
    if (rectXMovement.intersects(hqBox)) {
      // Moving left/right collided with an hq, move up to the hq but no
      // farther.
      distance = tankBox.getXDistance(hqBox);
      x = this.tank.sx + ((distance - 1) * xDir);
    }
  }

  // check other tanks
  var barrier;
  for (var p in globals.players) {
    if (globals.players[p] === this) // Do not collide with myself
      continue;
    barrier = globals.players[p].getCollisionBarrier();
    if (rectYMovement.intersects(barrier)) {
      // Moving up/down collided with a tank, move up to the tank but no
      // farther.
      distance = tankBox.getYDistance(barrier);
      y = this.tank.sy + ((distance - 1) * yDir);
    }
    if (rectXMovement.intersects(barrier)) {
      // Moving left/right collided with a tank, move up to the tank but no
      // farther.
      distance = tankBox.getXDistance(barrier);
      x = this.tank.sx + ((distance - 1) * xDir);
    }
  }

  // Update the diff for this player.
  if (globals.diff) {
    var diff = {};
    if (this.tank.sx !== x)
      diff.x = x;
    if (this.tank.sy !== y)
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

  var xDiff = x - this.tank.sx;
  var yDiff = y - this.tank.sy;
  this.tank.sx = x;
  this.tank.sy = y;
  this.tank.x += xDiff;
  this.tank.y += yDiff;
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
 * @param owner {Player} For point tracking negative for wrong team.
 * @returns {Number} The number of points the hit earned.
 */
Player.prototype.takeHit = function(damage, owner) {
  if (this.hasShield || this.health === 0)
    return 0;

  var points = 0;
  if (damage > 0)
    points += Math.min(damage, this.health); // no overkill points
  this.health -= damage;

  if (this.health >= this.maxHealth)
    this.health = this.maxHealth;

  if (this.health <= 0) {
    this.health = 0;
    this.deathCounter = 1;
    points += 25;
  }

  if (globals.diff) {
    var diff = globals.getImmediateDiff();
    if (!diff.p)
      diff.p = {};
    if (!diff.p[this.playerID])
      diff.p[this.playerID] = {};

    diff.p[this.playerID].h = this.health;
    if (this.health === 0) {
      diff.p[this.playerID].b = owner.playerID;
      console.log(owner.playerID + " has killed " + this.name);
    }
  }

  if (owner.team === this.team) {
    points *= -1;
  }
  return points;
};

Player.prototype.respawn = function() {
  console.log("Respawning " + this.name);
  this.deathCounter = 0;

  this.projectile[Projectile.Type.NORMAL].lastFire = this.projectile[Projectile.Type.NORMAL].coolDown;
  this.projectile[Projectile.Type.MINE].lastFire = this.projectile[Projectile.Type.MINE].coolDown;
  this.special[Player.SpecialType.ROCKET].lastFire = this.special[Player.SpecialType.ROCKET].coolDown;
  this.special[Player.SpecialType.EMP].lastFire = this.special[Player.SpecialType.EMP].coolDown;
  this.special[Player.SpecialType.MEDIC].lastFire = this.special[Player.SpecialType.MEDIC].coolDown;
  this.special[Player.SpecialType.SHIELD].lastFire = this.special[Player.SpecialType.SHIELD].coolDown;
  this.hasShield = 0;

  var spawn = this.determineSpawn();
  this.tank.x = Player.SPAWN_POINTS[this.team][spawn].x;
  this.tank.y = Player.SPAWN_POINTS[this.team][spawn].y;
  this.tank.sx = Player.SPAWN_POINTS[this.team][spawn].x;
  this.tank.sy = Player.SPAWN_POINTS[this.team][spawn].y;
  this.health = this.maxHealth;

  this.keys = {up:0, down:0, left:0, right:0, mine:0, all_mines:0, space:0, shift:0};
  this.mouse = {left:0, middle:0, right:0};

  if (globals.diff) {
    if (!globals.diff.p)
      globals.diff.p = {};
    if (!globals.diff.p[this.playerID])
      globals.diff.p[this.playerID] = {};

    globals.diff.p[this.playerID].x = this.tank.x;
    globals.diff.p[this.playerID].y = this.tank.y;
    globals.diff.p[this.playerID].h = this.health;
  }
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
  this.special[Player.SpecialType.SHIELD].lastFire = 0;
  if (globals.diff) {
    var diff = globals.getImmediateDiff();
    if (!diff.p)
      diff.p = {};
    if (!diff.p[this.playerID])
      diff.p[this.playerID] = {};

    diff.p[this.playerID].d = Math.round(this.hasShield * globals.dt);
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
    return new Rectangle({left: location.x + 2, right: location.x + 58,
                          top: location.y + 2, bottom: location.y + 58});
  }
  else if( this.health > 0) {
    return new Rectangle({left: location.x + 10, right: location.x + 50,
                          top: location.y + 10, bottom: location.y + 50});
  }
  else { 
    // if you're dead, do not collide with anything
    return new Rectangle({left: -100, right: -100, top: -100, bottom: -100});
  }
};

/**
 * @returns {Number} A numeric value representing the keys preressed by the
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
