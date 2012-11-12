/**
 * A Gate protecting the player's base.
 * @param {Number} team The team number for the gate.
 */
var Gate = function(team, hq) {
  this.hq = Boolean(hq);
  this.lastAttack = 1000;
  if (this.hq) {
    this.name = (team === 0 ? "Blue HQ" : "Red HQ");
    this.left = 2500;
    this.right = 2600;
    this.top = (team === 0 ? 300 : 2600);
    this.bottom = (team === 0 ? 400 : 2700);
  } else {
    this.name = (team === 0 ? "Blue Gate" : "Red Gate");
    this.health = 1000;
    this.team = team;
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
    if (!globals.diff.b)
      globals.diff.b = {};
    globals.diff.b[this.team] = this.health;
  }

  if (this.team === ownerTeam)
    return -1 * damage;
  return 0;
};

Gate.prototype.updateHealth = function(health) {
  if (health !== this.health)
    this.lastAttack = 0;
  this.health = health;
};

Gate.prototype.update = function() {
  if (this.lastAttack < 5 * 60) this.lastAttack++;
};

Gate.prototype.isUnderAttack = function() {
  return (this.lastAttack < 5 * 60);
};

/**
 * Draws the gate.
 */
Gate.prototype.draw = function() {
  var box = this.getCollisionBarrier();
  var xPos = this.left - globals.level.x;
  var yPos = this.top - globals.level.y - 5;

  if (xPos > -300 && xPos < 1000 && yPos > -20 && yPos < 500) {
    if (this.health > 0) {
      if (!this.hq) {
        globals.ctx.globalAlpha = this.health / 100;
        globals.ctx.drawImage(globals.resources.gates[this.team], xPos, yPos);
        globals.ctx.globalAlpha = 1;
      } else {
        globals.ctx.fillStyle = Player.TEAM_COLOR[this.team];
        globals.ctx.fillRect(xPos, yPos, box.width(), bow.height());
      }

      if (globals.queries.debug === "true" || this.isUnderAttack()) {
        // health bar
        globals.ctx.strokeStyle = "#00FF00";
        var color = Math.floor(this.health / 1000 * Player.HEALTH.length);
        if (color == Player.HEALTH.length) color--;
        globals.ctx.fillStyle = Player.HEALTH[color];
        globals.ctx.globalAlpha = 0.5;
        globals.ctx.strokeRect(1450-globals.level.x, yPos-2, 100, 3);
        globals.ctx.fillRect(1450-globals.level.x, yPos-2, 100 * this.health / 1000, 3);
        globals.ctx.globalAlpha = 1;
         //name
        globals.ctx.fillStyle = "#FFFFFF";
        globals.ctx.font = "10px sans-serif";
        globals.ctx.fillText(this.name, 1450-globals.level.x, yPos - 3);
      }
    }
    globals.ctx.drawImage(globals.resources.gates[2], xPos, yPos);

 }

  if (globals.queries.debug === "true") {
    globals.ctx.strokeStyle = Player.TEAM_COLOR[this.team];
    var rect = this.getCollisionBarrier();
    globals.ctx.strokeRect(rect.left - globals.level.x, rect.top - globals.level.y, rect.width(),
                           rect.height());
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
