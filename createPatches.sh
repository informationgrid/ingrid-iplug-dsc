#!/bin/bash

# first time call must include parameter --username=<USER> --password=<PASSWD> 
svn list "https://213.144.28.209:444/svn/ingrid/ingrid-iplug-dsc-scripted/tags/"
read -p "Enter tag-version (e.g. 3.3.0):, followed by [ENTER]: : " tag
COUNT=0
svnCall="svn log --limit 1 https://213.144.28.209:444/svn/ingrid/ingrid-iplug-dsc-scripted/tags/ingrid-iplug-dsc-scripted-$tag"
revisions=`$svnCall`
for line in $revisions ; do
    COUNT=$(($COUNT + 1))
    if [ $COUNT -eq 2 ]
    then
        revision=$line 
    fi 
done

revision=`echo "$revision" | sed -e 's/^ *//' -e 's/ *$//'`

echo "Using revision: $revision"
echo "Create patch file for src/main/webapp/WEB-INF/spring.xml"
svn diff -r $revision:HEAD src/main/webapp/WEB-INF/spring.xml > spring.xml.patch
