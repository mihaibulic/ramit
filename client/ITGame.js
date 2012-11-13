/**
 * The Interactive Tanks game.
 */
var ITGame = function(team, playerID) {
  globals.socket = io.connect('ws://www.misquares.com');
  globals.socket.on('setup', globals.bind(function(data) {

    globals.socket.on('state', globals.bind(function(data) {
      this.loadState(data);
    }, this));

    globals.socket.on('join', function(data) {
      var player = new Player(null, data.i, data.p);
      globals.players[data.i] = player;
      globals.messages.push(player.name + " has joined the game for the " + (player.team === 0 ? "Blue" : "Red") + " Team");
    });

    globals.socket.on('leave', function(data) {
      // Set up fade out of player
      console.log(globals.players[data.i].name + " is leaving");
      globals.players[data.i].leaving = true;
      globals.players[data.i].health = 0;
      globals.players[data.i].deathCounter = 1;
      globals.messages.push(globals.players[data.i].name + " has left");
      // Remove all projectiles and mines owned by this player.
      for (var qid in globals.projectiles) {
        if (globals.projectiles[qid].owner === data.i) {
          delete globals.projectiles[qid];
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


    //Blur event
    var blur = function(e) {
      globals.keys = {up:0, down:0, left:0, right:0, mine:0, all_mines:0, space:0, shift:0, mounted:0};
      globals.mouse = {left:0, middle:0, right:0};

      globals.socket.emit("key", {u:0,d:0,l:0,r:0,e:0,q:0,s:0,w:0,m:0});
      globals.socket.emit("mouse", {l:0,m:0,r:0});
    };

    document.getElementById("cnv").addEventListener('blur', blur);
    document.getElementById("renderer").addEventListener('blur', blur);
    window.addEventListener('blur', blur);

    // Context Menu Event
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
  if(data.m !== undefined) 
    globals.level.mode = data.m;

  // Players
  var id;
  if (data.p) {
    for (id in data.p) {
      if (!globals.players[id]) {
        globals.players[id] = new Player(null, id, data.p[id]);
        player = globals.players[id];
        globals.messages.push(player.name + " has joined the game for the " + (player.team === 0 ? "Blue" : "Red") + " Team");
        continue;
      }
      var player = globals.players[id];
      if (data.p[id].n !== undefined)
        player.name = data.p[id].n;
      if (data.p[id].x !== undefined)
        player.tank.x = data.p[id].x;
      if (data.p[id].y !== undefined)
        player.tank.y = data.p[id].y;
      if (data.p[id].h !== undefined) {
        player.health = data.p[id].h;
        if (player.health === 0) 
          globals.messages.push(player.name + " has been killed");
      }
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
        player.hasShield = data.p[id].d;
      if (data.p[id].p !== undefined)
        player.totalScore = data.p[id].p;
      if (data.p[id].c !== undefined)
        player.scoreSpent = data.p[id].c;
    }
  }
  // Projectiles
  if (data.q) {
    for (id in data.q) {
      if (!globals.projectiles[id]) {
        globals.projectiles[id] = new Projectile(null, null, id, data.q[id]);
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
    for (id in data.e) {
      globals.explosions.push(new Explosion(null, null, null, null, null, null, null, null, data.e[id]));
      if (data.e[id].i !== undefined) {
        delete globals.projectiles[data.e[id].i];
      }
    }
  }
  // Gates
  if (data.g) {
    for (var g in data.g) {
      if (data.g[g] !== undefined) {
        globals.level.gates[g].updateHealth(data.g[g]);
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
 * Update the game state.
 */
ITGame.prototype.update = function() {
  if (globals.level.mode === Level.Mode.START) {
    globals.level = new Level();
    globals.level.mode = Level.Mode.ONGOING;

    // reset all players
    for ( var p in globals.players) {
    }

    globals.projectiles = {};
    Projectile.nextID = 0;
    globals.messages.push("A new game is starting, good luck!");
  }
  else if (globals.level.mode === Level.Mode.END) {
    globals.messages.push("Gameover!");
    return;
  }

  globals.level.x = globals.players[this.player].tank.x - 470;
  globals.level.y = globals.players[this.player].tank.y - 220;
  for (var hid in globals.level.hqs) {
    globals.level.hqs[hid].update();
  }
  for (var gid in globals.level.gates) {
    globals.level.gates[gid].update();
  }
  for (var pid in globals.players) {
    if (globals.players[pid].leaving) {
      globals.players[pid].deathCounter++;
    }
    if (globals.players[pid].leaving && globals.players[pid].deathCounter >= 90) {
      console.log(globals.players[pid].name + " has left");
      delete globals.players[pid];
    }
  }
};

/**
 * Draw the game state to the canvas.
 */
ITGame.prototype.draw = function() {
  if (globals.level.mode === Level.Mode.START) {
    // game starting
    // TODO draw special start screen?
  }
  else if (globals.level.mode === Level.Mode.END) {
    // game ending
    // TODO draw scores and you are [winner|loser] msg
    return;
  }

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

  //draw projectiles (including mines)
  for (var qid in globals.projectiles) {
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

