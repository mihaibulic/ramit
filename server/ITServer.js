/**
 * @author ryjust
 */
var io = require('socket.io').listen(1337);

// Globals for the server.
var server = {
  interval: null,
  fps: 60,
  numberOfPlayers: 0,
  players: {},
  projectiles: {},
  rockets: {},
  mines: {}, //will include all splash weapons
  gates: [new Gate(0), new Gate(1)],
  socketToId: {},
  playerIDQueue: [7,6,5,4,3,2,1,0],
  colors: [0,0],
  level: new Level(),
  diff: {},
  usedDiff: false,
  n: 0,
  m: 0,
  r: 0
};

// Define globals as an alias of server to make the shared code more compatible.
var globals = server;

/*
 * Updates the game and sends out a 'diff' message to the players.
 */
var update = function() {
  var playerDiff;
  var msg;
  for (var pid in server.players) {
    playerDiff = {};
    var player = server.players[pid];
    player.update(server.level, playerDiff);
    // check if the player should fire projectile
    if (player.projectile.lastFire > 10 &&
        (player.keys.space === true || player.mouse.left === true))
    {
      server.projectiles[server.n] = new Projectile(player, server.n);
      playerDiff.n = server.n;
      server.n++;
    }
    // check if the player should fire rocket
    if (player.rocket.allowed > player.rocket.live &&
        player.rocket.lastFire > 15 &&
        player.mouse.right === true)
    {
      server.rockets[server.r] = new Rocket(player, server.r);
      playerDiff.r = server.r;
      server.r++;
    }

    // mine
    if (player.mine.allowed > player.mine.live && player.keys.mine === true) {
      server.mines[server.m] = new Mine(player, server.m);
      playerDiff.m = server.m;
      server.m++;
    }
    // Copy the differences found into the server's diff object.
    for (var diff in playerDiff) {
      if (!server.diff[pid])
        server.diff[pid] = {};
      server.diff[pid][diff] = playerDiff[diff];
      server.usedDiff = true;
    }
  }
  // update and check for hits in projectiles
  for (var projectile in server.projectiles) {
    server.projectiles[projectile].update(server.level);
    var target = server.projectiles[projectile].checkHit(server, server.level);
    if (target) {
      if (target !== 1) {
        target.takeHit(server.projectiles[projectile].damage);
      }
      var hitter = server.players[server.projectiles[projectile].owner];
      if (hitter) {
        hitter.score++;
        hitter.totScore++;
      }
      if (!server.diff.h) server.diff.h = {};
      server.diff.h[projectile] = { t: target.team, i: target.playerID };
      server.usedDiff = true;
      delete server.projectiles[projectile];
    }
  }

  // update all rockets
  for(var r in server.rockets) {
    server.rockets[r].update(server.level);
    var rhits = server.rockets[r].checkHit(server, server.level);
    if (rhits !== undefined) {
      if (!server.diff.rh) server.diff.rh = {};
      server.diff.rh[r] = {};
      server.diff.rh[r].h = [];
      for (var rhit in rhits) {
        server.diff.rh[r].h.push(rhits[rhit]);
        server.players[rhits[rhit]].takeHit(server.rockets[r].damage);
      }
      server.usedDiff = true;
      server.players[server.rockets[r].owner].rocket.live--;
      delete server.rockets[r];
    }
  }

  if (server.usedDiff)
    io.sockets.emit('state', server.diff);
  server.diff = {};
  server.usedDiff = false;
};

/**
 * @returns {Object} The absolute state of the game.
 */
var getAbsoluteState = function() {
  var state = {};
  for (var id in server.players) {
    state[id] = {};
    state[id].t = server.players[id].team;
    state[id].x = server.players[id].tank.x;
    state[id].y = server.players[id].tank.y;
    state[id].aim = server.players[id].getAim();
    state[id].key = server.players[id].getKeyValue();
  }
  return state;
};

/**
 * Sets up the actions to take when a socket is opened.
 */
io.sockets.on('connection', function(socket) {
  // If the game is full, disconnect.
  if (server.numberOfPlayers === 8) {
    socket.disconnect();
    return;
  }

  // If this is the first player, start the game.
  if (server.numberOfPlayers === 0)
    server.interval = setInterval(update, 1000 / server.fps);

  // Create the player.
  server.numberOfPlayers++;
  var color = 0;
  if (server.colors[1] < server.colors[0])
    color = 1;
  server.colors[color]++;
  var id = server.playerIDQueue.pop();
  server.socketToId[socket.id] = id;
  server.players[id] = new Player(color, id);

  // Actions to perform when the player presses or releases a key.
  socket.on('key', function(data) {
    if (data.u !== undefined)
      server.players[id].keys.up = data.u;
    if (data.d !== undefined)
      server.players[id].keys.down = data.d;
    if (data.l !== undefined)
      server.players[id].keys.left = data.l;
    if (data.r !== undefined)
      server.players[id].keys.right = data.r;
    if (data.s !== undefined)
      server.players[id].keys.space = data.s;
    if (data.e !== undefined)
      server.players[id].keys.mine = data.e;
    if (!server.diff[id])
      server.diff[id] = {};
    server.diff[id].key = server.players[id].getKeyValue();
    server.usedDiff = true;
  });

  socket.on('mouse', function(data) {
    if(data.l !== undefined)
      server.players[id].mouse.left = data.l;
    if(data.m !== undefined)
      server.players[id].mouse.middle = data.m;
    if(data.r !== undefined)
      server.players[id].mouse.right = data.r;
  });

  // Actions to perform when the player changes the tank's aim.
  socket.on('aim', function(data) {
    if (data.a !== undefined)
      server.players[id].setAim(data.a);

    if (!server.diff[id])
      server.diff[id] = {};
    server.diff[id].aim = server.players[id].getAim();
    server.usedDiff = true;
  });

  socket.on('upgrade', function(data) {
    if(data.t !== undefined && data.o !== undefined)
      server.players[id].upgrade(data.t, data.o);
  });

  // Actions to perform when the player disconnects.
  socket.on('disconnect', function() {
    server.colors[server.players[id].team]--;
    delete server.players[id];
    if (--server.numberOfPlayers === 0) {
      clearInterval(server.interval);
      server.interval = null;
    }
    // Notify the other players that a player has left.
    socket.broadcast.emit('leave', {i: id});
    server.playerIDQueue.push(id);
    delete server.socketToId[socket.id];
  });

  // Broadcast to the other players that there is a new player.
  var playerInfo = {t: color, i: id, s: server.players[id].starting_spawn};
  socket.broadcast.emit('join', playerInfo);
  socket.emit('setup', {p: playerInfo, s: getAbsoluteState()});
});
