/**
 * Draws a rounded rectangle using the current state of the canvas. 
 * If you omit the last three params, it will draw a rectangle 
 * outline with a 5 pixel border radius 
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate 
 * @param {Number} width The width of the rectangle 
 * @param {Number} height The height of the rectangle
 * @param {Number} radius The corner radius. Defaults to 5;
 */
function drawRoundRect(ctx, x, y, width, height, radius) {
  if (typeof radius === "undefined") {
    radius = 5;
  }
  
  ctx.beginPath();
  if (width > radius && height > radius) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }
  ctx.closePath();
}


/**
 * Returns the size of a message in bytes
 */
function getMessageSize (message) {
  if (message === undefined) return 0;
  var msg = JSON.stringify( message );
  if (msg === undefined) return 0;
  var sizeInBytes = msg.split('').map(function( ch ) {
    return ch.charCodeAt(0);
  }).map(function( uchar ) {
      return uchar < 128 ? 1 : 2;
    }).reduce(function( curr, next ) {
        return curr + next;
      });

  return sizeInBytes;
}
