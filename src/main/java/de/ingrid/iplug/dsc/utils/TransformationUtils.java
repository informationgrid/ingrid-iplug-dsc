/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2016 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.1 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * http://ec.europa.eu/idabc/eupl5
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * **************************************************#
 */
/**
 * 
 */
package de.ingrid.iplug.dsc.utils;

import java.io.IOException;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.log4j.Logger;

import de.ingrid.geo.utils.transformation.CoordTransformUtil;
import de.ingrid.geo.utils.transformation.CoordTransformUtil.CoordType;
import de.ingrid.utils.udk.UtilsCSWDate;
import de.ingrid.utils.udk.UtilsCountryCodelist;
import de.ingrid.utils.udk.UtilsLanguageCodelist;
import de.ingrid.utils.udk.UtilsLanguageCodelist.ISO_639_2_Type;
import de.ingrid.utils.udk.UtilsUDKCodeLists;

/**
 * Helper class encapsulating functionality for transforming or processing values (e.g. used in mapping script). Must be instantiated to be thread safe.
 *  
 * @author Martin
 */
public class TransformationUtils {

    private static final Logger log = Logger.getLogger(TransformationUtils.class);

    /** e.g. for selecting values from syslist */
    private SQLUtils SQL = null;

    /** HashMap for remembering processed values/fields of a record !
     * Values/fields are added and cleared in according methods ! */
    private Map<String, String> tmpInfo = new HashMap<String, String>();

	public static String LANG_ID_INGRID_QUERY_VALUE = UtilsUDKCodeLists.LANG_ID_INGRID_QUERY_VALUE;

	public TransformationUtils(SQLUtils sqlUtils) {
	    this.SQL = sqlUtils;
	    //initCodelists();
	}
	
	/**
	 * Transform the codelists from the database into a hierarchical hashmap to
	 * access each codelist entry easily.
	 * 
	 * Now there are separate SQL-queries for each syslist transformation!
	 */
//	private void initCodelists() {
//	    this.codelists = new HashMap();
//	    try {
//            List<Map<String,String>> allSyslists = SQL.all("SELECT * FROM sys_list");
//            for (Map<String, String> syslist : allSyslists) {
//                // check if list already was added
//                Map<String, Map<String, String>> cl = (Map<String, Map<String, String>>) codelists.get(syslist.get("lst_id"));
//                if (cl == null) {
//                    cl = new HashMap<String, Map<String, String>>();
//                    codelists.put(syslist.get("lst_id"), cl);
//                }
//                
//                Map<String, String> clEntry = (Map<String, String>) cl.get(syslist.get("entry_id"));
//                if (clEntry == null) {
//                    clEntry = new HashMap<String, String>();
//                    cl.put(syslist.get("entry_id"), clEntry);
//                }
//                
//                clEntry.put(syslist.get("lang_id"), syslist.get("name"));
//                
//            }
//        } catch (SQLException e) {
//            // TODO Auto-generated catch block
//            e.printStackTrace();
//        }
//	}

	/** Get the name of the given entry in the given syslist IN THE LANGUAGE OF THE CATALOG.
	 * @param listId id of syslist
	 * @param entryId id of entry in syslist
	 * @return null if no entry found !
	 * @throws SQLException
	 */
	public String getIGCSyslistEntryName(int listId, int entryId)
	throws SQLException {
		// get catalog language in "syslist format" (de, en, ...)
		Integer catLangKey = getIGCCatalogLanguageKey();
		String catLangShortcut = UtilsLanguageCodelist.getShortcutFromCode(catLangKey);
		
		return getIGCSyslistEntryName(listId, entryId, catLangShortcut);
	}

