#!/bin/bash

scp -i misquares.pem ec2-user@ec2-184-72-242-128.compute-1.amazonaws.com:/tmp/node.log .

echo -e "*****************************************************************";
if [ $? -eq 0 ]; then
  tail -$1 node.log
else
  tail -20 node.log
fi
echo -e "*****************************************************************";
