/**
 * 
 */
package de.ingrid.iplug.dsc.utils;

import org.apache.log4j.Logger;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;

/**
 * Singleton helper class encapsulating functionality on Lucene Index (e.g. used in mapping script).
 *  
 * @author Martin
 */
public class IndexUtils {

    private static final Logger log = Logger.getLogger(IndexUtils.class);

    /* Helper static consts for passing to methods */
    public static boolean TOKENIZE = true;
    public static boolean NO_TOKENIZE = false;

    public static boolean STORE = true;
    public static boolean NO_STORE = false;

    public static boolean ADD_TO_CONTENT_FIELD = true;
    public static boolean NO_ADD_TO_CONTENT_FIELD = false;

    private static String CONTENT_FIELD_NAME = "content";

    // the Lucene Document where the fields are added !
    private Document luceneDoc = null;

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
	}
	
	/** Add a index field with the value to the index document.
	 * The field will be TOKENIZE and STORE and will be added to a separate
	 * "content" field (ADD_TO_CONTENT_FIELD) by default.
	 * If the field value is null (or "") then "" is set as value with NO_TOKENIZE
	 * (but STORE, so the field is added) and nothing will be added to separate "content"
	 * field (NO_ADD_TO_CONTENT_FIELD).
	 * @param fieldName name of the field in the index
	 * @param value field value to process
	 */
	public void add(String fieldName, String value) {
		if (value == null || value.trim().length() == 0) {
			add(fieldName, "", NO_TOKENIZE, STORE, NO_ADD_TO_CONTENT_FIELD);
		} else {
			add(fieldName, value, TOKENIZE, STORE, ADD_TO_CONTENT_FIELD);
		}
	}

	/** Add a index field with the value to the index document.
	 * The field will be tokenized and stored according to the supplied parameters.
	 * Also the field value will be added to the separate "content" field if requested.
	 * @param fieldName name of the field in the index
	 * @param value field value to process
	 * @param tokenized use static TOKENIZE, NO_TOKENIZE consts
	 * @param stored use static STORE, NO_STORE consts
	 * @param addToContentField use static ADD_TO_CONTENT_FIELD, NO_ADD_TO_CONTENT_FIELD consts
	 */
	private void add(String fieldName, String value,
			boolean tokenized,
			boolean stored,
			boolean addToContentField) {
		if (log.isDebugEnabled()) {
	        log.debug("Add field '" + fieldName + "' with value '" + value + "' to lucene document " +
	        		"(tokenized=" + tokenized + ", stored=" + stored + ", addToContentField=" + addToContentField +")");			
		}
        
		luceneDoc.add(new Field(fieldName,
				value,
				mapBooleanToFieldStore(stored),
				mapBooleanToFieldIndex(tokenized)));

		// also add to "content" field if requested !
		if (addToContentField) {
			luceneDoc.add(new Field(CONTENT_FIELD_NAME,
					value,
					mapBooleanToFieldStore(stored),
					mapBooleanToFieldIndex(tokenized)));			
		}
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

	private Field.Store mapBooleanToFieldStore(boolean stored) {
		if (stored) {
			return Field.Store.YES;
		}
		return Field.Store.NO;
	}
	private Field.Index mapBooleanToFieldIndex(boolean tokenized) {
		if (tokenized) {
			return Field.Index.ANALYZED;
		}
		return Field.Index.NOT_ANALYZED;
	}
}