	/** Get the name of the given entry in the given syslist in the given language !
	 * @param listId id of syslist
	 * @param entryId id of entry in syslist
	 * @param langShortcut ISO 639-1 language shortcut (e.g. "de, "en" ...")
	 * @return null if no entry found !
	 * @throws SQLException
	 */
	public String getIGCSyslistEntryName(int listId, int entryId, String langShortcut)
	throws SQLException {
		String retValue = null;

		List<Map<String, String>> rows =
			SQL.all("SELECT * FROM sys_list WHERE lst_id=? AND entry_id=? and lang_id=?",
					new Object[]{listId, entryId, langShortcut});
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

	/** Transform passed t01_object: "time_from","time_to","time_type" to "t0", "t1", "t2" returned in Map as keys (e.g. for adding to index).
	 * Map value will be null if not added. */
	public Map<String, String> transformIGCTimeFields(String time_from, String time_to, String time_type)
	throws IOException {
		Map<String, String> retMap = new HashMap<String, String>();

		if ("von".equals(time_type)) {
			retMap.put("t1", preprocessIGCTimeField("t1", time_from));
			retMap.put("t2", preprocessIGCTimeField("t2", time_to));

		} else if ("seit".equals(time_type)) {
			retMap.put("t1", preprocessIGCTimeField("t1", time_from));

		} else if ("am".equals(time_type)) {
			retMap.put("t0", preprocessIGCTimeField("t0", time_from));

		} else if ("bis".equals(time_type)) {
			retMap.put("t2", preprocessIGCTimeField("t2", time_to));
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
        if (tmpInfo.get("t1") != null && tmpInfo.get("t2") == null && tmpInfo.get("t0") == null) {
        	if (log.isDebugEnabled()) {
        		log.debug("t1 is set, t2 and t0 not set: set t2 to '99999999'!");
        	}
        	retMap.put("t2", "99999999");
        } else if (tmpInfo.get("t1") == null && tmpInfo.get("t2") != null && tmpInfo.get("t0") == null) {
        	if (log.isDebugEnabled()) {
        		log.debug("t2 is set, t1 and t0 not set: set t1 to '00000000'!");
        	}
        	retMap.put("t1", "00000000");
        }
        
        // clean up
        tmpInfo.remove("t0");
        tmpInfo.remove("t1");
        tmpInfo.remove("t2");
        
        return retMap;
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
        	tmpInfo.put(fieldName, value);
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

	/**
	 * Get ISO 639-2 language shortcut (e.g. "ger, "eng" ...") from IGC language code. 
	 * @param igcLangCode IGC code of language. e.g. "150"
	 * @return ISO 639-2 language shortcut (bibliographic code !) or null if not found
	 */
	public String getLanguageISO639_2FromIGCCode(String igcLangCode) {
		if (igcLangCode == null) {
			return null;
		}
	    return UtilsLanguageCodelist.getLanguageISO639_2FromIGCCode(new Integer(igcLangCode), ISO_639_2_Type.BIBLIOGRAPHIC_CODE);
	}

	/** Determine ISO 639-1 language shortcut (e.g. "de, "en" ...") from IGC language code.
	 * @param langCodeIGC IGC code of language
	 * @return ISO 639-1 language shortcut or null if not found
	 */
	public String getLanguageShortcutFromIGCCode(String igcLangCode) {
		if (igcLangCode == null) {
			return null;
		}
	    return UtilsLanguageCodelist.getShortcutFromCode(new Integer(igcLangCode));
	}

	/**
	 * Returns an iso codeList entry based on an IGC code list domain id.
	 * The Data is based on ISO code lists from
	 * http://www.isotc211.org/2005/resources/Codelist/gmxCodelists.xml
	 * If the iso codelist entry cannot be found, the english translation of the
	 * IGC syslist will be returned. If this also cannot be found, null is returned.
	 */
	public String getISOCodeListEntryFromIGCSyslistEntry(Long igcCodeListId, String igcEntryId) {
		if (igcEntryId == null || igcEntryId.equals("-1") ) {
			return null;
		}

		String retValue = null;
		try {
			retValue = SQL.first("SELECT name FROM sys_list WHERE lst_id="+igcCodeListId+" AND lang_id='"+UtilsUDKCodeLists.LANG_ID_ISO_ENTRY+"' AND entry_id="+igcEntryId).get("name");
		} catch (Exception ex) {
		    // fallback and search for english entry
            if (retValue == null) {
                try {
                    retValue = SQL.first("SELECT name FROM sys_list WHERE lst_id="+igcCodeListId+" AND lang_id='en' AND entry_id="+igcEntryId).get("name");
                } catch (SQLException e) {
                    log.debug("Cannot transform IGC syslist entry -> listId '" + igcCodeListId +
                            "', entryId '" + igcEntryId + "' to ISO CodeList entry.");
                } catch (NullPointerException e) {
                    log.debug("Cannot get name of syslist entry -> listId '" + igcCodeListId +
                            "', entryId '" + igcEntryId);
                }
            }
		}
        if (log.isDebugEnabled()) {
            log.debug("Transform IGC syslist entry -> listId '" + igcCodeListId +
            		"', entryId '" + igcEntryId + "' to ISO CodeList entry '" + retValue + "'.");
        }

		return retValue;
	}

	/**
	 * Returns a codeList entry based on an IGC code list domain id and a specific "language" code.
	 * NOTICE: "language" code can also be just a code for fetching a ingrid specific representation
	 * of the entry (e.g. ingrid query value of a topic in "Umweltthemen"). 
	 * If the codelist entry cannot be found null is returned.
	 */
	public String getCodeListEntryFromIGCSyslistEntry(Long igcCodeListId, String igcEntryId, String langIdInCodelist) {
		if (igcEntryId == null) {
			return null;
		}

		String retValue = null;
		try {
			retValue = SQL.first("SELECT name FROM sys_list WHERE lst_id="+igcCodeListId+" AND lang_id='"+langIdInCodelist+"' AND entry_id="+igcEntryId).get("name");
		} catch (Exception ex) {
            log.debug("Cannot transform IGC syslist entry -> listId '" + igcCodeListId +
            	"', entryId '" + igcEntryId + "', langId '" + langIdInCodelist + "' to entry of CodeList.");
		}
        if (log.isDebugEnabled()) {
            log.debug("Transform IGC syslist entry -> listId '" + igcCodeListId +
            	"', entryId '" + igcEntryId + "', langId '" + langIdInCodelist + 
            	"' to entry of CodeList '" + retValue + "'.");
        }

		return retValue;
	}

	/**
	 * Is the given entryValue an entry of the given ISO code list ? Return ID of entry if yes.
	 * Return null if not an Entry !
	 */
	public String getISOCodeListEntryId(Long codeListId, String entryValue) {
		if (entryValue == null) {
			return null;
		}

		String retValue = null;
		try {
			retValue = SQL.first("SELECT entry_id FROM sys_list WHERE lst_id="+codeListId+" AND name=?", new Object[] { entryValue }).get("entry_id");
		} catch (Exception ex) {
            log.debug("Problems checking entryValue '" + entryValue + "' on ISO Code List '" + codeListId + "'.");
		}
        if (log.isDebugEnabled()) {
            log.debug("Checking entryValue '" + entryValue + "' on ISO Code List '" + codeListId + "' delivers entryId '" + retValue + "'.");
        }

		return retValue;
	}
	
	
	public String getISOCodeListEntryData(Long codeListId, String entryValue ) {
		if (entryValue == null) {
			return null;
		}

		String retValue = null;
		try {
			retValue = SQL.first("SELECT data FROM sys_list WHERE lst_id="+codeListId+" AND name=?", new Object[] { entryValue }).get("data");
		} catch (Exception ex) {
            log.debug("Problems checking entryValue '" + entryValue + "' on ISO Code List '" + codeListId + "'.");
		}
        if (log.isDebugEnabled()) {
            log.debug("Checking entryValue '" + entryValue + "' on ISO Code List '" + codeListId + "' delivers data '" + retValue + "'.");
        }

		return retValue;
	}

	/**
	 * Returns a ISO3166-1 Alpha-3 code based on a given numeric id.
	 * 
	 * @param numericCode The numeric id.
	 * @return The ISO3166-1 Alpha-3 code or the numeric id. 
	 */
	public String getISO3166_1_Alpha_3FromNumericLanguageCode(String numericCode) {
        String iso3166_1_Alpha_3;
        try {
            iso3166_1_Alpha_3 = UtilsCountryCodelist.getShortcut3FromCode(Integer.valueOf(numericCode));;
        } catch (NumberFormatException e) {
            log.warn("Cannot transform numeric language code '" + numericCode + "' to ISO3166-1 Alpha-3 code.");
            iso3166_1_Alpha_3 = numericCode;
        }
        if (log.isDebugEnabled()) {
            log.debug("Transform numeric language code '" + numericCode + "' to ISO3166-1 Alpha-3 code:" + iso3166_1_Alpha_3);
        }
        
        return iso3166_1_Alpha_3;
	    	    
	}
	
	/** Transforms given IGC date string (e.g. t0, t1, t2 from index) to a valid ISO Date String.
	 * Returns unchanged date (the passed one) if problems occur ! */
	public String getISODateFromIGCDate(String igcDate) {
	    String result = UtilsCSWDate.mapFromIgcToIso8601(igcDate);
	    if (result == null) {
	        result = igcDate;
	    }
	    return result;
	}

	/** Transforms an igc number string (e.g. x1, x2, y1, y2 from index) to a valid ISO gco:Decimal string.
	 * Returns "NaN" if problems occur ! */
	public String getISODecimalFromIGCNumber(String igcNumber) {
        String retValue;
    	try {
			double n = Double.parseDouble(igcNumber.replaceAll(",", "."));
			retValue = String.valueOf(n);
		} catch (NumberFormatException e) {
			if (log.isDebugEnabled()) {
				log.debug("Could not convert to gco:Decimal: " + igcNumber, e);
			}
			retValue = "NaN";
		}		
		return retValue;
    }

	/** Transforms an igc number string (e.g. vertical_extent_minimum) to a valid ISO gco:Real string.
	 * Returns "NaN" if problems occur ! */
	public String getISORealFromIGCNumber(String igcNumber) {
        String retValue;
    	try {
			double n = Double.parseDouble(igcNumber);
			if (Double.isNaN(n)) {
				retValue = "NaN";
			} else if (Double.isInfinite(n)) {
				retValue = "INF";
			} else {
				retValue = String.valueOf(n);
			}
		} catch (NumberFormatException e) {
			if (log.isDebugEnabled()) {
				log.debug("Could not convert to ISO gco:Real: " + igcNumber, e);
			}
			retValue = "NaN";
		}
		return retValue;
    }

	/** Transforms an igc integer string (e.g. t011_obj_geo_scale.scale) to a valid ISO gco:Integer string.
	 * Returns "NaN" if problems occur ! */
	public String getISOIntegerFromIGCNumber(String igcNumber) {
		String retValue;
    	try {
			int n = Integer.parseInt(igcNumber);
			retValue = String.valueOf(n);
		} catch (NumberFormatException e) {
			if (log.isDebugEnabled()) {
				log.debug("Could not convert to ISO gco:Integer: " + igcNumber, e);
			}
			retValue = "NaN";
		}
		return retValue;
    }

	/** returns java generated UUID via UUID.randomUUID() */
	public UUID getRandomUUID() {
		return UUID.randomUUID();
    }
}
