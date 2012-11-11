#!/bin/bash
set -e

function push {
  echo "git add --all"
  git add --all
    
  echo "git commit --allow-empty -a -m <msg>"
  git commit --allow-empty -a -m "${msg}"
    
  echo "git fetch"
  git fetch ${remote} 
  echo "git merge"
  git merge ${remote}/${branch}
  echo "git push"
  git push ${remote} ${branch}

  echo "cats meow"
  cat shared/*.js client/*.js > ramit_client.js
  cat shared/*.js server/*.js > ramit_server.js

  echo "ssh"
  yes | ssh -i misquares.pem ec2-user@ec2-184-72-242-128.compute-1.amazonaws.com 'cd /var/lib/tomcat6/webapps/ROOT/ramit && git pull origin ${branch} &&./deploy.sh'
}

case $(git remote | grep -c "") in
    0)
        echo "Error: no git remotes found";
        exit -1;
        ;;
    1)
        DEF_REMOTE=$(git remote);
        ;;
    *)
        DEF_REMOTE="github";
        ;;
esac

DEF_BRANCH="master";

if [ $# -ne 1 ] && [ $# -ne 2 ] && [ $# -ne 3 ] && [ $# -ne 4 ] 
then
  echo "Error: First arg must be commit message. After you may have just a branch to push to OR both a remote and a branch." 
  echo -e "\ne.g.: $0 \"random commit msg\" ${DEF_REMOTE} ${DEF_BRANCH}";
  echo "e.g.: $0 \"random commit msg\" ${DEF_BRANCH}";
  echo "e.g.: $0 \"random commit msg\"";
  echo -e "\nNOTE: if no remote/branch is specified they default to ${DEF_REMOTE}/${DEF_BRANCH}";
  exit
fi

msg="${1}"

if [ $# -eq 1 ] 
then
  remote="${DEF_REMOTE}";
  branch="${DEF_BRANCH}";
elif [ $# -eq 2 ]
then
  remote="${DEF_REMOTE}";
  branch="${2}";
else
  remote="${2}";
  branch="${3}";
fi

output=$(find . -name '*.js' -exec jshint {} \;);

if [ ${#output} -ne 0 ]; then
  echo -e "${output}\n";
  while true; do
      read -p "Jshint found some errors, do you want to push anyways? [y/n]  " yn
      case $yn in
          [Yy]* ) push; exit;;
          [Nn]* ) exit;;
          * ) echo "Please answer yes or no.";;
      esac
  done
fi

push;
