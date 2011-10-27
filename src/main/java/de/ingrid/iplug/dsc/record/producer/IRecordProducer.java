/**
 * 
 */
package de.ingrid.iplug.dsc.record.producer;

import org.apache.lucene.document.Document;

import de.ingrid.iplug.dsc.om.IClosableDataSource;
import de.ingrid.iplug.dsc.om.SourceRecord;

/**
 * Defines all aspects a record producer must implement. The record producer is
 * used to retrieve ONE record from the data source, based on a 
 * LuceneDocument for further processing.
 * 
 * @author joachim@wemove.com
 * 
 */
public interface IRecordProducer {

    /**
     * Open the data source. The functionality depends on the type of data
     * source. Returns a closable data source.
     * 
     * The parameters in {@link SourceRecord} returned by {@link getRecord} may
     * contain a reference to the data source, so that the following mapping
     * step can access the data source as well.
     * 
     */
    IClosableDataSource openDatasource();

    /**
     * Get a record from the data source. How the record must be derived from
     * the fields of the lucene document.
     * 
     * @param doc
     * @param ds
     * @return
     */
    SourceRecord getRecord(Document doc, IClosableDataSource ds);

}
