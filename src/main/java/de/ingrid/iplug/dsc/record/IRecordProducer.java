/**
 * 
 */
package de.ingrid.iplug.dsc.record;

import org.apache.lucene.document.Document;

import de.ingrid.iplug.dsc.om.SourceRecord;

/**
 * 
 * 
 * @author joachim
 *
 */
public interface IRecordProducer {

    void openDatasource();
    
    void closeDatasource();

    SourceRecord getRecord(Document doc);

    
}
