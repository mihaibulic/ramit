/**
 * A Gate protecting the player's HQ or the HQ itslef.
 * @param {Number} team The team number for the gate.
 */
var Gate = function(team, hq) {
  this.hq = hq;
  this.team = team;
  this.underAttack = 0;
  this.detailsFadeFrames = 0;
  if (this.hq) {
    this.health = 3000;
    this.maxHealth = 3000;
    this.name = (team === 0 ? "Blue HQ" : "Red HQ");
    this.left = 2500;
    this.right = 2650;
    this.top = (team === 0 ? 250 : 2600);
    this.bottom = (team === 0 ? 400 : 2750);
  } else {
    this.health = 1000;
    this.maxHealth = 1000;
    this.name = (team === 0 ? "Blue Gate" : "Red Gate");
    this.left = 1350;
    this.right = 1650;
    if (team === 0) {
      this.top = 493;
      this.bottom = 508;
    } else {
      this.top = 2492;
      this.bottom = 2507;
    }
  }
};

/**
 * Damage the gate.
 * @param {Number} The amount of damage the gate receives.
 * @param {Player} The owner of projectile causing damage.
 * @returns {Number} The number of points earned for the hit.
 */
Gate.prototype.takeHit = function(damage, owner) {
  this.health -= damage;
  if (this.health < 0) this.health = 0;
  if (this.hq && this.health === 0) {
    globals.level.mode = globals.diff.m = Level.Mode.END;
  }

  if (globals.diff) {
    if (this.hq) {
      if (!globals.diff.h)
        globals.diff.h = {};
      globals.diff.h[this.team] = this.health;
    }
    else {
      if (!globals.diff.g)
        globals.diff.g = {};
      globals.diff.g[this.team] = this.health;
    }
  }

  if (this.team === owner.team)
    return -1 * damage;
  return 0;
};

Gate.prototype.updateHealth = function(health, team, printMessages) {
  if (health !== this.health) {
    if (printMessages && health === 0) {
      var message;
      if (this.team === team)
        message = "Your ";
      else
        message = "The enemey ";
      globals.messages.push(message + (this.hq ? "HQ" : "Gate") + " has been destroyed!");
    } else if (printMessages && !this.isUnderAttack() && this.team === team) {
      globals.messages.push("Your " + (this.hq ? "HQ" : "Gate") + " is under attack!");
    }
    this.underAttack = 600;
    this.health = health;
  }
};

Gate.prototype.update = function() {
  if (this.underAttack > 0) this.underAttack--;
  // Fade In/Out
  if (this.underAttack < 20 && this.detailsFadeFrames > 0)
    this.detailsFadeFrames--;
  else if (this.underAttack > 0 && this.detailsFadeFrames < 20)
    this.detailsFadeFrames++;
};

Gate.prototype.isUnderAttack = function() {
  return (this.underAttack > 0);
};

/**
 * Draws the gate.
 */
Gate.prototype.draw = function() {
  var pos = Rectangle.getPos(this);
  var width = this.right - this.left;
  var height = this.bottom - this.top;

  if (pos.draw) {
    if (this.health > 0) {

      if (this.hq && this.health < 100)
        globals.ctx.drawImage(globals.resources.hqs[this.team + 2], pos.left, pos.top);

      var res = this.hq ? globals.resources.hqs : globals.resources.gates;
      globals.ctx.drawImage(res[this.team], pos.left, pos.top - 5);

      if (globals.queries.debug === "true" || this.isUnderAttack()) {
        // Fade In/Out
        var alpha = this.detailsFadeFrames / 20;

        var dataXPos = pos.left + (this.hq ? 0 : 100);
        // health bar
        globals.ctx.strokeStyle = "#00FF00";
        var color = Math.floor(this.health / this.maxHealth * Player.HEALTH.length);
        if (color == Player.HEALTH.length) color--;
        globals.ctx.fillStyle = Player.HEALTH[color];
        globals.ctx.globalAlpha = 0.5 * alpha;
        globals.ctx.strokeRect(dataXPos, pos.top-2, 100, 3);
        globals.ctx.fillRect(dataXPos, pos.top-2, 100 * this.health / this.maxHealth, 3);
        globals.ctx.globalAlpha = alpha;
        // name
        globals.ctx.fillStyle = "#FFFFFF";
        globals.ctx.font = "10px sans-serif";
        globals.ctx.fillText(this.name, dataXPos, pos.top - 3);
        globals.ctx.globalAlpha = 1;
      }
      if (globals.queries.debug === "true") {
        globals.ctx.strokeStyle = Player.TEAM_COLOR[this.team];
        var rect = this.getCollisionBarrier();
        globals.ctx.strokeRect(pos.left, pos.top, rect.width(), rect.height());
      }
    }
    if (!this.hq) //draw gate outside things
      globals.ctx.drawImage(globals.resources.gates[2], pos.left, pos.top - 5);
  }
};

/**
 * @returns {Rectangle} A box describing the location of the gate.
 */
Gate.prototype.getCollisionBarrier = function() {
  if (this.health === 0)
    return new Rectangle();
  return new Rectangle(this);
};
