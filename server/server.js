
var http = require('http');
var url = require('url');

function start(port, route)
{
    if(!port) port = 1337;

    function onRequest(request, response)
    {
        var path = url.parse(request.url).pathname;
        console.log('request received for ' + path);

        route(path);

        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write('Hello World\n');
        response.end();
    }

    http.createServer(onRequest).listen(port); 
    console.log('Server running. Listening on port ' + port);
}

exports.start = start;
