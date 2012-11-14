/**
 * An object of global variables and functions for use throughout the program.
 */
var globals = {
  NUMBER_OF_PLAYERS: 2,
  rawImages: {
    level: new Image(),
    tanks: new Image(),
    gates: new Image(),
    hqs: new Image(),
    minimapfade: new Image()
  },
  resources: {
    level: null,
    tanks: null,
    turrets: null,
    gates: null,
    hqs: null,
    minimap: null,
    minimapfade: null
  },
  canvas: null,
  ctx: null,
  remainingResources: 0,
  projectiles: {},
  explosions: [],
  players: {},
  level: new Level(),
  messages: [],
  messageCounter: 120
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
 * An object containing the query strings.
 */
globals.queries = (function() {
  var result = {};
  var queryString = location.search.substring(1);
  var re = /([^&=]+)=([^&]*)/g;
  var m;

  while ((m = re.exec(queryString)) !== null) {
    result[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
  }

  return result;
})();

/**
 * Binds a function to an object.
 * @param fn The function to be bound.
 * @param context The 'this' object for the function.
 * @returns A function which calls fn in the correct context.
 */
globals.bind = function(fn, context) {
  return fn.bind(context);
};

/**
 * Load the raw images into memory. This looks at the field names of the
 * rawImages variable and begins loading them into memory. Images should be
 * located in the 'images' folder, be PNG files, and be named the same as the
 * field in rawImages that they are loaded into. (ex: rawImages.tanks loads the
 * file 'images/tanks.png')
 * @param callback A function that is called when the game is finished loading.
 */
globals.load = function(callback) {
  globals.resourceLoaded = function() {
    globals.remainingResources--;
    // Nothing else needs to be loaded. Call the callback.
    if (globals.remainingResources === 0 && Boolean(callback))
      callback();
  };

  var onload = function(e) {
    if (!e)
      e = window.event;

    var start = e.target.src.lastIndexOf("/") + 1;
    var end = e.target.src.lastIndexOf(".");
    var target = e.target.src.substring(start, end);

    // Perform any special tasks on the image if need be.
    if (target === "tanks")
      globals.renderTanks();
    else if (target === "level") {
      globals.renderLevelTiles();
      globals.renderMinimap();
    } else if (target === "hqs")
      globals.renderHqs();
    else if (target === "gates")
      globals.renderGates();
    else
      globals.resources[target] = globals.rawImages[target];

    globals.resourceLoaded();
  };

  for (var img in globals.rawImages) {
    if (globals.rawImages[img] instanceof Image) {
      ++globals.remainingResources;
      globals.rawImages[img].onload = onload;
      globals.rawImages[img].src = "images/" + img + ".png";
    }
  }
};

/**
 * Renders the headquarters into two separate images
 */
globals.renderHqs = function() {
  globals.remainingResources += 2;
  globals.resources.hqs = [];

  var renderer = document.getElementById('renderer');
  var ctx = renderer.getContext('2d');

  var positions = [[0, 0, 100, 100, 0, 0, 100, 100],
                   [100, 0, 100, 100, 100, 0, 100, 100]];
  var render = function(i) {
    renderer.width = 100;
    renderer.height = 100;
    ctx.clearRect(0, 0, 100, 100);
    ctx.drawImage(globals.rawImages.hqs, positions[i][0], positions[i][1],
                  positions[i][2], positions[i][3], positions[i][4],
                  positions[i][5], positions[i][6], positions[i][7]);

    var img = new Image();
    img.src = renderer.toDataURL();
    img.onload = function() {
      globals.resources.hqs[i] = img;
      globals.resourceLoaded();
    };
  };
  render(0);
  render(1);
};

/**
 * Renders the gates image into three separate images.
 */
globals.renderGates = function() {
  globals.remainingResources += 3;
  globals.resources.gates = [];

  var renderer = document.getElementById('renderer');
  var ctx = renderer.getContext('2d');

  var positions = [[0, 0, 300, 15, 0, 5, 300, 15],
                   [0, 15, 300, 15, 0, 5, 300, 15],
                   [300, 0, 6, 25, 0, 0, 6, 25],
                   [306, 0, 6, 25, 294, 0, 6, 25]];
  var render = function(i) {
    renderer.width = 300;
    renderer.height = 25;
    ctx.clearRect(0, 0, 300, 15);
    ctx.drawImage(globals.rawImages.gates, positions[i][0], positions[i][1],
                  positions[i][2], positions[i][3], positions[i][4],
                  positions[i][5], positions[i][6], positions[i][7]);
    if (i == 2) {
      ctx.drawImage(globals.rawImages.gates, positions[3][0],
                    positions[3][1], positions[3][2], positions[3][3],
                    positions[3][4], positions[3][5], positions[3][6],
                    positions[3][7]);
    }

    var img = new Image();
    img.src = renderer.toDataURL();
    img.onload = function() {
      globals.resources.gates[i] = img;
      globals.resourceLoaded();
      if (i < 2)
        render(i + 1);
    };
  };
  render(0);
};

/**
 * Renders the level image into 1000x1000 pixel tiles so that it can drawn more
 * quickly.
 */
globals.renderLevelTiles = function() {
  var width = Math.ceil(globals.rawImages.level.width / 1000);
  var height = Math.ceil(globals.rawImages.level.height / 1000);
  globals.remainingResources += width * height;
  globals.resources.level = [];

  var renderer = document.getElementById('renderer');
  var ctx = renderer.getContext('2d');

  // Renders a level tile.
  var render = function(i, j) {
    renderer.width = 1000;
    renderer.height = 1000;
    ctx.drawImage(globals.rawImages.level, i * 1000, j * 1000, 1000, 1000, 0,
                  0, 1000, 1000);
    var img = new Image();
    img.src = renderer.toDataURL();
    img.onload = function() {
      if (!globals.resources.level[i])
        globals.resources.level[i] = [];
      globals.resources.level[i][j] = img;
      globals.resourceLoaded();
      if (++i >= 3) {
        i = 0;
        ++j;
      }
      if (j < 3)
        render(i, j);
    };
  };

  render(0, 0);
};

/**
 * Renders the minimap's image.
 */
globals.renderMinimap = function()
{
  // We're loading one more image.
  globals.remainingResources += 1;
  var renderer = document.getElementById('renderer');
  var ctx = renderer.getContext('2d');
  renderer.width = 150;
  renderer.height = 150;

  ctx.globalAlpha = 0.5;
  ctx.drawImage(globals.rawImages.level, 0, 0, 3000, 3000,
                0, 0, 150, 150);
  ctx.globalAlpha = 1;

  var img = new Image();
  img.src = renderer.toDataURL();
  img.onload = function() {
    globals.resources.minimap = img;
    globals.resourceLoaded();
  };
};

/**
 * Renders the tank images from the raw image. Each tank is rendered into 8
 * images, one for each direction. Each turret is rendered into 180 images,
 * each separated by 2 degrees of rotation.
 */
globals.renderTanks = function()
{
  globals.remainingResources += (globals.NUMBER_OF_PLAYERS+1) * 188;
  var renderer = document.getElementById('renderer');
  var ctx = renderer.getContext('2d');
  var i = 0;
  globals.resources.tanks = [];
  globals.resources.turrets = [];

  // Render the tank rotation images.
  var renderTank = function(num) {
    renderer.width = 60;
    renderer.height = 60;
    ctx.clearRect(0, 0, 60, 60);
    ctx.save();
    ctx.translate(30, 30);
    ctx.rotate(45 * i * Math.PI / 180);
    ctx.drawImage(globals.rawImages.tanks, num * 42, 0, 40, 40, -20, -20, 40,
                  40);
    ctx.restore();
    var img = new Image();
    img.src = renderer.toDataURL();
    img.onload = function() {
      if (!globals.resources.tanks[num])
        globals.resources.tanks[num] = [];
      globals.resources.tanks[num].push(img);
      globals.resourceLoaded();
      if (++i < 8) {
        renderTank(num);
      } else {
        i = 0;
        renderTurret(num);
      }
    };
  };
  // Renders the turret rotation images.
  var renderTurret = function(num) {
    renderer.width = 74;
    renderer.height = 74;
    ctx.clearRect(0, 0, 74, 74);
    ctx.save();
    ctx.translate(37, 37);
    ctx.rotate(i * 2 * Math.PI / 180);
    ctx.drawImage(globals.rawImages.tanks, num * 42, 40, 42, 22, -10, -11, 42,
                  22);
    ctx.restore();
    var img = new Image();
    img.src = renderer.toDataURL();
    img.onload = function() {
      if (!globals.resources.turrets[num])
        globals.resources.turrets[num] = [];
      globals.resources.turrets[num].push(img);
      globals.resourceLoaded();
      if (++i < 180) {
        renderTurret(num);
      } else if (++num < globals.NUMBER_OF_PLAYERS + 1) {
        i = 0;
        renderTank(num);
      }
    };
  };

  renderTank(0);
};

/**
 * Initialize the state and begin.
 */
window.onload = function() {
  globals.canvas = document.getElementById('cnv');
  globals.ctx = globals.canvas.getContext('2d');
  globals.load(function() {
    globals.game = new ITGame(0,0);
  });
};
