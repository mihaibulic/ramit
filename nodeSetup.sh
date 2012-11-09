#!/bin/bash

# install basic stuff
command -V apt-get &> /dev/null
if [[ $? -eq 0 ]]; then
  sudo apt-get update;
  sudo apt-get -y install git-core make vim emacs gcc curl libssl-dev apache2-utils;
else
  sudo yum update;
  sudo yum -y install git-core make vim emacs gcc-c++ curl libssl-dev apache2-utils;
fi

DIR=$(pwd)
cd $HOME

# install node
VERSION='v0.8.12'
git clone git://github.com/joyent/node.git
cd node
git checkout $VERSION
git branch $VERSION
git checkout $VERSION
./configure
make
sudo make install
sudo cp node /usr/sbin/.

cd $HOME

# install NPM
git clone https://github.com/isaacs/npm.git
cd npm
sudo make install
if [[ $? -eq 0 ]]; then
  echo -e "run sudo su and open /etc/sudoers. Then add /usr/local/bin to secure_path";
  exit 1;
fi

# install node pacakges
sudo npm install socket.io forever jshint -g
cd ${DIR}
ln -s $HOME/npm/node_modules

# this lets node find socket.io
cp node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.js ${DIR}

# auto start node
sudo cp ./node /etc/init.d/.
sudo chkconfig --add node

# setup haproxy
haproxy/haproxySetup.sh

echo -e "\n\n\n Node.js, the Node Package Manager (npm), and the socket io package have been installed.";
echo "A basic web server is available along side this script called helloworldServer.js.";
echo "To run this server run this command: node /path/to/file/helloworldServer.js";
echo "To test this hello world server open your browser and go to: localhost:1337";


