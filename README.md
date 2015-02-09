DSC iPlug
========

The DSC-iPlug (Data Source Client) connects a JDBC database to the InGrid data space.

Features
--------

- index any JDBC database at a certain schedule
- flexible indexing functionality (script for indexing and detail data generation)
- provides search functionality on the indexed data
- GUI for easy administration


Requirements
-------------

- a running InGrid Software System

Installation
------------

Download from https://dev.informationgrid.eu/ingrid-distributions/ingrid-iplug-dsc/
 
or

build from source with `mvn package assembly:single`.

Execute

```
java -jar ingrid-iplug-dsc-x.x.x-installer.jar
```

and follow the install instructions.

Obtain further information at https://dev.informationgrid.eu/


Contribute
----------

- Issue Tracker: https://github.com/informationgrid/ingrid-iplug-dsc/issues
- Source Code: https://github.com/informationgrid/ingrid-iplug-dsc
 
### Set up eclipse project

```
mvn eclipse:eclipse
```

and import project into eclipse.

### Debug under eclipse

- execute `mvn install` to expand the base web application
- set up a java application Run Configuration with start class `de.ingrid.iplug.dsc.DscSearchPlug`
- add the VM argument `-Djetty.webapp=src/main/webapp` to the Run Configuration
- add src/main/resources to class path
- the admin gui starts per default on port 8082, change this with VM argument `-Djetty.port=8083`

Support
-------

If you are having issues, please let us know: info@informationgrid.eu

License
-------

The project is licensed under the EUPL license.
