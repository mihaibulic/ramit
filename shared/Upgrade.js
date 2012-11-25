/**
 * The Upgrade class
 */
var Upgrade = function (){
  this.load();
};

// the devices which can be upgraded.
Upgrade.Device = {
  TANK: 0,
  PROJECTILE: 1,
  MINE: 2,
  ROCKET: 3,
  EMP: 4,
  MEDIC: 5,
  SHIELD: 6,
  BOMB: 7
};

// A list of Devices to Strings
Upgrade.DeviceStrings = [ "Tank", 
                          "Bullet", 
                          "Mine", 
                          "Rocket", 
                          "EMP", 
                          "Medic", 
                          "Shield", 
                          "Bomb" ];

// the types of upgrades possible.
// not all devices may receive all types of upgrades.
Upgrade.Type = {
  MAX_HP: 0,
  SPEED: 1,
  COOLDOWN: 2,
  RANGE: 3,
  DAMAGE: 4,
  ALLOWED: 5,
  DURATION: 6
};

// A list of Types to Strings
Upgrade.TypeStrings = [ "Max HP", 
                        "Speed", 
                        "Fire rate", 
                        "Explosion size",  // These two are wierd because of medic
                        "Power", 
                        "Allowed", 
                        "Duration" ]; 

Upgrade.prototype.load = function() {
  // The list of costs
  this.cost = []; 
  // The list of rewards, listed as what is added to current value
  this.diff = []; 
  var d = Upgrade.Device;
  var t = Upgrade.Type;
 
  // Tank upgrades
  this.cost[d.TANK] = [];
  this.diff[d.TANK] = [];
  this.cost[d.TANK][t.MAX_HP] = [ 125, 300, 600 ];
  this.diff[d.TANK][t.MAX_HP] = [ 25, 30, 40 ];
  this.cost[d.TANK][t.DEFENSE] = [ 125, 300, 600 ];
  this.diff[d.TANK][t.DEFENSE] = [ -0.1, -0.1, -0.1 ];
  this.cost[d.TANK][t.SPEED] = [ 125, 300, 400 ];
  this.diff[d.TANK][t.SPEED] = [ 1, 1, 1 ];
  this.cost[d.TANK][t.REWARD] = [ 300, 800, 1500 ];
  this.diff[d.TANK][t.REWARD] = [ 0.5, 0.4, 0.3 ];

  // Projectile upgrades
  this.cost[d.PROJECTILE] = [];
  this.diff[d.PROJECTILE] = [];
  this.cost[d.PROJECTILE][t.SPEED] = [ 300, 600, 1000 ];
  this.diff[d.PROJECTILE][t.SPEED] = [ 1, 2, 3 ];
  this.cost[d.PROJECTILE][t.COOLDOWN] = [ 300, 600, 1000 ];
  this.diff[d.PROJECTILE][t.COOLDOWN] = [ -5, -5, -5 ];
  this.cost[d.PROJECTILE][t.DAMAGE] = [ 300, 600, 1000 ];
  this.diff[d.PROJECTILE][t.DAMAGE] = [ 3, 5, 8 ];

  // Mine upgrades
  this.cost[d.MINE] = [];
  this.diff[d.MINE] = [];
  this.cost[d.MINE][t.RANGE] = [ 125 ];
  this.diff[d.MINE][t.RANGE] = [ 20 ];
  this.cost[d.MINE][t.DAMAGE] = [ 125 ];
  this.diff[d.MINE][t.DAMAGE] = [ 10 ];
  this.cost[d.MINE][t.ALLOWED] = [ 125, 125 ];
  this.diff[d.MINE][t.ALLOWED] = [ 1, 1 ];

  // Rocket upgrades
  this.cost[d.ROCKET] = [];
  this.diff[d.ROCKET] = [];
  this.cost[d.ROCKET][t.SPEED] = [ 125 ];
  this.diff[d.ROCKET][t.SPEED] = [ 10 ];
  this.cost[d.ROCKET][t.COOLDOWN] = [ 125 ];
  this.diff[d.ROCKET][t.COOLDOWN] = [ -19000 ];
  this.cost[d.ROCKET][t.RANGE] = [ 125 ];
  this.diff[d.ROCKET][t.RANGE] = [ 20 ];
  this.cost[d.ROCKET][t.DAMAGE] = [ 125 ];
  this.diff[d.ROCKET][t.DAMAGE] = [ 20 ];
  
  // EMP upgrades
  this.cost[d.EMP] = [];
  this.diff[d.EMP] = [];
  this.cost[d.EMP][t.COOLDOWN] = [ 125 ];
  this.diff[d.EMP][t.COOLDOWN] = [ -20 ];
  this.cost[d.EMP][t.RANGE] = [ 125 ];
  this.diff[d.EMP][t.RANGE] = [ 20 ];
  this.cost[d.EMP][t.DAMAGE] = [ 125 ];
  this.diff[d.EMP][t.DAMAGE] = [ 20 ];

  // Medic upgrades
  this.cost[d.MEDIC] = [];
  this.diff[d.MEDIC] = [];
  this.cost[d.MEDIC][t.COOLDOWN] = [ 125 ];
  this.diff[d.MEDIC][t.COOLDOWN] = [ -20 ];
  this.cost[d.MEDIC][t.RANGE] = [ 125 ];
  this.diff[d.MEDIC][t.RANGE] = [ 20 ];
  this.cost[d.MEDIC][t.DAMAGE] = [ 125 ];
  this.diff[d.MEDIC][t.DAMAGE] = [ -20 ];

  // Shield upgrades
  this.cost[d.SHIELD] = [];
  this.diff[d.SHIELD] = [];
  this.cost[d.SHIELD][t.DURATION] = [ 125 ];
  this.diff[d.SHIELD][t.DURATION] = [ 120 ];
  this.cost[d.SHIELD][t.COOLDOWN] = [ 125 ];
  this.diff[d.SHIELD][t.COOLDOWN] = [ -30 ];

  // Bomb upgrade
  this.cost[d.BOMB] = [];
  this.diff[d.BOMB] = [];
  this.cost[d.BOMB][t.ALLOWED] = [ 5000 ];
  this.diff[d.BOMB][t.ALLOWED] = [ 1 ];

};

