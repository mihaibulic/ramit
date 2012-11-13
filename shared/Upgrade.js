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
  GATE: 7,
  HQ: 8
};

// the types of upgrades possible.
// not all devices may receive all types of upgrades.
Upgrade.Type = {
  MAX_HP: 0,
  DEFENSE: 1,
  SPEED: 2,
  COOLDOWN: 3,
  RANGE: 4,
  DAMAGE: 5,
  ALLOWED: 6,
  DURATION: 7,
  HEALTH: 8,
  REWARD: 9
};

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
  this.diff[d.PROJECTILE][t.COOLDOWN] = [  ];
  this.cost[d.PROJECTILE][t.RANGE] = [  ];
  this.diff[d.PROJECTILE][t.RANGE] = [  ];
  this.cost[d.PROJECTILE][t.DAMAGE] = [  ];
  this.diff[d.PROJECTILE][t.DAMAGE] = [  ];

  // Mine upgrades
  this.cost[d.MINE] = [];
  this.diff[d.MINE] = [];
  this.cost[d.MINE][t.RANGE] = [  ];
  this.diff[d.MINE][t.RANGE] = [  ];
  this.cost[d.MINE][t.DAMAGE] = [  ];
  this.diff[d.MINE][t.DAMAGE] = [  ];
  this.cost[d.MINE][t.ALLOWED] = [  ];
  this.diff[d.MINE][t.ALLOWED] = [  ];

  // Rocket upgrades
  this.cost[d.ROCKET] = [];
  this.diff[d.ROCKET] = [];
  this.cost[d.ROCKET][t.SPEED] = [  ];
  this.diff[d.ROCKET][t.SPEED] = [  ];
  this.cost[d.ROCKET][t.COOLDOWN] = [  ];
  this.diff[d.ROCKET][t.COOLDOWN] = [  ];
  this.cost[d.ROCKET][t.RANGE] = [  ];
  this.diff[d.ROCKET][t.RANGE] = [  ];
  this.cost[d.ROCKET][t.DAMAGE] = [  ];
  this.diff[d.ROCKET][t.DAMAGE] = [  ];
  
  // EMP upgrades
  this.cost[d.EMP] = [];
  this.diff[d.EMP] = [];
  this.cost[d.EMP][t.COOLDOWN] = [  ];
  this.diff[d.EMP][t.COOLDOWN] = [  ];
  this.cost[d.EMP][t.RANGE] = [  ];
  this.diff[d.EMP][t.RANGE] = [  ];
  this.cost[d.EMP][t.DAMAGE] = [  ];
  this.diff[d.EMP][t.DAMAGE] = [  ];

  // Medic upgrades
  this.cost[d.MEDIC] = [];
  this.diff[d.MEDIC] = [];
  this.cost[d.MEDIC][t.COOLDOWN] = [  ];
  this.diff[d.MEDIC][t.COOLDOWN] = [  ];
  this.cost[d.MEDIC][t.RANGE] = [  ];
  this.diff[d.MEDIC][t.RANGE] = [  ];
  this.cost[d.MEDIC][t.DAMAGE] = [  ];
  this.diff[d.MEDIC][t.DAMAGE] = [  ];

  // Shield upgrades
  this.cost[d.SHIELD] = [];
  this.diff[d.SHIELD] = [];
  this.cost[d.SHIELD][t.DURATION] = [  ];
  this.diff[d.SHIELD][t.DURATION] = [  ];
  this.cost[d.SHIELD][t.COOLDOWN] = [  ];
  this.diff[d.SHIELD][t.COOLDOWN] = [  ];

  // Gate upgrades
  this.cost[d.GATE] = [];
  this.diff[d.GATE] = [];
  this.cost[d.GATE][t.HEALTH] = [  ];
  this.diff[d.GATE][t.HEALTH] = [  ];

  // HQ upgrades
  this.cost[d.HQ] = [];
  this.diff[d.HQ] = [];
  this.cost[d.HQ][t.HEALTH] = [  ];
  this.diff[d.HQ][t.HEALTH] = [  ];
};
