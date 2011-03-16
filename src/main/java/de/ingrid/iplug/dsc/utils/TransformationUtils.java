/**
 * 
 */
package de.ingrid.iplug.dsc.utils;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;

import de.ingrid.geo.utils.transformation.CoordTransformUtil;
import de.ingrid.geo.utils.transformation.CoordTransformUtil.CoordType;
import de.ingrid.utils.udk.UtilsCSWDate;
import de.ingrid.utils.udk.UtilsCountryCodelist;
import de.ingrid.utils.udk.UtilsLanguageCodelist;
import de.ingrid.utils.udk.UtilsUDKCodeLists;
import de.ingrid.utils.udk.UtilsLanguageCodelist.ISO_639_2_Type;

/**
 * Singleton helper class encapsulating functionality for transforming or processing values (e.g. used in mapping script).
 *  
 * @author Martin
 */
public class TransformationUtils {

    private static final Logger log = Logger.getLogger(TransformationUtils.class);

    /** e.g. for selecting values from syslist */
    private SQLUtils SQL = null;

	private static TransformationUtils myInstance;

	/** Get The Singleton.
	 * NOTICE: Resets internal state (e.g. temporary info), uses passed sqlUtils.
	 * @param sqlUtils always pass SQLUtils, e.g. needed when translating syslist keys to values ...
	 * @return
	 */
	public static synchronized TransformationUtils getInstance(SQLUtils sqlUtils) {
		if (myInstance == null) {
	        myInstance = new TransformationUtils();
		}
		myInstance.initialize(sqlUtils);

		return myInstance;
	}

	private TransformationUtils() {
	}
	private void initialize(SQLUtils sqlUtils) {
		this.SQL = sqlUtils;
	}

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

	/** Transforms given number string to a valid ISO Number String. Returns "NaN" if problems occur ! */
	public String transformToIsoDouble(String numberString) {
        String retValue;
    	try {
			double n = Double.parseDouble(numberString.replaceAll(",", "."));
			retValue = String.valueOf(n);
		} catch (NumberFormatException e) {
			if (log.isDebugEnabled()) {
				log.debug("Could not convert to Double: " + numberString, e);
			}
			retValue = "NaN";
		}
		
		return retValue;
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

	/**
	 * Returns an iso codeList entry based on an IGC code list domain id.
	 * The Data is based on ISO code lists from
	 * http://www.isotc211.org/2005/resources/Codelist/gmxCodelists.xml
	 * If the iso codelist entry cannot be found, the english translation of the
	 * IGC syslist will be returned. If this also cannot be found, null is returned.
	 */
	public String getISOCodeListEntryFromIGCSyslistEntry(Long igcCodeListId, String igcEntryId) {
		if (igcEntryId == null) {
			return null;
		}

		String retValue = null;
		try {
			retValue = UtilsUDKCodeLists.getIsoCodeListEntryFromIgcId(igcCodeListId, new Long(igcEntryId));
		} catch (Exception ex) {
            log.error("Cannot transform IGC syslist entry -> listId '" + igcCodeListId +
            		"', entryId '" + igcEntryId + "' to ISO CodeList entry.");
		}
        if (log.isDebugEnabled()) {
            log.debug("Transform IGC syslist entry -> listId '" + igcCodeListId +
            		"', entryId '" + igcEntryId + "' to ISO CodeList entry '" + retValue + "'.");
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
            log.error("Cannot transform numeric language code '" + numericCode + "' to ISO3166-1 Alpha-3 code.");
            iso3166_1_Alpha_3 = numericCode;
        }
        if (log.isDebugEnabled()) {
            log.debug("Transform numeric language code '" + numericCode + "' to ISO3166-1 Alpha-3 code:" + iso3166_1_Alpha_3);
        }
        
        return iso3166_1_Alpha_3;
	    	    
	}
	
	public String getISODateFromIgcDate(String igcDate) {
	    String result = UtilsCSWDate.mapFromIgcToIso8601(igcDate);
	    if (result == null) {
	        result = igcDate;
	    }
	    return result;
	}
	

}
