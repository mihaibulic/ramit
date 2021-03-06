/**
 * @author ryjust
 */
var io = require('socket.io').listen(1337);
io.set('log level', 1);

// Globals for the server.
var globals = {
  // set the gameover timer to 2 sec (2000ms), don't have it set to be done, & don't start it
  gameoverTimer: new Timer(2000, false, false),
  interval: null,
  fps: 30,
  dt: 0,
  updateTime: 0,
  numberOfPlayers: 0,
  players: {},
  projectiles: {},
  socketToId: {},
  playerIDQueue: [7,6,5,4,3,2,1,0],
  teams: [0,0],
  level: new Level(),
  diff: {},
  immediateDiff: {},
  lastAbsolute: 0,
  upgrade: new Upgrade()
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
 * @returns {Boolean} If the full diff message is sent.
 */
globals.sendFullDiff = function() {
  return (globals.lastAbsolute % 5 === 0);
};

/**
 * @returns {Object} The diff that will be sent at the end of the update.
 */
globals.getImmediateDiff = function() {
  if (globals.sendFullDiff())
    return globals.diff;
  else
    return globals.immediateDiff;
};

/**
 * Explodes projectiles of a player
 * @param {int} pid of player
 * @param {boolean} justMines
 */
var explodeAll = function(player, justMines) {
  for (var p in globals.projectiles) {
    var projectile = globals.projectiles[p];
    if (player.playerID === projectile.owner) {
      if (projectile.type === Projectile.Type.MINE) {
        new Explosion(projectile.x, projectile.y, projectile.range, player, {}, projectile.damage, projectile, false);
        player.projectile[Projectile.Type.MINE].live--;
      }

      if (!justMines || projectile.type === Projectile.Type.MINE) {
        delete globals.projectiles[p];
      }
    }
  }
};

/*
 * Updates the game and sends out a 'diff' message to the players.
 */
var update = function() {
  var now = new Date().getTime();
  globals.dt = now - globals.updateTime;
  globals.updateTime = now;

  if (globals.level.mode === Level.Mode.START)
    globals.level.mode = Level.Mode.ONGOING;
  else if (globals.level.mode === Level.Mode.END) {
    if (!globals.gameoverTimer.isStarted()) {
      globals.gameoverTimer.reset();
    }
    else if (globals.gameoverTimer.isDone()) {
      reset();
    }
  }

  // Players
  for (var pid in globals.players) {
    var player = globals.players[pid];
    player.update();

    if (player.deathTimer.isStarted()) continue;

    // Shoot
    if (player.canFire(Projectile.Type.NORMAL) &&
        (player.keys.space === true || player.mouse.left === true)) {
      globals.projectiles[Projectile.nextID] = new Projectile(player, Projectile.Type.NORMAL, Projectile.nextID);
      Projectile.nextID++;
    }

    // Mine
    if (player.canFire(Projectile.Type.MINE)) {
      if (player.projectile[Projectile.Type.MINE].allowed > player.projectile[Projectile.Type.MINE].live &&
        player.keys.mine === true) {
        globals.projectiles[Projectile.nextID] = new Projectile(player, Projectile.Type.MINE, Projectile.nextID);
        Projectile.nextID++;
      }

      if (player.keys.all_mines === true) {
        explodeAll(player, true);
        player.keys.all_mines = false;
      }
    }

    // Special
    if (player.special[player.mounted] && player.special[player.mounted].lastFire.isDone() &&
        (player.mouse.right === true || player.keys.shift === true)) {
      if (player.mounted == Player.SpecialType.BOMB) {
        if(player.special[player.mounted].allowed) {
          globals.projectiles[Projectile.nextID] = new Projectile(player, Projectile.Type.BOMB, Projectile.nextID);
          Projectile.nextID++;
        }
      } else if (player.mounted === Player.SpecialType.ROCKET) {
        globals.projectiles[Projectile.nextID] = new Projectile(player, Projectile.Type.ROCKET, Projectile.nextID);
        Projectile.nextID++;
      } else if ((player.mounted === Player.SpecialType.EMP) ||
                  (player.mounted === Player.SpecialType.MEDIC)) {
        new Explosion(player.tank.x + 30, player.tank.y + 30,
                    player.special[player.mounted].range,
                    player, null, player.special[player.mounted].damage, null, true);
      } else if (player.mounted === Player.SpecialType.SHIELD) {
        player.armShield();
      }
    }
  }

  // update and check for hits in projectiles
  for (var projectile in globals.projectiles) {
    if (globals.projectiles[projectile].update())
      delete globals.projectiles[projectile];
  }

  emitState();
};

/**
 * @param {Boolean} if true, absolute state will be sent,
 *  regardless of when it was last sent
 */
var emitState = function(override) {
  var absoluteState = getAbsoluteState();
  var stateToEmit = null;

  if (globals.lastAbsolute >= 300 || override) {
    globals.lastAbsolute = 0;

    if(globals.diff.e)
      absoluteState.e = globals.diff.e;

    stateToEmit = absoluteState;  
    globals.diff = {};
  } else if (!globals.isObjectEmpty(globals.diff) && globals.sendFullDiff()) {
    stateToEmit = globals.diff;
    globals.diff = {};
  } else if (!globals.isObjectEmpty(globals.immediateDiff)) {
    stateToEmit = globals.immediateDiff;
  }

  if(stateToEmit !== null) {
    io.sockets.emit('state', stateToEmit);
  }

  globals.immediateDiff = {};
  globals.lastAbsolute++;
};

/**
 * @returns {Object} The absolute state of the game.
 */
var getAbsoluteState = function() {
  var id;
  var state = {};
  // set absolute state
  state.a = true;
  // Players
  state.p = {};
  for (id in globals.players)
    state.p[id] = globals.players[id].getAbsoluteState();
  // Projectiles
  state.q = {};
  for (id in globals.projectiles)
    state.q[id] = globals.projectiles[id].getAbsoluteState();
  // Gates
  state.g = {};
  for (id in globals.level.gates)
    state.g[id] = globals.level.gates[id].health;
  // Headquarters
  state.h = {};
  for (id in globals.level.hqs)
    state.h[id] = globals.level.hqs[id].health;
  // set mode
  state.m = globals.level.mode;
  return state;
};

/**
 * Restarts the server
 */
var reset = function() {
  globals.gameoverTimer.stop();
  globals.level = new Level();
  globals.level.mode = Level.Mode.START;

  // reset all players
  for ( var p in globals.players) {
    var name = globals.players[p].name;
    globals.players[p] = new Player(globals.players[p].team, globals.players[p].playerID);
    globals.players[p].name = name;
  }

  globals.projectiles = {};
  Projectile.nextID = 0;

  // send absolute state
  emitState(true);
};

/**
 * Sets up the actions to take when a socket is opened.
 */
io.sockets.on('connection', function(socket) {
  socket.on('join', function(name) {
    // If the game is full, disconnect.
    if (globals.numberOfPlayers === 8) {
      socket.disconnect();
      return;
    }

    // If this is the first player, start the game.
    if (globals.numberOfPlayers === 0) {
      reset();
      globals.interval = setInterval(update, 1000 / globals.fps);
    }

    // Create the player.
    globals.numberOfPlayers++;
    var team = 0;
    if (globals.teams[1] < globals.teams[0])
      team = 1;
    globals.teams[team]++;
    var id = globals.playerIDQueue.pop();
    globals.socketToId[socket.id] = id;
    globals.players[id] = new Player(team, id, undefined, name);

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

      // Important information, send immediately.
      var diff = globals.getImmediateDiff();

      if (!diff.p)
        diff.p = {};
      if (!diff.p[id])
        diff.p[id] = {};
      diff.p[id].k = globals.players[id].getKeyValue();
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
      console.log("upgrade request received from " + globals.players[id].name +
                  " d:" + Upgrade.DeviceStrings[data.d] +
                  " t:" + Upgrade.TypeStrings[data.t]);
      if (globals.upgrade.buy(data.d, data.t, id)) {
        socket.emit('upgrade_resp', data);
      }
    });

    // Actions to perform when the player disconnects.
    socket.on('disconnect', function() {
      console.log(globals.players[id].name + " left");
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

    // Emit to new player the absolute state
    socket.emit('setup', {i: id, s: getAbsoluteState()});
  });
});
