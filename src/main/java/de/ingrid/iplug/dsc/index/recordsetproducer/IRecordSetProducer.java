/**
 * 
 */
package de.ingrid.iplug.dsc.index.recordsetproducer;

import de.ingrid.iplug.dsc.om.SourceRecord;

/**
 * This interface must be implemented from all record producing classes. Record
 * producer are objects that know how to produce a list of source records, that
 * can be mapped into other formats later.
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
