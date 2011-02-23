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

    public static boolean TOKENIZE = true;
    public static boolean NO_TOKENIZE = false;

    public static boolean STORE = true;
    public static boolean NO_STORE = false;

    private Document luceneDoc = null;

	private static IndexUtils myInstance;

	/** Get The Singleton */
	public static synchronized IndexUtils getInstance(Document luceneDoc) {
		if (myInstance == null) {
	        myInstance = new IndexUtils(luceneDoc);
	      }
		return myInstance;
	}

	private IndexUtils(Document luceneDoc) {
		this.luceneDoc = luceneDoc;
	}
	
	/** Add a index field with the value to the index document.
	 * The field will be TOKENIZE and STORE by default. If field
	 * value is null (or "") then "" is set in index with NO_TOKENIZE
	 * and NO_STORE.
	 * @param fieldName name of the field in the index
	 * @param value field value to process
	 */
	public void add(String fieldName, String value) {
		if (value == null || value.trim().length() == 0) {
			add(fieldName, "", NO_TOKENIZE, NO_STORE);
		} else {
			add(fieldName, value, TOKENIZE, STORE);
		}
	}

	/** Add a index field with the value to the index document.
	 * The field will be tokenized and stored according to the supplied parameters
	 * @param fieldName name of the field in the index
	 * @param value field value to process
	 * @param tokenized use static TOKENIZE, NO_TOKENIZE consts in this class
	 * @param stored use static STORE, NO_STORE consts in this class
	 */
	public void add(String fieldName, String value, boolean tokenized, boolean stored) {
        log.debug("Add field '" + fieldName + "' with value '" + value + "' to lucene document " +
        		"(tokenized=" + tokenized + ", stored=" + stored +")");

		luceneDoc.add(new Field(fieldName,
				value,
				mapBooleanToFieldStore(stored),
				mapBooleanToFieldIndex(tokenized)));
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
