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
package de.ingrid.iplug.dsc.utils;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import de.ingrid.iplug.dsc.utils.DOMUtils.IdfElement;
import de.ingrid.utils.xml.IDFNamespaceContext;
import de.ingrid.utils.xpath.XPathUtils;

import junit.framework.TestCase;

/**
 * @author joachim
 *
 */
public class DOMUtilsTest extends TestCase {

    /**
     * Test method for {@link de.ingrid.iplug.dsc.utils.DOMUtils#createElement(java.lang.String)}.
     */
    public void testCreateElement() {
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        DocumentBuilder docBuilder = null;
        try {
            docBuilder = dbf.newDocumentBuilder();
        } catch (ParserConfigurationException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        org.w3c.dom.Document idfDoc = docBuilder.newDocument();
        
        DOMUtils domUtils = new DOMUtils(idfDoc, new XPathUtils(new IDFNamespaceContext()));
        domUtils.addNS("idf", "http://www.portalu.de/IDF/1.0");
        
        IdfElement idfResponsibleParty = domUtils.createElement("idf:idfResponsibleParty")
        .addAttribute("uuid", "9728392738192739213")
        .addAttribute("type", "1");

        assertNotNull(idfResponsibleParty);
        
    }
    
    public void testCreateElementDontEscapeChars() {
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        DocumentBuilder docBuilder = null;
        try {
            docBuilder = dbf.newDocumentBuilder();
        } catch (ParserConfigurationException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        org.w3c.dom.Document idfDoc = docBuilder.newDocument();
        
        DOMUtils domUtils = new DOMUtils(idfDoc, new XPathUtils(new IDFNamespaceContext()));
        domUtils.addNS("idf", "textWith\"Invalid&amp;\"Chars");
        
        IdfElement idfResponsibleParty = domUtils.createElement("idf:idfResponsibleParty")
        .addAttribute("uuid", "972\"assertMe\"839273819&amp;2739213")
        .addAttribute("type", "1");
        
        IdfElement idfElement = domUtils.createElement("idfElement").addText("Test\"with&Uuml;sÄsAnd\"whatElse");
        
        assertEquals("Test\"with&Uuml;sÄsAnd\"whatElse",idfElement.getElement().getTextContent());
        assertEquals("972\"assertMe\"839273819&amp;2739213",idfResponsibleParty.getElement().getAttribute("uuid"));
        assertEquals("textWith\"Invalid&amp;\"Chars", domUtils.getNS("idf"));
    }

}
