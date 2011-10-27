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

}
