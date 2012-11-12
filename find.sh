#!/bin/bash

if [ $# -eq 0 ]; then
  echo "Run this script with one argument in quotes. It will scan all JS files and look for that string (regexp is accepted)";
  exit -1;
fi

find . -name '*.js' | xargs grep --color -e "${1}"

