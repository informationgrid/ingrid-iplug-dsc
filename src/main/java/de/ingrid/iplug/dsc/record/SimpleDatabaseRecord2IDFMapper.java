/**
 * 
 */
package de.ingrid.iplug.dsc.record;

import org.w3c.dom.Document;

import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.SourceRecord;

/**
 * @author joachim
 *
 */
public class SimpleDatabaseRecord2IDFMapper implements IRecord2IdfMapper {

    /* (non-Javadoc)
     * @see de.ingrid.iplug.dsc.record.IRecord2IdfMapper#map(de.ingrid.iplug.dsc.index.recordsetproducer.SourceRecord, org.w3c.dom.Document)
     */
    @Override
    public void map(SourceRecord record, Document doc) {
        if (!(record instanceof DatabaseSourceRecord)) {
            throw new IllegalArgumentException("Record is no DatabaseRecord!");
        }

    }

}
