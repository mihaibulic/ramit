/**
 * The Interactive Tanks game.
 */
var ITGame = function(team, playerID) {
  globals.socket = io.connect('ws://ramit.'+document.domain);
  globals.upgrade = new Upgrade();

  globals.socket.on('setup', globals.bind(function(data) {

    globals.socket.on('state', globals.bind(function(data) {
      this.loadState(data, false);
    }, this));

    globals.socket.on('leave', function(data) {
      // Set up fade out of player
      console.log(globals.players[data.i].name + " is leaving");
      globals.players[data.i].leaving = true;
      globals.players[data.i].health = 0;
      globals.players[data.i].deathTimer.reset();
      globals.messages.push(globals.players[data.i].name + " has left the game.");
      // Remove all projectiles and mines owned by this player.
      for (var qid in globals.projectiles) {
        if (globals.projectiles[qid].owner === data.i) {
          delete globals.projectiles[qid];
        }
      }
    });

    //XXX to save on # of msgs, could instead call buy, before emitting the upgrade msg
    globals.socket.on('upgrade_resp', function(d) {
      globals.upgrade.buy(d.d, d.t, data.i);
    });

    this.loadState(data.s, true);
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


    //Blur event
    var blur = function(e) {
      globals.keys = {up:0, down:0, left:0, right:0, mine:0, all_mines:0, space:0, shift:0};
      globals.mouse = {left:0, middle:0, right:0};

      globals.socket.emit("key", {u:0,d:0,l:0,r:0,e:0,q:0,s:0,w:0});
      globals.socket.emit("mouse", {l:0,m:0,r:0});
    };

    document.getElementById("cnv").addEventListener('blur', blur);
    window.addEventListener('blur', blur);

    // Context Menu Event
    window.addEventListener('contextmenu', function(e) {
      if(!e)
        e = window.event;
      e.preventDefault();
    });

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
    globals.updateTime = new Date().getTime();
    var gameLoop = globals.bind(function() {
      if (globals.queries.debug === "true")
        this.count++;

      var now = new Date().getTime();
      globals.dt = now - globals.updateTime;
      globals.updateTime = now;

      this.predict();
      this.draw();

      window.requestAnimationFrame(gameLoop, globals.canvas);
    }, this);

    gameLoop();
  }, this));
};

/**
 * Joins the game.
 * @param {String} name The player's selected name.
 */
ITGame.prototype.join = function(name) {
  globals.socket.emit('join', name);
};

/**
 * Loads a state message into the game.
 * @param {Object} data The state message.
 * @param {Boolean} join If the player is joining or not.
 */
ITGame.prototype.loadState = function(data, join) {
  if(data.m !== undefined)
    globals.level.mode = data.m;

  // Players
  var id;
  if (data.p) {
    for (id in data.p) {
      if (!globals.players[id]) {
        globals.players[id] = new Player(null, id, data.p[id]);
        player = globals.players[id];
        if (id == this.player)
          globals.messages.push("You have joined the " + (player.team === 0 ? "Blue" : "Red") + " Team.");
        else if (!join)
          globals.messages.push(player.name + " has joined the the " +
                                (player.team === 0 ? "Blue" : "Red") + " Team.");
      } else {
        globals.players[id].loadState(data.p[id], this.player);
      }
    }
  }
  // Projectiles
  if (data.q) {
    for (id in data.q) {
      if (!globals.projectiles[id]) {
        globals.projectiles[id] = new Projectile(null, null, id, data.q[id]);
        continue;
      }

      globals.projectiles[id].hitWall = false;
      if (data.q[id].x !== undefined)
        globals.projectiles[id].sx = data.q[id].x;
      if (data.q[id].y !== undefined)
        globals.projectiles[id].sy = data.q[id].y;
    }
  }
  // Explosions
  if (data.e) {
    for (id in data.e) {
      globals.explosions.push(new Explosion(null, null, null, null, null, null, null, null, data.e[id]));
      if (data.e[id].i !== undefined) {
        delete globals.projectiles[data.e[id].i];
      }
    }
  }
  // Clean up dangling projectiles during absolute state
  if (Boolean(data.a)) {
    for (id in globals.projectiles) {
      if (!data.q[id] ) {
        // should we create an explosion here?
        delete globals.projectiles[id];
      }
    }
  }
  // Gates
  if (data.g) {
    for (var g in data.g) {
      if (data.g[g] !== undefined) {
        globals.level.gates[g].updateHealth(data.g[g], this.team, !join);
      }
    }
  }
  // Headquarters
  if (data.h) {
    for (var h in data.h) {
      if (data.h[h] !== undefined)
        globals.level.hqs[h].updateHealth(data.h[h]);
    }
  }
};

/**
 * Predict the updated the game state.
 */
ITGame.prototype.predict = function() {
  if (globals.level.mode === Level.Mode.START) {
    globals.level = new Level();
    globals.level.mode = Level.Mode.ONGOING;

    globals.projectiles = {};
    Projectile.nextID = 0;
  }

  for (var hid in globals.level.hqs) {
    globals.level.hqs[hid].predict();
  }
  for (var gid in globals.level.gates) {
    globals.level.gates[gid].predict();
  }
  for (var pid in globals.players) {
    if (globals.players[pid].leaving) {
      if (globals.players[pid].deathTimer.isDone()) {
        console.log(globals.players[pid].name + " has left");
        delete globals.players[pid];
      }
      continue;
    }

    globals.players[pid].predict();
  }
  for (var qid in globals.projectiles) {
    globals.projectiles[qid].predict();
  }

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

  //draw  mines
  for (var qid in globals.projectiles) {
    if (globals.projectiles[qid].type === Projectile.Type.MINE)
      globals.projectiles[qid].draw(this.team);
  }

  //draw players
  for (var pid in globals.players) {
    globals.players[pid].draw();
  }

  //draw gates
  for (var g in globals.level.gates) {
    globals.level.gates[g].draw();
  }

  //draw headquarters
  for (var h in globals.level.hqs) {
    globals.level.hqs[h].draw();
  }

  // Explosions
  for (var eid in globals.explosions) {
    if (globals.explosions[eid].draw())
      delete globals.explosions[eid];
  }

  //draw non-mine projectiles
  for (qid in globals.projectiles) {
    if (globals.projectiles[qid].type !== Projectile.Type.MINE)
      globals.projectiles[qid].draw(this.team);
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

  if (globals.level.mode === Level.Mode.START) {
    // game starting
    // TODO draw special start screen?
  }
  else if (globals.level.mode === Level.Mode.END) {
    // game ending
    // TODO draw scores and you are [winner|loser] msg
  }
};

ITGame.prototype.message = function(msg) {

};

