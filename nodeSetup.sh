set -e
#!/bin/bash

VERSION='v0.8.12'

cd $HOME

sudo apt-get install git
git clone git://github.com/joyent/node.git
cd node
git checkout $VERSION
git branch $VERSION
git checkout $VERSION
./configure
make
sudo make install

cd $HOME

git clone https://github.com/isaacs/npm.git
cd npm
sudo make install

sudo npm install socket.io

echo "Node.js, the Node Package Manager (npm), and the socket io package have been installed.";
echo "A basic web server is available along side this script called helloworldServer.js.";
echo "To run this server run this command: node /path/to/file/helloworldServer.js";
echo "To test this hello world server open your browser and go to: localhost:1337";

