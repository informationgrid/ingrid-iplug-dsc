/**
 * 
 */
package de.ingrid.iplug.dsc.utils;

import org.apache.log4j.Logger;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Text;

/**
 * Singleton helper class encapsulating functionality for DOM processing.
 *  
 * @author Martin
 */
public class DOMUtils {

    private static final Logger log = Logger.getLogger(DOMUtils.class);

    private Document doc = null;

	private static DOMUtils myInstance;

	/** Get The Singleton.
	 * NOTICE: Resets internal state, uses passed Document.
	 * @param doc always pass top document, e.g. used for creating elements ...
	 * @return
	 */
	public static synchronized DOMUtils getInstance(Document doc) {
		if (myInstance == null) {
	        myInstance = new DOMUtils();
		}
		myInstance.initialize(doc);

		return myInstance;
	}

	private DOMUtils() {
	}
	private void initialize(Document doc) {
		this.doc = doc;
	}

	public Element createElement(String namespaceURI, String qualifiedName) {
		return doc.createElementNS(namespaceURI, qualifiedName);
	}

	public Text createTextNode(String data) {
		return doc.createTextNode(data);
	}

	public Element createElementWithText(String namespaceURI, String elemQualifiedName, String text) {
	    Element elem = createElement(namespaceURI, elemQualifiedName);
	    elem.appendChild(createTextNode(text));    
	    return elem;
	}
}
