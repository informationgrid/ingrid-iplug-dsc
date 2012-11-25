/**
 * 
 */
package de.ingrid.iplug.dsc.index.producer;

import de.ingrid.iplug.dsc.om.SourceRecord;

/**
 * This interface must be implemented from all record producing classes. Record
 * producer are objects that know how to produce a list of source records, that
 * can be mapped into other formats later (i.e. Lucene Documents).
 * They need to be configured with the appropriate datasource access parameters.
 * 
 * @author joachim@wemove.com
 * 
 */
public interface IRecordSetProducer {

    /**
     * Returns true if more records are available and false if not.
     * 
     * @return
     */
    public boolean hasNext() throws Exception;

    /**
     * Retrieves the next record from the data source and returns it.
     * 
     * @return
     * @throws Exception
     */
    public SourceRecord next() throws Exception;

    
}
