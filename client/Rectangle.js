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
 * Returns true if the rectangle intersects with another.
 * @param rect The other rectangle to check.
 * @returns true if the rectangles are intersecting.
 */
Rectangle.prototype.intersects = function(rect) {
	return !(rect.left > this.right ||
			rect.right < this.left || 
      rect.top > this.bottom ||
      rect.bottom < this.top);
};