/**
 * Function used to attempt to buy an upgrade.
 * Buys upgrade if allowed
 * If player does not have enough money
 * or if player has maxed out that device and type,
 * nothing happens.
 * @param {Upgrade.Device} Device to upgade.
 * @param {Upgrade.Type} Type of upgrade to buy.
 * @param {int} The pid of player buying upgrade.
 */
Upgrade.prototype.buy = function(device, type, pid) {
  var isOK = false;
  var buyer = globals.players[pid];
  if (this.cost[device][type] === undefined) {
    console.log(buyer.name + ", that device can't upgrade that way");
    return isOK;
  }
  if (!this.players)
    this.players = [];
  if (!this.players[pid])
    this.players[pid] = [];
  if (!this.players[pid][device])
    this.players[pid][device] = [];
  if (this.players[pid][device][type] === undefined)
    this.players[pid][device][type] = -1;

  if (device === Upgrade.Device.BOMB) {
    var eligible = true;
    for ( var x in Upgrade.Device) {
      if ( this.diff[Upgrade.Device[x]][Upgrade.Type.ALLOWED][this.players[pid][Upgrade.Device[x]][Upgrade.Type.ALLOWED] + 1] !== undefined) {
        eligible = false;
        break;
      }
    }
    
    if (!eligible) {
      console.log(buyer.name + ", you must max out all other upgrades first.");
      return isOK;
    }
  } 
  var cost = this.cost[device][type][this.players[pid][device][type] + 1];
  if (cost === undefined) {
    console.log(buyer.name + ", you are maxed out on that upgrade");
    return isOK;
  } else if (cost > (buyer.totalScore - buyer.totalSpent)) {
    console.log(buyer.name + ", you don't have enough for that upgrade");
    return isOK;
  } 

  isOK = true;
  this.players[pid][device][type]++;
  console.log(buyer.name + " bought an upgrade level " + this.players[pid][device][type]);
  var diff = this.diff[device][type][this.players[pid][device][type]];
  buyer.totalSpent += this.cost[device][type][this.players[pid][device][type]];
  if (globals.diff) {
    if (!globals.diff.p)
      globals.diff.p = {};
    if (!globals.diff.p[buyer.playerID])
      globals.diff.p[buyer.playerID] = {};
    globals.diff.p[buyer.playerID].c = buyer.totalSpent;
  }

  if (device === Upgrade.Device.TANK) {
    if (type === Upgrade.Type.MAX_HP) {
      buyer.maxHealth += diff;
    } else if (type === Upgrade.Type.SPEED) {
      buyer.speed += diff;
    }
  } else if (device === Upgrade.Device.PROJECTILE) {
    if (type === Upgrade.Type.SPEED) {
      buyer.projectile[Projectile.Type.NORMAL].speed += diff;
    } else if (type === Upgrade.COOLDOWN) {
      buyer.projectile[Projectile.Type.NORMAL].coolDown += diff;
      buyer.projectile[Projectile.Type.NORMAL].lastFire = new Timer(buyer.projectile[Projectile.Type.NORMAL].coolDown);
    } else  if (type === Upgrade.Type.DAMAGE) {
      buyer.projectile[Projectile.Type.NORMAL].damage += diff;
    }
  } else if (device === Upgrade.Device.MINE) {
    if (type === Upgrade.Type.RANGE) {
      buyer.projectile[Projectile.Type.MINE].range += diff;
    } else if (type === Upgrade.Type.DAMAGE) {
      buyer.projectile[Projectile.Type.MINE].damage += diff;
    } else if (type === Upgrade.Type.ALLOWED) {
      buyer.projectile[Projectile.Type.MINE].allowed += diff;
    } 
  } else if (device === Upgrade.Device.ROCKET) {
    if (type === Upgrade.Type.SPEED) {
      buyer.projectile[Projectile.Type.ROCKET].speed += diff;
    } else if (type === Upgrade.Type.COOLDOWN) {
      buyer.projectile[Projectile.Type.ROCKET].coolDown += diff;
      buyer.projectile[Projectile.Type.ROCKET].lastFire = new Timer(buyer.projectile[Projectile.Type.ROCKET].coolDown);
    } else if (type === Upgrade.Type.RANGE) {
      buyer.projectile[Projectile.Type.ROCKET].range += diff;
    } else if (type === Upgrade.Type.DAMAGE) {
      buyer.projectile[Projectile.Type.ROCKET].damage += diff;
    }
  } else if (device === Upgrade.Device.EMP) {
    if (type === Upgrade.Type.COOLDOWN) {
      buyer.special[Player.SpecialType.EMP].coolDown += diff;
      buyer.special[Player.SpecialType.EMP].lastFire = new Timer(buyer.special[Player.SpecialType.EMP].coolDown);
    } else if (type === Upgrade.Type.RANGE) {
      buyer.special[Player.SpecialType.EMP].range += diff;
    } else if (type === Upgrade.Type.DAMAGE) {
      buyer.special[Player.SpecialType.EMP].damage += diff;
    }
  } else if (device === Upgrade.Device.MEDIC) {
    if (type === Upgrade.Type.COOLDOWN) {
      buyer.special[Player.SpecialType.MEDIC].coolDown += diff;
      buyer.special[Player.SpecialType.MEDIC].lastFire = new Timer(buyer.special[Player.SpecialType.MEDIC].coolDown);
    } else if (type === Upgrade.Type.RANGE) {
      buyer.special[Player.SpecialType.MEDIC].range += diff;
    } else if (type === Upgrade.Type.DAMAGE) {
      buyer.special[Player.SpecialType.MEDIC].damage += diff;
    }
  } else if (device === Upgrade.Device.SHIELD) {
    if (type === Upgrade.Type.DURATION) {
      buyer.special[Player.SpecialType.SHIELD].duration += diff;
    } else if (type === Upgrade.Type.COOLDOWN) {
      buyer.special[Player.SpecialType.SHIELD].coolDown += diff;
      buyer.special[Player.SpecialType.SHIELD].lastFire = new Timer(buyer.special[Player.SpecialType.SHIELD].coolDown);
    }
  } else if (device === Upgrade.Device.BOMB) {
    buyer.special[Player.SpecialType.BOMB].allowed++;
  }

  return isOK;
};
