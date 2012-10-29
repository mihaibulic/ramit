#!/bin/bash

# set up haproxy folder and service
sudo mkdir -p /etc/haproxy
sudo cp ./haproxy.cfg /etc/haproxy/.
sudo cp ./haproxy /etc/init.id/.
sudo chkconfig --add haproxy

cd /etc/haproxy

# install haproxy
sudo wget http://haproxy.1wt.eu/download/1.4/src/haproxy-1.4.22.tar.gz
sudo tar -zvxf haproxy-1.4.22.tar.gz
cd haproxy-1.4.22
sudo make
sudo cp haproxy /usr/sbin/haproxy

