/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2015 wemove digital solutions GmbH
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

import org.apache.log4j.Logger;

import de.ingrid.utils.ElasticDocument;

/**
 * Helper class encapsulating functionality on Lucene Index (e.g. used in
 * mapping script). Must be instantiated to be thread safe.
 * 
 * @author Martin
 */
public class IndexUtils {

    private static final Logger log = Logger.getLogger( IndexUtils.class );

    private static final String BOOST = "boost";

    private static String CONTENT_FIELD_NAME = "content";

    /** the Lucene Document where the fields are added ! */
    private ElasticDocument luceneDoc = null;

    // @Deprecated
    // private static Stemmer _defaultStemmer;

    public IndexUtils(ElasticDocument luceneDoc) {
        this.luceneDoc = luceneDoc;
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
        this.luceneDoc.put( fieldName, value );
        if (analyzed && !value.isEmpty()) this.luceneDoc.put( CONTENT_FIELD_NAME, value );
    }

    /**
     * Store a index field with the value to the index document. will not be
     * tokenized. Invokes the private add method, mainly for storing an idf as
     * string, the wms indexer stores the idf already in the lucene index for
     * faster fetching.
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

        add( fieldName, value );// , Field.Store.YES, Field.Index.NOT_ANALYZED);
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
            val = Double.parseDouble( value );
            luceneDoc.put( fieldName, val );
        } catch (Exception e) {
            if (log.isDebugEnabled()) {
                log.debug( "Value '" + value + "' is not a number. Ignoring field '" + fieldName + "'." );
            }
        }
    }

    /**
     * Add a index field with the value to the index document.
     * 
     * @param fieldName
     *            name of the field in the index
     * @param value
     *            content of the field !
     * @throws IOException
     */
    public void add(String fieldName, String value) throws IOException {
        if (log.isDebugEnabled()) {
            log.debug( "Add field '" + fieldName + "' with value '" + value + "' to lucene document" );
        }

        add( fieldName, value, true );
    }

    /**
     * Remove Fields.
     * 
     * @param fieldName
     *            name of field to remove.
     */
    public void removeFields(String fieldName) {
        if (log.isDebugEnabled()) {
            log.debug( "Removed ALL fields with name '" + fieldName + "'." );
        }

        luceneDoc.remove( fieldName );
    }

    // private static String filterTerm(String term) {
    // String result = "";
    //
    // TokenStream stream = _defaultStemmer.getAnalyzer().tokenStream(null, new
    // StringReader(term));
    // // get the TermAttribute from the TokenStream
    // TermAttribute termAtt = (TermAttribute)
    // stream.addAttribute(TermAttribute.class);
    //
    // try {
    // stream.reset();
    // // add all tokens until stream is exhausted
    // while (stream.incrementToken()) {
    // result = result + " " + termAtt.term();
    // }
    // stream.end();
    // stream.close();
    // } catch (IOException ex) {
    // log.error("Problems tokenizing term " + term + ", we return full term.",
    // ex);
    // result = term;
    // }
    //
    // return result.trim();
    // }

    /**
     * Set a boost for this document in case it has more important information
     * than other (similar) documents! A boost should be greater than 1.0f to
     * make a document more important and less than 1.0f otherwise.
     * 
     * @param boost
     */
    public void addDocumentBoost(float boost) {
        luceneDoc.put( BOOST, boost );
    }
}
