var fade = function(node) {
	var level = 1;
	var up = true;
	var step = function ( ) {
		//print(level);
		var hex = level.toString(16);
		node.style.backgroundColor = '#FFFF' + hex + hex;
		if (up) {
			level++;
		} else {
			level--;
		}
		if (level >= 15) {
			up = false;
			//print("turn down");
		}
		if (level <= 0) {
			up = true;
		}
	};
	setInterval(step, 100);
};

fade(document.body);

var print = function(message) {
	document.writeln(message);
}
