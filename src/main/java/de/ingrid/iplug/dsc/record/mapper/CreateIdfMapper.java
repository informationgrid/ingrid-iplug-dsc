/**
 * 
 */
package de.ingrid.iplug.dsc.record.mapper;

import org.apache.log4j.Logger;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import de.ingrid.iplug.dsc.om.SourceRecord;

/**
 * Creates a base InGrid Detail data Format (IDF) skeleton.
 * 
 * @author joachim@wemove.com
 * 
 */
public class CreateIdfMapper implements IIdfMapper {

    protected static final Logger log = Logger.getLogger(CreateIdfMapper.class);

    @Override
    public void map(SourceRecord record, Document doc) throws Exception {
        Element html = doc.createElementNS("http://www.portalu.de/IDF/1.0",
                "html");
        doc.appendChild(html);
        Element head = doc.createElementNS("http://www.portalu.de/IDF/1.0",
                "head");
        html.appendChild(head);
        Element body = doc.createElementNS("http://www.portalu.de/IDF/1.0",
                "body");
        html.appendChild(body);
    }

}
