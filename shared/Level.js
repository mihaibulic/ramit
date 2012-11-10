var Level = function() {
  this.x = 0;
  this.y = 0;
  this.walls = [];
  this.gates = [ new Gate(0), new Gate(1) ];
  this.loadLevel();
};

/**
 * Loads the walls into the level.
 */
Level.prototype.loadLevel = function() {
  var walls = [{left:0, right: 3000, top:0, bottom:125},
               {left:0, right:125,top:0, bottom:3000},
               {left:2875, right:3000, top:0, bottom:3000},
               {left:0, right:3000, top:2875, bottom:3000},
               {left:0,right:1350,top:438,bottom:563},
               {left:1650,right:3000,top:438,bottom:563},
               {left:0,right:1350,top:2438,bottom:2563},
               {left:1650,right:3000,top:2438,bottom:2563},
               {left:350,right:650,top:825,bottom:875},
               {left:350,right:400,top:825,bottom:1125},
               {left:850,right:900,top:750,bottom:1050},
               {left:775,right:975,top:1050,bottom:1250},
               {left:525,right:1225,top:1125,bottom:1175},
               {left:1100,right:1900,top:825,bottom:875},
               {left:1450,right:1550,top:1100,bottom:1200},
               {left:2100,right:2150,top:750,bottom:1050},
               {left:2025,right:2225,top:1050,bottom:1250},
               {left:1775,right:2475,top:1125,bottom:1175},
               {left:2350,right:2650,top:825,bottom:875},
               {left:2600,right:2650,top:825,bottom:1125},
               {left:350,right:1150,top:1475,bottom:1525},
               {left:1400,right:1600,top:1400,bottom:1600},
               {left:1850,right:2650,top:1475,bottom:1525},
               {left:350,right:400,top:1875,bottom:2175},
               {left:350,right:650,top:2125,bottom:2175},
               {left:525,right:1225,top:1825,bottom:1875},
               {left:775,right:975,top:1750,bottom:1950},
               {left:850,right:900,top:1950,bottom:2250},
               {left:1450,right:1550,top:1800,bottom:1900},
               {left:1100,right:1900,top:2125,bottom:2175},
               {left:1775,right:2475,top:1825,bottom:1875},
               {left:2025,right:2225,top:1750,bottom:1950},
               {left:2100,right:2150,top:1950,bottom:2250},
               {left:2350,right:2650,top:2125,bottom:2175},
               {left:2600,right:2650,top:1875,bottom:2175}];
  for (var i = 0; i < walls.length; i++) {
    this.walls[i] = new Rectangle(walls[i]);
  }
};
