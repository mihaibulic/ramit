var router = require('./router');
var server = require('./server');

server.start(1337, router.route);

