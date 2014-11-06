#!/bin/bash
#
# Copyright (c) 2014 wemove GmbH
# Licensed under the EUPL V.1.1
#
# This Software is provided to You under the terms of the European
# Union Public License (the "EUPL") version 1.1 as published by the
# European Union. Any use of this Software, other than as authorized
# under this License is strictly prohibited (to the extent such use
# is covered by a right of the copyright holder of this Software).
#
# This Software is provided under the License on an "AS IS" basis and
# without warranties of any kind concerning the Software, including
# without limitation merchantability, fitness for a particular purpose,
# absence of defects or errors, accuracy, and non-infringement of
# intellectual property rights other than copyright. This disclaimer
# of warranty is an essential part of the License and a condition for
# the grant of any rights to this Software.
#
# For more  details, see <http://joinup.ec.europa.eu/software/page/eupl>
#


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
