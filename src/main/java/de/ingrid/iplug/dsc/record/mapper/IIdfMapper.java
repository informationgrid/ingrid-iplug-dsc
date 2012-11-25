/**
 * 
 */
package de.ingrid.iplug.dsc.record.mapper;

import org.w3c.dom.Document;

import de.ingrid.iplug.dsc.om.SourceRecord;

/**
 * Must be implemented by all mapper classes that map a {@link SourceRecord} to
 * an InGrid Detail data Format (IDF).
 * 
 * 
 * @author joachim@wemove.com
 * 
 */
public interface IIdfMapper {

    /**
     * Map a {@link SourceRecord} to an InGrid Detail data Format (IDF). The
     * implementing class must take care that all required parameters are
     * present in the {@link SourceRecord}.
     * 
     * @param record
     * @param doc
     * @throws Exception
     */
    public void map(SourceRecord record, Document doc) throws Exception;

}
