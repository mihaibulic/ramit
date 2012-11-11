#!/bin/bash

if [[ "$(cat /etc/*-release)" == *"Amazon"* ]]; then
  sudo service node stop;
  sudo service node start;
else
  yes | ssh -i misquares.pem ec2-user@ec2-184-72-242-128.compute-1.amazonaws.com 'sudo service node stop; sudo service node start;' 
fi



