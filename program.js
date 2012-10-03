var fade = function(node) {
	var level = 1;
	var step = function ( ) {
		var hex = level.toString(16);
		node.style.backgroundColor = '#FFFF' + hex + hex;
		if (level < 15) {
			level += 1;
			setTimeout(step, 100);
		}
	};
	setTimeout(step, 100);
};
fade(document.body);

var print = function(message) {
	document.writeln(message);
}

print('Hello, world!');
print("line\nother line");

