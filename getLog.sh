#!/bin/bash

scp -i misquares.pem ec2-user@ec2-184-72-242-128.compute-1.amazonaws.com:/tmp/node.log .
vim + node.log
