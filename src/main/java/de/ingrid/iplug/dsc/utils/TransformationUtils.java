/**
 * 
 */
package de.ingrid.iplug.dsc.utils;

import java.util.HashMap;

import org.apache.log4j.Logger;

/**
 * Singleton helper class encapsulating functionality for transforming or processing values (e.g. used in mapping script).
 *  
 * @author Martin
 */
public class TransformationUtils {

    private static final Logger log = Logger.getLogger(TransformationUtils.class);

    /** For adding additional fields to index if needed (e.g. from / to time ...) */
    private IndexUtils IDX = null;

    /** HashMap for remembering processed values/fields of a record !
     * Values/fields are added and cleared in according methods ! */
    private HashMap<String, String> recordInfo = new HashMap<String, String>();

	private static TransformationUtils myInstance;

	/** Get The Singleton.
	 * NOTICE: Resets internal state again to initial state (no temp field info, use passed indexUtils). */
	public static synchronized TransformationUtils getInstance(IndexUtils indexUtils) {
		if (myInstance == null) {
	        myInstance = new TransformationUtils();
		}
		myInstance.initialize(indexUtils);

		return myInstance;
	}

	private TransformationUtils() {
	}
	private void initialize(IndexUtils indexUtils) {
		this.IDX = indexUtils;
		this.recordInfo.clear();
	}

	/** Add time_from, time_to to Index as t0/t1/t2 dependent from time_type.
	 * Also do some preprocessing of values.*/
	public void processTimeFields(String time_from, String time_to, String time_type) {
		if ("von".equals(time_type)) {
			IDX.add("t1", preprocessTimeField("t1", time_from));
			IDX.add("t2", preprocessTimeField("t2", time_to));

		} else if ("seit".equals(time_type)) {
			IDX.add("t1", preprocessTimeField("t1", time_from));

		} else if ("am".equals(time_type)) {
			IDX.add("t0", preprocessTimeField("t0", time_from));

		} else if ("bis".equals(time_type)) {
			IDX.add("t2", preprocessTimeField("t2", time_to));
		}
		
	    /*
	     * Set the boundaries of dates to values that can be compared with lucene. The
	     * value of infinite past is '00000000' and the value for infinite future is '99999999'.
	     * 
	     * Makes sure that the fields are only set, if we have a UDK date type of 'seit' or 'bis'. 
	     * We can do this because the mapping filters and maps the dates to t0 in case of date type
	     * 'am' and to t1 in case of 'seit', even if the database fields are the same. Thus we do not 
	     * need to look at the DB field time_type which controls the date 
	     * type ('am', 'seit', 'bis', 'von (von-bis)')   
	     */
        if (recordInfo.get("t1") != null && recordInfo.get("t2") == null && recordInfo.get("t0") == null) {
        	if (log.isDebugEnabled()) {
        		log.debug("t1 is set, t2 and t0 not set: set t2 to '99999999'!");
        	}
        	IDX.removeFields("t2");
        	IDX.add("t2", "99999999");
        } else if (recordInfo.get("t1") == null && recordInfo.get("t2") != null && recordInfo.get("t0") == null) {
        	if (log.isDebugEnabled()) {
        		log.debug("t2 is set, t1 and t0 not set: set t1 to '00000000'!");
        	}
        	IDX.removeFields("t1");
        	IDX.add("t1", "00000000");
        }
        
        // clean up
        recordInfo.remove("t0");
        recordInfo.remove("t1");
        recordInfo.remove("t2");
	}
	
	/** Preprocess time value and remember time field/value for later postprocessing. */
	private String preprocessTimeField(String fieldName, String value) {
		if (value == null) {
			value = "";
		}

        // cut time expressions
        int lastPos = 8;
        if (value.length() < lastPos) {
            lastPos = value.length();
        }
        value = value.substring(0, lastPos);

        // remember time value for later postprocessing
        if (value.length() > 0) {
        	recordInfo.put(fieldName, value);
        }
        
        return value;
	}
}
