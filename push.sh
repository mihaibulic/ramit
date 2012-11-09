#!/bin/bash
set -e

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

if [ $# -ne 1 ] && [ $# -ne 2 ] && [ $# -ne 3 ]
then
  echo "Error: First arg must be commit message. After you may have just a branch to push to OR both a remote and a branch" 
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
if [ ${#output} -eq 0 ]; then
    git add --all
    
    git commit --allow-empty -a -m "${msg}"

    git fetch ${remote} 
    git merge ${remote}/${branch}
    
    git push ${remote} ${branch}

    yes | ssh -i misquares.pem ec2-user@ec2-184-72-242-128.compute-1.amazonaws.com 'cd /var/lib/tomcat6/webapps/ROOT/ramit && git pull github ${branch} &&./deploy.sh'
else
    echo "${output}";
    echo "Cannot push your code because jshint has found errors.";
fi

