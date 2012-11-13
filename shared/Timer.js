/**
 * A timer is able to let you know when a certain amount of time has elapsed
 * @param {Number} length of this timer, in milliseconds
 * @param {Boolean} true if the timer should be started right away, 
 *    if null or omitted, timer is started (default = true)
 */
var Timer = function(millis, start) {
  this.length = millis;

  if(start === undefined || start)
    this.start();
};


/**
 * Returns true if the timer is expired.  If timer hasn't been started
 *  it returns false
 * @returns true if timer is done, false otherwise (including if not
 *  started)
 */
Time.prototype.isExpired = function() {
  return (this.end !== undefined && (new Date()).getTime() >= this.end); 
};

/**
 * @returns true if the timer has been started
 */
Time.prototype.isStarted = function() {
  return this.end !== undefined;
};

/**
 * @returns {Number} how many millis are left (negative if timer is done).
 *  If timer hasn't been started undefined will be returned
 */
Time.prototype.timeToExpiration = function() {
  if (this.end === undefined)
    return this.end;
  else
    return this.end - (new Date()).getTime();
};

/**
 * Starts the timer
 */
Time.prototype.start = function() {
  this.start = (new Date()).getTime();
  this.end = this.start + this.length; 
};

/**
 * Stops the timer.  It can be restarted with start.  The timer
 *   will not reset, but it will pause. IE:
 *
 *   if the timer was set to 1000ms and finish at 1:00:00pm, but stop
 *    is called and 5000ms elapse before start is called again, the
 *    timer will end at 1:00:05pm now.
 */
Time.prototype.stop = function() {
  this.length = this.timeToExpiration();
  this.end = undefined;
};

