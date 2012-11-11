/**
 * @author ryjust
 */
var io = require('socket.io').listen(1337);

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
  diff: {}
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
                    target, this.damage, this);
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
    if (player.projectile[Projectile.Type.NORMAL].lastFire > 10 &&
        (player.keys.space === true || player.mouse.left === true)) {
      globals.projectiles[Projectile.nextID] =
        new Projectile(player, Projectile.Type.NORMAL, Projectile.nextID);
      Projectile.nextID++;
    }

    // Mine
    if (player.projectile[Projectile.Type.MINE].allowed > player.projectile[Projectile.Type.MINE].live &&
        player.keys.mine === true) {
      globals.projectiles[Projectile.nextID] =
        new Projectile(player, Projectile.Type.MINE, Projectile.nextID);
      Projectile.nextID++;
    }

    if (player.projectile[Projectile.Type.MINE].live > 0 && player.keys.all_mines === true) {
      console.log("ALL GO BOOM");
      for (var m in globals.mines) {
        var mine = globals.mines[mine];
        if (player === mine.owner) {
          new Explosion(mine.x, mine.y, mine.range, player, {}, mine.damage, mine);
          delete globals.projectile[m];
          delete globals.mines[m];
        }
        player.projectile[Projectile.Type.MINE].live--;
      }
    }

    // Rocket
    if (player.projectile[Projectile.Type.ROCKET].lastFire > 120 &&
        (player.mouse.right === true)) {
      globals.projectiles[Projectile.nextID] =
        new Projectile(player, Projectile.Type.ROCKET, Projectile.nextID);
      Projectile.nextID++;
    }

    // TODO: EMP and Medic
  }

  // update and check for hits in projectiles
  for (var projectile in globals.projectiles) {
    if (globals.projectiles[projectile].update())
      delete globals.projectiles[projectile];
  }

  if (!globals.isObjectEmpty(globals.diff))
    io.sockets.emit('state', globals.diff);
  globals.diff = {};

};

/**
 * @returns {Object} The absolute state of the game.
 */
var getAbsoluteState = function() {
  var id;
  var state = {};
  // TODO: Copy/paste into classes.
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
    // TODO: Add HQ stuff
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
