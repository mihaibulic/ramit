
/**
 * @param xPos The x position the tank is drawn at.
 * @param yPos The y position the tank is drawn at.
 * @returns The position the turret should be drawn at.
 */
Tank.prototype.getTurretPos = function(xPos, yPos) {
	switch (this.direction) {
	case 0:
		return {x: xPos - 2, y: yPos - 7};
	case 1:
		return {x: xPos - 3.5, y: yPos - 3.5};
	case 2:
		return {x: xPos - 7, y: yPos - 2};
	case 3:
		return {x: xPos - 10.5, y: yPos - 3.5};
	case 4:
		return {x: xPos - 12, y: yPos - 7};
	case 5:
		return {x: xPos - 10.5, y: yPos - 10.5};
	case 6:
		return {x: xPos - 7, y: yPos - 12};
	case 7:
		return {x: xPos - 3.5, y: yPos - 10.5};
	default:
		return {x: 0, y: 0};
	}
};
