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
package de.ingrid.iplug.dsc.record.mapper;

import org.apache.log4j.Logger;
import org.springframework.core.annotation.Order;
import org.w3c.dom.Document;

import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.iplug.dsc.utils.DOMUtils;
import de.ingrid.iplug.dsc.utils.DOMUtils.IdfElement;
import de.ingrid.utils.xml.IDFNamespaceContext;
import de.ingrid.utils.xpath.XPathUtils;

/**
 * Creates a base InGrid Detail data Format (IDF) skeleton.
 * 
 * @author joachim@wemove.com
 * 
 */
@Order(1)
public class CreateIdfMapper implements IIdfMapper {

    protected static final Logger log = Logger.getLogger(CreateIdfMapper.class);

    @Override
    public void map(SourceRecord record, Document doc) throws Exception {
        DOMUtils domUtils = new DOMUtils(doc, new XPathUtils(new IDFNamespaceContext()));
        domUtils.addNS("idf", "http://www.portalu.de/IDF/1.0");

        IdfElement html = domUtils.createElement("idf:html");
        doc.appendChild(html.getElement());
        html.addAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
        html.addAttribute("xsi:schemaLocation", domUtils.getNS("idf") + " ingrid_detail_data_schema.xsd");

        html.addElement("idf:head");
        html.addElement("idf:body");
    }

}
