/**
 * A timer is able to let you know when a certain amount of time has elapsed
 * @param {Number} millis - length of this timer, in milliseconds
 * @param {Boolean} opt_start_done - if true, the timer will have no time left at instantiation
 * @param {Boolean} opt_state - true if the timer should be started right away, 
 *    if null or omitted, timer is started (default = true)
 */
var Timer = function(millis, opt_start_done, opt_start) {
  this.originalLength = this.length = millis;

  if(opt_start_done !== undefined && opt_start_done)
    this.length = 0;

  if(opt_start === undefined || opt_start)
    this.start();
};

/**
 * Returns true if the timer is expired.  If timer hasn't been started
 *  it returns false
 * @returns true if timer is done, false otherwise (including if not
 *  started)
 */
Timer.prototype.isDone = function() {
  return (this.length <= 0 || (new Date()).getTime() >= this.e); 
};

/**
 * @returns true if the timer has been started
 */
Timer.prototype.isStarted = function() {
  return this.e !== undefined;
};

/**
 * @returns {Number} how many millis are left (negative if timer is done).
 *  If timer hasn't been started undefined will be returned
 */
Timer.prototype.timeLeft = function() {
  return (this.e === undefined) ? this.length : (this.e - (new Date()).getTime());
};

/**
 * Starts the timer
 */
Timer.prototype.start = function() {
  this.s = (new Date()).getTime();
  this.e = this.s + this.length; 
};

/**
 * Stops the timer.  It can be restarted with start.  The timer
 *   will not reset, but it will pause. IE:
 *
 *   if the timer was set to 1000ms and finish at 1:00:00pm, but stop
 *    is called and 5000ms elapse before start is called again, the
 *    timer will end at 1:00:05pm now.
 */
Timer.prototype.stop = function() {
  this.length = this.timeLeft();
  this.e = undefined;
};

/**
 * Convinience function
 */
Timer.prototype.reset = function() {
  this.length = this.originalLength;
  this.start();
};

