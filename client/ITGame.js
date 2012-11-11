/**
 * The Interactive Tanks game.
 */
var ITGame = function(team, playerID) {
  globals.socket = io.connect('ws://www.misquares.com');
  globals.socket.on('setup', globals.bind(function(data) {

    globals.socket.on('state', globals.bind(function(data) {
      this.loadState(data);
    }, this));

    globals.socket.on('leave', function(data) {
      delete globals.players[data.i];
      // Remove all projectiles and mines owned by this player.
      for (var qid in globals.projectiles) {
        if (globals.projectiles[qid].owner === data.i) {
          delete globals.projectiles[qid];
          delete globals.mines[qid];
        }
      }
    });

    this.loadState(data.s);
    this.player = data.i;
    this.team = globals.players[this.player].team;

    // Input events.
    var keyEvent = globals.bind(function(e) {
      if (!e)
        e = window.event;
      globals.players[this.player].updateKeys(e);
    }, this);

    var mouseEvent = globals.bind(function(e) {
      if(!e)
        e = window.event;
      globals.players[this.player].updateMouse(e);
    }, this);

    var mouseMove = globals.bind(function(e) {
      if (!e)
        e = window.event;
      globals.players[this.player].updateAim(e);
    }, this);

    window.addEventListener('contextmenu', function(e) {
      if(!e)
        e = window.event;
      e.preventDefault();
    });

    // Sets the player's name if specified.
    if (globals.queries.name !== undefined) {
      globals.socket.emit('name', globals.queries.name);
    }
    window.addEventListener('keydown', keyEvent);
    window.addEventListener('keyup', keyEvent);
    window.addEventListener('mousedown', mouseEvent);
    window.addEventListener('mouseup', mouseEvent);
    window.addEventListener('mousemove', mouseMove);

    // FPS Stuff
    this.fps = 0;
    this.count = 0;
    if (globals.queries.debug === "true") {
      this.fpsCount = window.setInterval(globals.bind(function() {
        this.fps = this.count;
        this.count = 0;
      }, this), 1000);
    }

    // Game loop.
    this.interval = window.setInterval(globals.bind(function() {
      if (globals.queries.debug === "true")
        this.count++;
      this.update();
      this.draw();
    }, this), 16);
  }, this));
};


/**
 * Loads a state message into the game.
 * @param {Object} data The state message.
 */
ITGame.prototype.loadState = function(data) {
  // Players
  if (data.p) {
    for (var id in data.p) {
      if (!globals.players[id]) {
        globals.players[id] = new Player(null, id, data.p[id]);
        continue;
      }

      var player = globals.players[id];
      if (data.p[id].n !== undefined)
        player.name = data.p[id].n;
      if (data.p[id].x !== undefined)
        player.tank.x = data.p[id].x;
      if (data.p[id].y !== undefined)
        player.tank.y = data.p[id].y;
      if (data.p[id].h !== undefined)
        player.health = data.p[id].h;
      if (data.p[id].m !== undefined)
        player.maxHealth = data.p[id].m;
      if (data.p[id].a !== undefined)
        player.setAim(data.p[id].a);
      if (data.p[id].k !== undefined)
        player.setKeyValue(data.p[id].k);
      if (data.p[id].s !== undefined)
        player.speed = data.p[id].s;
      if (data.p[id].w !== undefined)
        player.mounted = data.p[id].w;
      if (data.p[id].d !== undefined)
        player.
      // TODO: Weapon changes
      if (data.p[id].p !== undefined)
        player.totalScore = data.p[id].p;
      if (data.p[id].c !== undefined)
        player.scoreSpent = data.p[id].c;
    }
  }
  // Projectiles
  if (data.q) {
    for (var id in data.q) {
      if (!globals.projectiles[id]) {
        globals.projectiles[id] = new Projectile(null, null, id, data.q[id]);
        if (globals.projectiles[id].type === Projectile.Type.MINE)
          globals.mines[id] = globals.projectiles[id];
        continue;
      }

      if (data.q[id].x !== undefined)
        globals.projectiles[id].x = data.q[id].x;
      if (data.q[id].y !== undefined)
        globals.projectiles[id].y = data.q[id].y;
    }
  }
  // Explosions
  if (data.e) {
    for (var id in data.e) {
      globals.explosions.push(new Explosion(null, null, null, null, null, null, null, data.e[id]));
      if (data.e[id].i !== undefined) {
        delete globals.projectiles[data.e[id].i];
        delete globals.mines[data.e[id].i];
      }
    }
  }
  // Base
  if (data.b) {
    if (data.b[0] !== undefined)
      globals.level.gates[0].health = data.b[0];
    if (data.b[1] !== undefined)
      globals.level.gates[1].health = data.b[1];
  }
};

