#!/bin/bash

cd $HOME/ramit

cat client/*.js shared/*.js > ramit_client.js
cat server/*.js shared/*.js > ramit_server.js
