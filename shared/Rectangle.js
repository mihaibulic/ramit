/**
 * A rectangle.
 */
var Rectangle = function(box) {
    this.left = 0;
    this.right = 0;
    this.top = 0;
    this.bottom = 0;
    if (box) {
        this.left = box.left;
        this.right = box.right;
        this.top = box.top;
        this.bottom = box.bottom;
    }
};

/**
 * @param rect The other rectangle to check.
 * @returns {Boolean} true if the rectangles are intersecting.
 */
Rectangle.prototype.intersects = function(rect) {
    return (this.left <= rect.right &&
      rect.left <= this.right &&
      this.top <= rect.bottom &&
      rect.top <= this.bottom);
};

/**
 * @returns {Number} The height of the rectangle.
 */
Rectangle.prototype.width = function() {
    return this.right - this.left;
};

/**
 * @returns {Number} The height of the rectangle.
 */
Rectangle.prototype.height = function() {
    return this.bottom - this.top;
};

/**
 * Calculates the X distance between two rectangles. The rectangles should not
 * be intersecting.
 * @param {Rectangle} rect The rectangle to check.
 * @returns {Number} The X distance between this rectangle and the other.
 */
Rectangle.prototype.getXDistance = function(rect) {
    return Math.min(Math.abs(this.left - rect.right),
            Math.abs(rect.left - this.right));
};

/**
 * Calculates the Y distance between two rectangles. The rectangles should not
 * be intersecting.
 * @param {Rectangle} rect The rectangle to check.
 * @returns {Number} The Y distance between this rectangle and the other.
 */
Rectangle.prototype.getYDistance = function(rect) {
    return Math.min(Math.abs(this.top - rect.bottom),
            Math.abs(rect.top - this.bottom));
};
