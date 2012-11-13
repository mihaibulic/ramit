#!/bin/bash

if [ $# -eq 0 ]; then
  echo "Run this script with one argument in quotes. It will scan all JS files and look for that string (regexp is accepted)";
  exit -1;
fi

find ./shared -name '*.js' | xargs grep --line-number --with-filename --color -e "${1}"
find ./client -name '*.js' | xargs grep --line-number --with-filename --color -e "${1}"
find ./server -name '*.js' | xargs grep --line-number --with-filename --color -e "${1}"

