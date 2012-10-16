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
