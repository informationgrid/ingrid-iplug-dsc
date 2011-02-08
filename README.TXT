To debug the iplug in eclipse:

- create a "conf" directory
- copy the following files from test/resources into the directory "/conf"
  * ingrid.auth
  * plugdescription.xml
  * communication.xml
  * log4j.properties
- execute mvn install to expand the bas webapp
- set up a java application Run configuration
- start Class is de.ingrid.iplug.dsc.JettyStarter
- add the VM argument -Djetty.webapp=src/main/webapp to the Configuration
  
