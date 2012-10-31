#!/bin/bash

DEF_REMOTE="github";
DEF_BRANCH="master";

if [ $# -ne 0 ] && [ $# -ne 1 ] && [ $# -ne 2 ]
then
  echo "Error: use no args to push to the ${DEF_REMOTE} remote and ${DEF_BRANCH} branch OR enter just the branch name OR enter the remote followed by branch to use.";
  echo "e.g.: $0 ${DEF_REMOTE} ${DEF_BRANCH}";
  echo "e.g.: $0 ${DEF_BRANCH}";
  echo "e.g.: $0";
  exit
fi

if [ $# -eq 0 ] 
then
  remote="${DEF_REMOTE}";
  branch="${DEF_BRANCH}";
elif [ $# -eq 1 ]
then
  remote="${DEF_REMOTE}";
  branch="${1}";
else
  remote="${1}";
  branch="${2}";
fi

yes | ssh -i misquares.pem ec2-user@ec2-184-72-242-128.compute-1.amazonaws.com 'cd /var/lib/tomcat6/webapps/ROOT/ramit && git pull ${remote} ${branch} &&./deploy.sh'


