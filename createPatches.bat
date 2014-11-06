@REM
@REM Copyright (c) 2014 wemove GmbH
@REM Licensed under the EUPL V.1.1
@REM
@REM This Software is provided to You under the terms of the European
@REM Union Public License (the "EUPL") version 1.1 as published by the
@REM European Union. Any use of this Software, other than as authorized
@REM under this License is strictly prohibited (to the extent such use
@REM is covered by a right of the copyright holder of this Software).
@REM
@REM This Software is provided under the License on an "AS IS" basis and
@REM without warranties of any kind concerning the Software, including
@REM without limitation merchantability, fitness for a particular purpose,
@REM absence of defects or errors, accuracy, and non-infringement of
@REM intellectual property rights other than copyright. This disclaimer
@REM of warranty is an essential part of the License and a condition for
@REM the grant of any rights to this Software.
@REM
@REM For more  details, see <http://joinup.ec.europa.eu/software/page/eupl>
@REM

@echo off
setlocal ENABLEDELAYEDEXPANSION

svn list https://213.144.28.209:444/svn/ingrid/ingrid-iplug-dsc-scripted/tags
set /p tag="Enter tag-version (e.g. 3.3.0): "

set COUNT=0
set svnCall=svn log --limit 1 https://213.144.28.209:444/svn/ingrid/ingrid-iplug-dsc-scripted/tags/ingrid-iplug-dsc-scripted-%tag%
for /f %%a in ('%svnCall%') do (
    set /A COUNT=!COUNT! + 1
    if !COUNT! == 2 ( set rev=%%a )
)

REM trim spaces to right (work around)
set rev=%rev%##
set rev=%rev: ##=##%
set rev=%rev:##=%
echo Using revision: %rev%
svn diff -r %rev%:HEAD src\main\webapp\WEB-INF\spring.xml > spring.xml.patch

pause