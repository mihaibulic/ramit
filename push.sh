#!/bin/bash

ssh ec2-user@ec2-184-72-242-128.compute-1.amazonaws.com 'cd /var/lib/tomcat6/webapps/ROOT/ramit && git pull github master'


