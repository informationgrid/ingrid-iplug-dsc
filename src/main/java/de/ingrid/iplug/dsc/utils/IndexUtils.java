/**
 * 
 */
package de.ingrid.iplug.dsc.utils;

import java.io.IOException;
import java.io.StringReader;
import java.util.HashMap;

import org.apache.log4j.Logger;
import org.apache.lucene.analysis.TokenStream;
import org.apache.lucene.analysis.standard.StandardAnalyzer;
import org.apache.lucene.analysis.tokenattributes.TermAttribute;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.util.Version;

/**
 * Singleton helper class encapsulating functionality on Lucene Index (e.g. used in mapping script).
 *  
 * @author Martin
 */
public class IndexUtils {

    private static final Logger log = Logger.getLogger(IndexUtils.class);

    private static String CONTENT_FIELD_NAME = "content";

    /** the Lucene Document where the fields are added ! */
    private Document luceneDoc = null;

    /** analyzer for stemming ! always german one ???  NO WE USE STANDARD ANALYZER due to different languages ! */
//    private static GermanAnalyzer fAnalyzer = new GermanAnalyzer(new String[0]);
    private static StandardAnalyzer fAnalyzer = new StandardAnalyzer(Version.LUCENE_CURRENT);

    /** HashMap for remembering processed values/fields of a record !
     * Values/fields are added and cleared in according methods ! */
    private HashMap<String, String> recordInfo = new HashMap<String, String>();

    // our single instance !
	private static IndexUtils myInstance;

	/** Get The Singleton.
	 * NOTICE: Resets internal state (uses passed luceneDoc). */
	public static synchronized IndexUtils getInstance(Document luceneDoc) {
		if (myInstance == null) {
	        myInstance = new IndexUtils();
		}
		myInstance.initialize(luceneDoc);

		return myInstance;
	}

	private IndexUtils() {
	}
	private void initialize(Document luceneDoc) {
		this.luceneDoc = luceneDoc;
		this.recordInfo.clear();
	}
	
	/** Add a index field with the value to the index document.
	 * The field will be TOKENIZE and STORE and will be added to a separate
	 * "content" field (ADD_TO_CONTENT_FIELD) by default.
	 * If the field value is null (or "") then NOTHING is added !
	 * @param fieldName name of the field in the index
	 * @param value content of the field !
	 */
	public void add(String fieldName, String value) throws IOException {
		if (value != null && value.trim().length() != 0) {
			add(fieldName, value, Field.Store.YES, Field.Index.ANALYZED);
			add(CONTENT_FIELD_NAME, value, Field.Store.NO, Field.Index.ANALYZED);
			add(CONTENT_FIELD_NAME, filterTerm(value), Field.Store.NO, Field.Index.ANALYZED);
		}
	}

	private void add(String fieldName, String value,
			Field.Store stored,
			Field.Index tokenized) {
		if (log.isDebugEnabled()) {
	        log.debug("Add field '" + fieldName + "' with value '" + value + "' to lucene document " +
	        		"(Field.Index=" + tokenized + ", Field.Store=" + stored + ")");			
		}
        
		luceneDoc.add(new Field(fieldName, value, stored, tokenized));
	}

	/** Remove Fields.
	 * @param fieldName name of field to remove.
	 */
	public void removeFields(String fieldName) {
		if (log.isDebugEnabled()) {
	        log.debug("Removed ALL fields with name '" + fieldName + "'.");			
		}

		luceneDoc.removeFields(fieldName);
	}
    private static String filterTerm(String term) {
        String result = "";

        TokenStream stream = fAnalyzer.tokenStream(null, new StringReader(term));
        // get the TermAttribute from the TokenStream
        TermAttribute termAtt = (TermAttribute) stream.addAttribute(TermAttribute.class);

        try {
            stream.reset();
            // add all tokens until stream is exhausted
            while (stream.incrementToken()) {
            	result = result + " " + termAtt.term();
            }
            stream.end();
            stream.close();
        } catch (IOException ex) {
        	log.error("Problems tokenizing term " + term + ", we return full term.", ex);
        	result = term;
        }

        return result.trim();
    }

	/** Add time_from, time_to to Index as t0/t1/t2 dependent from time_type.
	 * Also do some preprocessing of values.*/
	public void processIGCTimeFields(String time_from, String time_to, String time_type)
	throws IOException {
		if ("von".equals(time_type)) {
			add("t1", preprocessIGCTimeField("t1", time_from));
			add("t2", preprocessIGCTimeField("t2", time_to));

		} else if ("seit".equals(time_type)) {
			add("t1", preprocessIGCTimeField("t1", time_from));

		} else if ("am".equals(time_type)) {
			add("t0", preprocessIGCTimeField("t0", time_from));

		} else if ("bis".equals(time_type)) {
			add("t2", preprocessIGCTimeField("t2", time_to));
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
        	removeFields("t2");
        	add("t2", "99999999");
        } else if (recordInfo.get("t1") == null && recordInfo.get("t2") != null && recordInfo.get("t0") == null) {
        	if (log.isDebugEnabled()) {
        		log.debug("t2 is set, t1 and t0 not set: set t1 to '00000000'!");
        	}
        	removeFields("t1");
        	add("t1", "00000000");
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
}
