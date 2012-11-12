/**
 * @author ryjust
 */
var io = require('socket.io').listen(1337);
io.set('log level', 1);

// Globals for the server.
var globals = {
  interval: null,
  fps: 60,
  numberOfPlayers: 0,
  players: {},
  projectiles: {},
  rockets: {},
  mines: {}, //will include all splash weapons
  socketToId: {},
  playerIDQueue: [7,6,5,4,3,2,1,0],
  teams: [0,0],
  level: new Level(),
  diff: {},
  lastAbsolute: 0
};

/**
 * Checks if an object is empty.
 * @param {Object} The object to check.
 * @returns {Boolean} If the object is empty.
 */
globals.isObjectEmpty = function(object) {
  for (var x in object)
    return false;
  return true;
};

/**
 * Explodes projectiles of a player
 * @param {int} pid of player
 * @param {boolean} justMines
 */
var explodeAll = function(owner, justMines) {
  for (var qid in globals.projectiles) {
    var projectile = globals.projectiles[qid];
    if (projectile.owner === owner) {
      if (projectile.type === Projectile.Type.MINE) {
        new Explosion(this.x, this.y, this.range, globals.players[this.owner],
                    target, this.damage, this, false);
        delete globals.mine[qid];
      }
      if  (!justMines || projectile.type === Projectile.Type.MINE) {
        delete globals.projectiles[qid];
      }
    }
  }
};

/*
 * Updates the game and sends out a 'diff' message to the players.
 */
var update = function() {
  // Players
  for (var pid in globals.players) {
    var player = globals.players[pid];
    player.update();
    // Shoot
    if (player.canFire(Projectile.Type.NORMAL) &&
        (player.keys.space === true || player.mouse.left === true)) {
      globals.projectiles[Projectile.nextID] =
        new Projectile(player, Projectile.Type.NORMAL, Projectile.nextID);
      Projectile.nextID++;
    }

    // Mine
    if (player.canFire(Projectile.Type.MINE)) {
      if (player.projectile[Projectile.Type.MINE].allowed > player.projectile[Projectile.Type.MINE].live &&
        player.keys.mine === true) {
        globals.projectiles[Projectile.nextID] = new Projectile(player, Projectile.Type.MINE, Projectile.nextID);
        globals.mines[Projectile.nextID] = globals.projectiles[Projectile.nextID];
        Projectile.nextID++;
      }

      if (player.keys.all_mines === true) {
        for (var m in globals.mines) {
          var mine = globals.mines[m];
          if (player.playerID === mine.owner) {
            new Explosion(mine.x, mine.y, mine.range, player, {}, mine.damage, mine, false);
            delete globals.projectiles[m];
            delete globals.mines[m];
            player.projectile[Projectile.Type.MINE].live--;
          }
        }
        console.log("Player #" + player + " has " + player.projectile[Projectile.Type.MINE].live + " live mines");
      }
    }

    // Special
    if (player.special[player.mounted] && 
        player.special[player.mounted].lastFire > player.special[player.mounted].coolDown &&
        (player.mouse.right === true || player.keys.shift === true)) {
      console.log("firing special weapon " + player.mounted);
      if (player.mounted === Player.SpecialType.ROCKET) {
        globals.projectiles[Projectile.nextID] =
          new Projectile(player, Projectile.Type.ROCKET, Projectile.nextID);
        Projectile.nextID++;
      } else if ((player.mounted === Player.SpecialType.EMP) ||
                  (player.mounted === Player.SpecialType.MEDIC)) {
        new Explosion(player.tank.x + 30, player.tank.y +30, 
                    player.special[player.mounted].range, 
                    player, null, player.special[player.mounted].damage, null, true);
      } else if (player.mounted === Player.SpecialType.SHIELD) {
        player.armShield();
      }
      player.special[player.mounted].lastFire = 0;
    }
  }

  // update and check for hits in projectiles
  for (var projectile in globals.projectiles) {
    if (globals.projectiles[projectile].update())
      delete globals.projectiles[projectile];
  }

  globals.lastAbsolute++;
  if(globals.lastAbsolute >= 300) { 
    var absoluteState = getAbsoluteState(); 
    globals.lastAbsolute = 0;
    
    if(!globals.isObjectEmpty(globals.diff.e)) {
      absoluteState.e = globals.diff.e;
    }

    io.sockets.emit('state', absoluteState);
  }
  else if(!globals.isObjectEmpty(globals.diff)) {
    io.sockets.emit('state', globals.diff);
  }

  globals.diff = {};
};

