/**
 * Copyright (c) 2014 wemove GmbH
 * Licensed under the EUPL V.1.1
 *
 * This Software is provided to You under the terms of the European
 * Union Public License (the "EUPL") version 1.1 as published by the
 * European Union. Any use of this Software, other than as authorized
 * under this License is strictly prohibited (to the extent such use
 * is covered by a right of the copyright holder of this Software).
 *
 * This Software is provided under the License on an "AS IS" basis and
 * without warranties of any kind concerning the Software, including
 * without limitation merchantability, fitness for a particular purpose,
 * absence of defects or errors, accuracy, and non-infringement of
 * intellectual property rights other than copyright. This disclaimer
 * of warranty is an essential part of the License and a condition for
 * the grant of any rights to this Software.
 *
 * For more  details, see <http://joinup.ec.europa.eu/software/page/eupl>
 */
/**
 * 
 */
package de.ingrid.iplug.dsc.utils;

import java.io.IOException;
import java.io.StringReader;

import org.apache.log4j.Logger;
import org.apache.lucene.analysis.TokenStream;
import org.apache.lucene.analysis.tokenattributes.TermAttribute;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.NumericField;

import de.ingrid.admin.search.Stemmer;

/**
 * Helper class encapsulating functionality on Lucene Index (e.g. used in
 * mapping script). Must be instantiated to be thread safe.
 * 
 * @author Martin
 */
public class IndexUtils {

    private static final Logger log = Logger.getLogger(IndexUtils.class);

    private static String CONTENT_FIELD_NAME = "content";

    /** the Lucene Document where the fields are added ! */
    private Document luceneDoc = null;

    private static Stemmer _defaultStemmer;

    public IndexUtils(Document luceneDoc, Stemmer defaultStemmer) {
        this.luceneDoc = luceneDoc;
        this._defaultStemmer = defaultStemmer;
    }

    /**
     * Add a index field with the value to the index document. If analyzed=true
     * the field will be TOKENIZE, if analyze=false not (use this for IDs). The
     * field will be stored and added to a separate "content" field
     * (ADD_TO_CONTENT_FIELD) by default.
     * 
     * @param fieldName
     *            name of the field in the index
     * @param value
     *            content of the field !
     */
    public void add(String fieldName, String value, boolean analyzed) throws IOException {
        if (value == null) {
            value = "";
        }
        add(fieldName, value, Field.Store.YES, analyzed ? Field.Index.ANALYZED : Field.Index.NOT_ANALYZED);
        add(CONTENT_FIELD_NAME, value, Field.Store.NO, analyzed ? Field.Index.ANALYZED : Field.Index.NOT_ANALYZED);
        add(CONTENT_FIELD_NAME, filterTerm(value), Field.Store.NO, Field.Index.ANALYZED);
    }
    
    /**
     * Store a index field with the value to the index document. will not be tokenized. 
     * Invokes the private add method, mainly for storing an idf as string,
     * the wms indexer stores the idf already in the lucene index for faster fetching.
     * 
     * @param fieldName
     *            name of the field in the index
     * @param value
     *            content of the field !
     */
    public void store(String fieldName, String value) throws IOException {
        if (value == null) {
            value = "";
        }

        add(fieldName, value, Field.Store.YES, Field.Index.NOT_ANALYZED);
    }
    /**
     * Add a index field with the value to the index document. The field will be
     * TOKENIZE and STORE and will be added to a separate "content" field
     * (ADD_TO_CONTENT_FIELD) by default.
     * 
     * @param fieldName
     *            name of the field in the index
     * @param value
     *            content of the field !
     */
    public void add(String fieldName, String value) throws IOException {
        add(fieldName, value, true);
    }

    /**
     * Add a numeric index field with the value to the index document. The field
     * will be STOREed.
     * 
     * @param fieldName
     *            name of the field in the index
     * @param value
     *            content of the field !
     */
    public void addNumeric(String fieldName, String value) throws IOException {
        double val = 0;
        try {
            val = Double.parseDouble(value);
            luceneDoc.add(new NumericField(fieldName, Field.Store.YES, true).setDoubleValue(val));
        } catch (Exception e) {
            if (log.isDebugEnabled()) {
                log.debug("Value '" + value + "' is not a number. Ignoring field '" + fieldName + "'.");
            }
        }
    }

    private void add(String fieldName, String value, Field.Store stored, Field.Index tokenized) {
        if (log.isDebugEnabled()) {
            log.debug("Add field '" + fieldName + "' with value '" + value + "' to lucene document " + "(Field.Index="
                    + tokenized + ", Field.Store=" + stored + ")");
        }

        luceneDoc.add(new Field(fieldName, value, stored, tokenized));
    }

    /**
     * Remove Fields.
     * 
     * @param fieldName
     *            name of field to remove.
     */
    public void removeFields(String fieldName) {
        if (log.isDebugEnabled()) {
            log.debug("Removed ALL fields with name '" + fieldName + "'.");
        }

        luceneDoc.removeFields(fieldName);
    }

    private static String filterTerm(String term) {
        String result = "";

        TokenStream stream = _defaultStemmer.getAnalyzer().tokenStream(null, new StringReader(term));
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
    
    /**
     * Set a boost for this document in case it has more important information than other
     * (similar) documents! A boost should be greater than 1.0f to make a document more
     * important and less than 1.0f otherwise.
     * @param boost
     */
    public void addDocumentBoost(float boost) {
        luceneDoc.setBoost(boost);
    }
}
