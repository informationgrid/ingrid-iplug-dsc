/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2022 wemove digital solutions GmbH
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
