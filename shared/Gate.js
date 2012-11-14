/**
 * A Gate protecting the player's HQ or the HQ itslef.
 * @param {Number} team The team number for the gate.
 */
var Gate = function(team, hq) {
  this.hq = hq;
  this.team = team;
  this.underAttack = 0;
  this.detailsFadeFrames = 0;
  this.lastFlashCounter = 0;
  this.health = 100; //1000;
  if (this.hq) {
    this.name = (team === 0 ? "Blue HQ" : "Red HQ");
    this.left = 2500;
    this.right = 2650;
    this.top = (team === 0 ? 250 : 2600);
    this.bottom = (team === 0 ? 400 : 2750);
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

  if (this.team === ownerTeam)
    return -1 * damage;
  return 0;
};

Gate.prototype.updateHealth = function(health) {
  if (health !== this.health) {
    if (health === 0) {
      globals.messages.push((this.team === 0 ? "Blue" : "Red") + " Team's " + (this.hq ? "HQ" : "Gate") + " has been destroyed");
    } else if (!this.isUnderAttack()) {
      globals.messages.push((this.team === 0 ? "Blue" : "Red") + " Team's " + (this.hq ? "HQ" : "Gate") + " is under attack");
    }
    this.underAttack = 600;
    this.health = health;
  }
};

/*
 *  <100, 100(50,10), 90(45,15), 80(40,20), 70(35,25), 60(30,30) 50(25,35) 40(20,40), 30(15,45) 20(10, 50) 10(5,55) 0(0,60) 
 *  *  ---------------.------------..---------...-----....---.....--......-..................  *  1
 *
 *  if(health < 100 && underattack)
 *    if(health/2 < lastflash)
 *      flash;
 *
 */



Gate.prototype.update = function() {
  if(this.hq && this.underAttack > 0 && this.health < 100) {
    this.lastFlashCounter++;
    if (this.lastFlashCounter >= this.health/2) 
      this.lastFlashCounter = this.health/2 - 60;
  }

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

      var flash = this.hq && this.underAttack > 0 && this.health < 100 && this.lastFlashCounter < 0;
      var res = (this.hq ? globals.resources.hqs : globals.resources.gates);
      globals.ctx.globalAlpha = this.health / 100; //fades away for the last 100 hp
      globals.ctx.drawImage(res[this.team + (flash ? 2 : 0)], pos.left, pos.top - 5);
      globals.ctx.globalAlpha = 1;
      
      if (globals.queries.debug === "true" || this.isUnderAttack()) {
        // Fade In/Out
        var alpha = this.detailsFadeFrames / 20;

        var dataXPos = pos.left + (this.hq ? 0 : 100);
        // health bar
        globals.ctx.strokeStyle = "#00FF00";
        var color = Math.floor(this.health / 1000 * Player.HEALTH.length);
        if (color == Player.HEALTH.length) color--;
        globals.ctx.fillStyle = Player.HEALTH[color];
        globals.ctx.globalAlpha = 0.5 * alpha;
        globals.ctx.strokeRect(dataXPos, pos.top-2, 100, 3);
        globals.ctx.fillRect(dataXPos, pos.top-2, 100 * this.health / 1000, 3);
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