/**
 * Update the game state.
 */
ITGame.prototype.update = function() {
  globals.level.x = globals.players[this.player].tank.x - 470;
  globals.level.y = globals.players[this.player].tank.y - 220;
};

/**
 * Draw the game state to the canvas.
 */
ITGame.prototype.draw = function() {
  globals.ctx.fillStyle = "#000000";
  globals.ctx.fillRect(0, 0, 1000, 500);

  var tileX = Math.max(Math.floor(globals.level.x / 1000), 0);
  var tileY = Math.max(Math.floor(globals.level.y / 1000), 0);
  var levelX = globals.level.x % 1000;
  var levelY = globals.level.y % 1000;

  // Draw up to four tiles of the map.
  if (tileX >= 0 && tileY >= 0) {
    globals.ctx.drawImage(globals.resources.level[tileX][tileY],
                          -1 * levelX, -1 * levelY);
  }
  if (tileX < 2) {
    globals.ctx.drawImage(globals.resources.level[tileX + 1][tileY],
                          -1 * levelX + 1000, -1 * levelY);
  }
  if (levelY > 500 && tileY < 2) {
    globals.ctx.drawImage(globals.resources.level[tileX][tileY + 1],
                          -1 * levelX, -1 * levelY + 1000);
  }
  if (levelY > 500 && tileX < 2 && tileY < 2) {
    globals.ctx.drawImage(globals.resources.level[tileX + 1][tileY + 1],
                          -1 * levelX + 1000, -1 * levelY + 1000);
  }

  //draw mines
  for (var mine in globals.mines) {
    globals.mines[mine].draw(this.team);
  }

  //draw players
  for (var pid in globals.players) {
    globals.players[pid].draw();
  }

  //draw projectiles
  for (var qid in globals.projectiles) {
    if (globals.projectiles[qid].type !== Projectile.Type.MINE)
      globals.projectiles[qid].draw();
  }

  //draw gates
  for (var g in globals.level.gates) {
    globals.level.gates[g].draw();
  }

  // Explosions
  for (var eid in globals.explosions) {
    if (globals.explosions[eid].draw())
      delete globals.explosions[eid];
  }

  //draw players info
  for (pid in globals.players) {
    if (pid != this.player) // Only draw if this tank is not the player.
      globals.players[pid].drawDetails();
  }

  // Draw HUD
  globals.players[this.player].drawHUD();

  //degbug info
  if (globals.queries.debug === "true") {
    globals.ctx.strokeStyle = "#00ff00";
    for (var i = 0; i < globals.level.walls.length; i++) {
      globals.ctx.strokeRect(globals.level.walls[i].left - globals.level.x,
                             globals.level.walls[i].top - globals.level.y,
                             globals.level.walls[i].width(),
                             globals.level.walls[i].height());
    }

    // Draw FPS
    globals.ctx.fillStyle = "#ffffff";
    globals.ctx.font = "normal 18px sans-serif";
    globals.ctx.fillText("FPS: " + this.fps, 500, 20);
  }
};

ITGame.prototype.message = function(msg) {

};

