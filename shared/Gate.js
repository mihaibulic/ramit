/**
 * A Gate protecting the player's HQ or the HQ itslef.
 * @param {Number} team The team number for the gate.
 */
var Gate = function(team, hq) {
  this.hq = hq;
  this.team = team;
  this.underAttack = 0;
  this.detailsFadeFrames = 0;
  this.health = 1000;
  if (this.hq) {
    this.name = (team === 0 ? "Blue HQ" : "Red HQ");
    this.left = 2500;
    this.right = 2600;
    this.top = (team === 0 ? 300 : 2600);
    this.bottom = (team === 0 ? 400 : 2700);
  } else {
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
 * @param {Number} The owner of projectile causing damage.
 * @returns {Number} The number of points earned for the hit.
 */
Gate.prototype.takeHit = function(damage, ownerTeam) {
  this.health -= damage;
  if (this.health < 0) this.health = 0;
  if (this.hq && this.health === 0) {
    //game over
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

  if (this.team === ownerTeam)
    return -1 * damage;
  return 0;
};

Gate.prototype.updateHealth = function(health) {
  if (health !== this.health)
    this.underAttack = 600;
  this.health = health;
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
  var box = this.getCollisionBarrier();
  var xPos = this.left - globals.level.x;
  var yPos = this.top - globals.level.y - 5;
  var width = box.width();
  var height = box.height();
  console.log(xPos + ", " + yPos);

  if (xPos > -1 * width && xPos < width + 1000 && yPos > -1 * height && yPos < height + 500) {
    if (this.health > 0) {
      if (!this.hq) {
        globals.ctx.globalAlpha = this.health / 100;
        globals.ctx.drawImage(globals.resources.gates[this.team], xPos, yPos);
        globals.ctx.globalAlpha = 1;
      } else {
        globals.ctx.fillStyle = Player.TEAM_COLOR[this.team];
        globals.ctx.fillRect(xPos, yPos, box.width(), box.height());
      }

      if (globals.queries.debug === "true" || this.isUnderAttack()) {
        // Fade In/Out
        var alpha = this.detailsFadeFrames / 20;

        // health bar
        globals.ctx.strokeStyle = "#00FF00";
        var color = Math.floor(this.health / 1000 * Player.HEALTH.length);
        if (color == Player.HEALTH.length) color--;
        globals.ctx.fillStyle = Player.HEALTH[color];
        globals.ctx.globalAlpha = 0.5 * alpha;
        globals.ctx.strokeRect(xPos + 100, yPos-2, 100, 3);
        globals.ctx.fillRect(xPos + 100, yPos-2, 100 * this.health / 1000, 3);
        globals.ctx.globalAlpha = alpha;
        // name
        globals.ctx.fillStyle = "#FFFFFF";
        globals.ctx.font = "10px sans-serif";
        globals.ctx.fillText(this.name, 1450-globals.level.x, yPos - 3);
        globals.ctx.globalAlpha = 1;
      }
    }
    if (!this.hq) //draw gate outside things
      globals.ctx.drawImage(globals.resources.gates[2], xPos, yPos);
  }
  if (globals.queries.debug === "true") {
    globals.ctx.strokeStyle = Player.TEAM_COLOR[this.team];
    var rect = this.getCollisionBarrier();
    globals.ctx.strokeRect(xPos, yPos + (!this.hq ? 5 : 0), rect.width(), rect.height());
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
