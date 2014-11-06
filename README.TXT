====
    Copyright (c) 2014 wemove GmbH
    Licensed under the EUPL V.1.1

    This Software is provided to You under the terms of the European
    Union Public License (the "EUPL") version 1.1 as published by the
    European Union. Any use of this Software, other than as authorized
    under this License is strictly prohibited (to the extent such use
    is covered by a right of the copyright holder of this Software).

    This Software is provided under the License on an "AS IS" basis and
    without warranties of any kind concerning the Software, including
    without limitation merchantability, fitness for a particular purpose,
    absence of defects or errors, accuracy, and non-infringement of
    intellectual property rights other than copyright. This disclaimer
    of warranty is an essential part of the License and a condition for
    the grant of any rights to this Software.

    For more  details, see <http://joinup.ec.europa.eu/software/page/eupl>
====

To debug the iplug in eclipse:

- create a "conf" directory (under trunk)
- copy the following files from test/resources into the directory "/conf"
  * ingrid.auth
  * plugdescription.xml
  * communication.xml
  * log4j.properties
- execute mvn install to expand the base webapp
- set up a java application Run configuration
- start Class is de.ingrid.iplug.dsc.JettyStarter
- add the VM argument -Djetty.webapp=src/main/webapp to the Configuration
- add src/main/resources to class path
  
