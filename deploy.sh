#!/bin/bash

sudo service node stop

# used to cd to the dir where this script is stored
cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cat shared/*.js client/*.js > ramit_client.js
cat shared/*.js server/*.js > ramit_server.js

sudo service node start

