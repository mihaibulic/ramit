var fade = function(node) {
	var level = 1;
	var step = function ( ) {
		var hex = level.toString(16);
		var up = true;
		node.style.backgroundColor = '#FFFF' + hex + hex;
		if (level < 15 && up) {
			level += 1;
			print('up');
		}
		else if (level === 15) {
			up = false;
			print('turn down');
		}
		else if (!up && level > 0) {
			level -= 1;
			print('down');
		}
		else if (level == 0) {
			up = true;
			print('turn up');
		}
		setTimeout(step, 100);
	};
	setTimeout(step, 100);
};

fade(document.body);

var print = function(message) {
	document.writeln(message);
}

print('Hello, world!');
print("line\nother line");

