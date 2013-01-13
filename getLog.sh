#!/bin/bash

scp -i misquares.pem ec2-user@ec2-184-72-242-128.compute-1.amazonaws.com:/tmp/ramit_node.log node.log 

echo "*****************************************************************";
if [ $? -eq 1 ]; then
  tail -$1 node.log
else
  tail -20 node.log
fi
echo "*****************************************************************";