/**
 * @returns {Object} The absolute state of the game.
 */
var getAbsoluteState = function() {
  var id;
  var state = {};
  // Players
  state.p = {};
  for (id in globals.players)
    state.p[id] = globals.players[id].getAbsoluteState();
  // Projectiles
  state.q = {};
  for (id in globals.projectiles)
    state.q[id] = globals.projectiles[id].getAbsoluteState();
  // Mines
  state.m = {};
  for (id in globals.mines)
    state.m[id] = globals.mines[id].getAbsoluteState();
  // Base
  state.b = {};
  for (id in globals.level.gates) {
    state.b[id] = globals.level.gates[id].health;
  }
  return state;
};

/**
 * Sets up the actions to take when a socket is opened.
 */
io.sockets.on('connection', function(socket) {
  // If the game is full, disconnect.
  if (globals.numberOfPlayers === 8) {
    socket.disconnect();
    return;
  }

  // If this is the first player, start the game.
  if (globals.numberOfPlayers === 0)
    globals.interval = setInterval(update, 1000 / globals.fps);

  // Create the player.
  globals.numberOfPlayers++;
  var team = 0;
  if (globals.teams[1] < globals.teams[0])
    team = 1;
  globals.teams[team]++;
  var id = globals.playerIDQueue.pop();
  globals.socketToId[socket.id] = id;
  globals.players[id] = new Player(team, id);

  // Actions to perform on name changes.
  socket.on('name', function(data) {
    globals.players[id].name = data;
    if (!globals.diff.p)
      globals.diff.p = {};
    if (!globals.diff.p[id])
      globals.diff.p[id] = {};
    globals.diff.p[id].n = data;
  });

  // Actions to perform when the player presses or releases a key.
  socket.on('key', function(data) {
    if (data.u !== undefined)
      globals.players[id].keys.up = data.u;
    if (data.d !== undefined)
      globals.players[id].keys.down = data.d;
    if (data.l !== undefined)
      globals.players[id].keys.left = data.l;
    if (data.r !== undefined)
      globals.players[id].keys.right = data.r;
    if (data.s !== undefined)
      globals.players[id].keys.space = data.s;
    if (data.e !== undefined)
      globals.players[id].keys.mine = data.e;
    if (data.q !== undefined)
      globals.players[id].keys.all_mines = data.q;
    if (data.w !== undefined)
      globals.players[id].keys.shift = data.w;
    if (data.m !== undefined)
      globals.players[id].mounted = data.m;
    if (!globals.diff.p)
      globals.diff.p = {};
    if (!globals.diff.p[id])
      globals.diff.p[id] = {};
    globals.diff.p[id].k = globals.players[id].getKeyValue();
  });

  socket.on('mouse', function(data) {
    if(data.l !== undefined)
      globals.players[id].mouse.left = data.l;
    if(data.m !== undefined)
      globals.players[id].mouse.middle = data.m;
    if(data.r !== undefined)
      globals.players[id].mouse.right = data.r;
  });

  // Actions to perform when the player changes the tank's aim.
  socket.on('aim', function(data) {
    if (data.a !== undefined)
      globals.players[id].setAim(data.a);

    if (!globals.diff.p)
      globals.diff.p = {};
    if (!globals.diff.p[id])
      globals.diff.p[id] = {};
    globals.diff.p[id].a = globals.players[id].getAim();
  });

  socket.on('upgrade', function(data) {
    if(data.t !== undefined && data.o !== undefined)
      globals.players[id].upgrade(data.t, data.o);
  });

  // Actions to perform when the player disconnects.
  socket.on('disconnect', function() {
    globals.teams[globals.players[id].team]--;
    delete globals.players[id];
    if (--globals.numberOfPlayers === 0) {
      clearInterval(globals.interval);
      globals.interval = null;
    }
    // Remove all projectiles owned by this player.
    for (var qid in globals.projectiles) {
      if (globals.projectiles[qid].owner === id)
        delete globals.projectiles[qid];
    }
    // Notify the other players that a player has left.
    socket.broadcast.emit('leave', {i: id});
    globals.playerIDQueue.push(id);
    delete globals.socketToId[socket.id];
  });

  // Broadcast to the other players that there is a new player.
  socket.emit('setup', {i: id, s: getAbsoluteState()});
});
