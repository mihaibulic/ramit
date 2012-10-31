#!/bin/bash

# used to cd to the dir where this script is stored
cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cat client/*.js shared/*.js > ramit_client.js
cat shared/*.js server/*.js > ramit_server.js
