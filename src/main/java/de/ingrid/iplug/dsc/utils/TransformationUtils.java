/**
 * 
 */
package de.ingrid.iplug.dsc.utils;

import java.io.IOException;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;

import de.ingrid.geo.utils.transformation.CoordTransformUtil;
import de.ingrid.geo.utils.transformation.CoordTransformUtil.CoordType;
import de.ingrid.utils.udk.UtilsLanguageCodelist;

/**
 * Singleton helper class encapsulating functionality for transforming or processing values (e.g. used in mapping script).
 *  
 * @author Martin
 */
public class TransformationUtils {

    private static final Logger log = Logger.getLogger(TransformationUtils.class);

    /** For adding additional fields to index if needed (e.g. t0, t1, t2 dependent from time_from/time_to ...) */
    private IndexUtils IDX = null;
    /** e.g. for selecting values from syslist */
    private SQLUtils SQL = null;

    /** HashMap for remembering processed values/fields of a record !
     * Values/fields are added and cleared in according methods ! */
    private HashMap<String, String> recordInfo = new HashMap<String, String>();

	private static TransformationUtils myInstance;

	/** Get The Singleton.
	 * NOTICE: Resets internal state (no temporary field info), uses passed indexUtils, sqlUtils .... */
	public static synchronized TransformationUtils getInstance(IndexUtils indexUtils, SQLUtils sqlUtils) {
		if (myInstance == null) {
	        myInstance = new TransformationUtils();
		}
		myInstance.initialize(indexUtils, sqlUtils);

		return myInstance;
	}

	private TransformationUtils() {
	}
	private void initialize(IndexUtils indexUtils, SQLUtils sqlUtils) {
		this.IDX = indexUtils;
		this.SQL = sqlUtils;
		this.recordInfo.clear();
	}

	/** Get the name of the given entry in the given syslist IN THE LANGUAGE OF THE CATALOG.
	 * @param listId id of syslist
	 * @param entryId id of entry in syslist
	 * @return null if no entry found !
	 * @throws SQLException
	 */
	public String getIGCSyslistEntryName(int listId, int entryId)
	throws SQLException {
		String retValue = null;

		// get catalog language in "syslist format" (de, en, ...)
		Integer catLangKey = getIGCCatalogLanguageKey();
		String catLangShortcut = UtilsLanguageCodelist.getShortcutFromCode(catLangKey);

		List<Map<String, String>> rows =
			SQL.all("SELECT * FROM sys_list WHERE lst_id=? AND entry_id=? and lang_id=?",
					new Object[]{listId, entryId, catLangShortcut});
	    for (Map<String, String> row : rows) {
	    	retValue = row.get("name");
	    	break;
	    }
	    
	    return retValue;
	}

	/** Get language of catalog (entry id of language syslist). 
	 * @return Null if catalog not found !?
	 * @throws SQLException
	 */
	private Integer getIGCCatalogLanguageKey() throws SQLException {
		Integer languageKey = null;

		List<Map<String, String>> rows = SQL.all("SELECT language_key FROM t03_catalogue");
	    for (Map<String, String> row : rows) {
	    	languageKey = new Integer(row.get("language_key"));
	    	break;
	    }

	    return languageKey;
	}

	/** Add time_from, time_to to Index as t0/t1/t2 dependent from time_type.
	 * Also do some preprocessing of values.*/
	public void processIGCTimeFields(String time_from, String time_to, String time_type)
	throws IOException {
		if ("von".equals(time_type)) {
			IDX.add("t1", preprocessIGCTimeField("t1", time_from));
			IDX.add("t2", preprocessIGCTimeField("t2", time_to));

		} else if ("seit".equals(time_type)) {
			IDX.add("t1", preprocessIGCTimeField("t1", time_from));

		} else if ("am".equals(time_type)) {
			IDX.add("t0", preprocessIGCTimeField("t0", time_from));

		} else if ("bis".equals(time_type)) {
			IDX.add("t2", preprocessIGCTimeField("t2", time_to));
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
	private String preprocessIGCTimeField(String fieldName, String value) {
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

	/** Transform a Point (x,y) into WGS84. If problems occur point will be unchanged.
	 * @param x x coordinate in givenCoordType (as String as read from row via SQLUtils)
	 * @param y y coordinate in givenCoordType (as String as read from row via SQLUtils)
	 * @param givenCoordType coordination system of coordinates, e.g. Gauss Krueger ...), use Enumeration !
	 * @return transformed coords as String[]. Same values as passed if problems occured (logged) !
	 */
	public String[] transformPointToWGS84(String x, String y, CoordType givenCoordType) {
        String[] coord = {x, y};
        try {
            double[] coordDouble =
            	CoordTransformUtil.getInstance().transformToWGS84(new Double(x), new Double(y), givenCoordType);
            coord[0] = new Double(coordDouble[0]).toString();
            coord[1] = new Double(coordDouble[1]).toString();
        } catch (final Exception e) {
        	log.warn("Could not transform Coord to WGS84, we do NOT transform ! -> x: " + x + ", y: " + y + ", type: " + givenCoordType);
        }
        return coord;
    }
}
