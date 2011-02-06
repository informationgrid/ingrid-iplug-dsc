/**
 * 
 */
package de.ingrid.iplug.dsc.record;

import org.w3c.dom.Document;

import de.ingrid.iplug.dsc.om.SourceRecord;

/**
 * @author joachim
 *
 */
public interface IRecord2IdfMapper {
    
    public void map(SourceRecord record, Document doc);

}
