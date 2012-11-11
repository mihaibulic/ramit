/**
 * The Interactive Tanks game.
 */
var ITGame = function(team, playerID) {
  this.level = new Level();
  var level = this.level;

  globals.socket = io.connect('ws://www.misquares.com');
  globals.socket.on('setup', globals.bind(function(data) {
    globals.socket.on('state', function(data) {
      for(var id in data) {
        if (data[id].key !== undefined) {
          globals.players[id].keys.up = (data[id].key&1);
          globals.players[id].keys.down = (data[id].key&2);
          globals.players[id].keys.left = (data[id].key&4);
          globals.players[id].keys.right = (data[id].key&8);
        }
        if (data[id].x !== undefined)
          globals.players[id].tank.x = data[id].x;
        if (data[id].y !== undefined)
          globals.players[id].tank.y = data[id].y;
        if (data[id].aim !== undefined)
          globals.players[id].setAim(data[id].aim);
        if (data[id].n !== undefined) {
          console.log("new projectile %d", data[id].n);
          globals.projectiles[data[id].n] = new Projectile(globals.players[id], data[id].n);
        }
        if (data[id].r !== undefined) {
          console.log("new rocket %d", data[id].r);
          globals.rockets[data[id].r] = new Rocket(globals.players[id], data[id].r);
        }
        if (data[id].m !== undefined) {
          console.log("new mine %d", data[id].m);
          globals.mines[data[id].m] = new Mine(globals.players[id], data[id].m);
        }
        if (data.h !== undefined) {
          for (var n in data.h) {
            if (data.h[n].t !== undefined) { //hit gate or player
              var projectile = globals.projectiles[n];
              if (projectile) {
                var hitter = globals.players[projectile.owner];
                if (hitter) {
                  //hitter still in game
                  hitter.score++;
                  hitter.totScore++;
                }
                var hit = [];
                if (data.h[n].i !== undefined) {
                  //hit player
                  hit = globals.players[data.h[n].i];
                  hit.takeHit(projectile.damage);
                  console.log("projectile %d hit player %d health %d", n, data.h[n].i, hit.health);
                } else {
                  //hit gate
                  hit = level.gates[data.h[n].t];
                  hit.takeHit(projectile.damage);
                  console.log("projectile %d hit gate %d health %d", n, data.h[n].t, hit.health);
                }
              }
            } else {
              console.log("projectile %d hit a wall", n);
            }
            delete globals.projectiles[n];
          }
        }
        if (data.rh !== undefined) {
          for (var r in data.rh) {
            console.log("Rocket %d exploded! Damaging %d player(s)!", r, data.rh[r].h.length);
            if (globals.rockets[r]) {
              for (var rh in data.rh[r].h) {
                globals.players[data.rh[r].h[rh]].takeHit(globals.rockets[r].damage);
              }
              delete globals.rockets[r];
            }
          }
        }
        if (data.s !== undefined) {
          for (var m in data.s) {
            console.log("Mine %d exploded! Damaging %d player(s)!", m, data.s[m].h.length);
            if (globals.mines[m]) {
              for (var h in data.s[m].h) {
                globals.players[data.s[m].h[h]].takeHit(globals.mines[m].damage);
              }
              delete globals.mines[m];
            }
          }
        }
      }
    });

    globals.socket.on('join', function(data) {
      globals.players[data.i] = new Player(data.t, data.i, data.s);
    });
    globals.socket.on('leave', function(data) {
      delete globals.players[data.i];
    });

    this.team = data.p.t;
    this.player = data.p.i;
    for (var pid in data.s) {
      globals.players[pid] = new Player(data.s[pid].t, pid);
      globals.players[pid].tank.x = data.s[pid].x;
      globals.players[pid].tank.y = data.s[pid].y;
      globals.players[pid].setAim(data.s[pid].aim);
      globals.players[pid].setKeyValue(data.s[pid].key);
    }

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

    window.addEventListener('keydown', keyEvent);
    window.addEventListener('keyup', keyEvent);

    window.oncontextmenu = function(e) {
      if(!e)
        e = window.event;
      e.preventDefault();
    };

    window.addEventListener('mousedown', mouseEvent);
    window.addEventListener('mouseup', mouseEvent);
    window.addEventListener('mousemove', globals.bind(function(e) {
      if (!e)
        e = window.event;
      globals.players[this.player].updateAim(e);
    }, this));

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
 * Update the game state.
 */
ITGame.prototype.update = function() {
  //globals.players[this.player].update(this.level);

  this.level.x = globals.players[this.player].tank.x - 470;
  this.level.y = globals.players[this.player].tank.y - 220;
  for (var projectile in globals.projectiles) {
    globals.projectiles[projectile].update();
  }
  for (var rocket in globals.rockets) {
    globals.rockets[rocket].update();
  }
  for (var mine in globals.mines) {
    globals.mines[mine].update(globals); //ignores hits
  }
};

/**
 * Draw the game state to the canvas.
 */
ITGame.prototype.draw = function() {
  globals.ctx.fillStyle = "#000000";
  globals.ctx.fillRect(0, 0, 1000, 500);

  var tileX = Math.max(Math.floor(this.level.x / 1000), 0);
  var tileY = Math.max(Math.floor(this.level.y / 1000), 0);
  var levelX = this.level.x % 1000;
  var levelY = this.level.y % 1000;

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
    globals.mines[mine].draw(this.level);
  }

  //draw players
  for (var pid in globals.players) {
    globals.players[pid].draw(this.level);
  }

  //draw projectiles
  for (var projn in globals.projectiles) {
    globals.projectiles[projn].draw(this.level);
  }

  //draw rockets
  for(var rock in globals.rockets) {
    globals.rockets[rock].draw(this.level);
  }

  //draw gates
  for (var g in this.level.gates) {
    this.level.gates[g].draw(this.level);
  }

  //draw players info
  for (pid in globals.players) {
    if (pid != this.player) // Only draw if this tank is not the player.
      globals.players[pid].drawDetails(this.level);
  }

  // Draw HUD
  globals.players[this.player].drawHUD();

  //degbug info
  if (globals.queries.debug === "true") {
    globals.ctx.strokeStyle = "#00ff00";
    for (var i = 0; i < this.level.walls.length; i++) {
      globals.ctx.strokeRect(this.level.walls[i].left - this.level.x,
                             this.level.walls[i].top - this.level.y, this.level.walls[i].width(),
                             this.level.walls[i].height());
    }

    // Draw FPS
    globals.ctx.fillStyle = "#ffffff";
    globals.ctx.font = "normal 18px sans-serif";
    globals.ctx.fillText("FPS: " + this.fps, 500, 20);

    // Draw scores

    for (var player in globals.players) {
      globals.ctx.fillText("Player: " + player + " Score: " + globals.players[player].score, 5, 25 + 20 * player);
    }

  }
};
