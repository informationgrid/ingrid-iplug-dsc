#!/bin/sh
#
##
# Environment Variables
#
#   INGRID_JAVA_HOME Overrides JAVA_HOME.
#
#   INGRID_HEAPSIZE  heap to use in mb, if not set we use 128MB.
#
#   INGRID_OPTS      additional java runtime options
#
#	INGRID_USER 	 starting user, default is "ingrid"
#

THIS="$0"

# some directories
THIS_DIR=`dirname "$THIS"`
INGRID_HOME=`cd "$THIS_DIR" ; pwd`
PID=$INGRID_HOME/ingrid.pid

INGRID_OPTS="-Djetty.port=@SERVER_PORT@ -Dindexing=true -Djetty.home=./jetty"
if [ -f $INGRID_HOME/conf/plugdescription.xml ]; then
    for tag in IPLUG_ADMIN_GUI_PORT
    do
        OUT=`grep --after-context=1 $tag $INGRID_HOME/conf/plugdescription.xml | tr -d '<string>'${tag}'</string>\n' | tr -d '\t' | tr -d ' ' | sed 's/^<.*>\([^<].*\)<.*>$/\1/' `
        eval ${tag}=`echo \""${OUT}"\"`
    done
  P_ARRAY=`echo ${IPLUG_ADMIN_GUI_PORT}`
  INGRID_OPTS="-Dindexing=true -Djetty.home=./jetty -Djetty.port="${P_ARRAY}
fi

# functions
indexIplug()
{
  echo "Try indexing ($INGRID_HOME)..."
  if [ -f $PID ]; then
      procid=`cat $PID`
      idcount=`ps -p $procid | wc -l`
      if [ $idcount -eq 2 ]; then
        echo plug running as process `cat $PID`.  Stop it first.
        exit 1
      fi
  fi
  
  # some Java parameters
  if [ "$INGRID_JAVA_HOME" != "" ]; then
    #echo "run java in $INGRID_JAVA_HOME"
    JAVA_HOME=$INGRID_JAVA_HOME
  fi
  
  if [ "$JAVA_HOME" = "" ]; then
    echo "Error: JAVA_HOME is not set."
    exit 1
  fi
  
  JAVA=$JAVA_HOME/bin/java
  JAVA_HEAP_MAX=-Xmx128m
  
  # check envvars which might override default args
  if [ "$INGRID_HEAPSIZE" != "" ]; then
    JAVA_HEAP_MAX="-Xmx""$INGRID_HEAPSIZE""m"
    echo "run with heapsize $JAVA_HEAP_MAX"
  fi

  # so that filenames w/ spaces are handled correctly in loops below
  IFS=
  # add libs to CLASSPATH
  CLASSPATH=${CLASSPATH}:${INGRID_CONF_DIR:=$INGRID_HOME/conf}
  for f in $INGRID_HOME/lib/*.jar; do
    CLASSPATH=${CLASSPATH}:$f;
  done
  # restore ordinary behaviour
  unset IFS
  
  # cygwin path translation
  if expr `uname` : 'CYGWIN*' > /dev/null; then
    CLASSPATH=`cygpath -p -w "$CLASSPATH"`
  fi

  # run it
  export CLASSPATH="$CLASSPATH"
  INGRID_OPTS="$INGRID_OPTS -Dingrid_home=$INGRID_HOME"
  CLASS=de.ingrid.admin.search.IndexDriver
	
  exec nohup "$JAVA" $JAVA_HEAP_MAX $INGRID_OPTS $CLASS > console.log & 
  
  echo "jetty ($INGRID_HOME) started."
  echo $! > $PID
}

# make sure the current user has the privilege to execute that script
if [ "$INGRID_USER" = "" ]; then
  INGRID_USER="ingrid"
fi

STARTING_USER=`whoami`
if [ "$STARTING_USER" != "$INGRID_USER" ]; then
  echo "You must be user '$INGRID_USER' to start that script! Set INGRID_USER in environment to overwrite this."
  exit 1
fi 

case "$1" in
  index)
    indexIplug
    ;;
  status)
    if [ -f $PID ]; then
      procid=`cat $PID`
      idcount=`ps -p $procid | wc -l`
      if [ $idcount -eq 2 ]; then
        echo "process ($procid) is running."
      else
        echo "process is not running. Exit."
      fi
    else
      echo "process is not running. Exit."
    fi
    ;;
  *)
    echo "Usage: $0 {index|status}"
    exit 1
    ;;
esac
