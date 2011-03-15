/**
 * 
 */
package de.ingrid.iplug.dsc.utils;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang.StringEscapeUtils;
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

    private Document myDoc = null;

    /** Maps namespace prefix to URI */
    private Map<String, String> myNSMap = new HashMap<String, String>();

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
		this.myDoc = doc;
	}

	/** Add a namespace before creating an element of that NS ! */
	public void addNS(String prefix, String uri) {
		myNSMap.put(prefix, uri);
	}
	/** Get the URI of a Namespace prefix.
	 * @param prefix
	 * @return null if not added yet
	 */
	public String getNS(String prefix) {
		return myNSMap.get(prefix);
	}


	public class IdfElement {
	    
	    private Element e;
	    
	    public IdfElement (Element element) {
	        this.e = element;
	    }
	    
	    public IdfElement addElement(String qualifiedName) {
	        String[] qNames = qualifiedName.split("/");
	        Element parent = e;
	        Element newElement = null;
	        for (String qName : qNames) {
	        	newElement = domCreateElement(qName);
	            parent.appendChild(newElement);
	            parent = newElement; 
	        }
	        return new IdfElement(newElement);
	    }
	    
	    public IdfElement addAttribute(String attrName, String attrValue) {
	    	DOMUtils.this.addAttribute(e, attrName, attrValue);
	        return this;
	    }
        
	    public IdfElement addText(String text) {
            e.appendChild(domNewTextNode(text));
            return this;
        }
	    
        public IdfElement addElement(IdfElement element) {
            e.appendChild(element.getElement());
            return element;
        }
        
        public Element getElement() {
            return e;
        }
	}

	public IdfElement addElement(Element element, String qualifiedName) {
	    return new IdfElement(element).addElement(qualifiedName);
	}

    public IdfElement addAttribute(Element element, String attrName, String attrValue) {
        element.setAttribute(attrName, escapeXmlText(attrValue));
        return new IdfElement(element);
    }

    public IdfElement addText(Element element, String text) {
        element.appendChild(domNewTextNode(text));
        return new IdfElement(element);
    }
    
    public IdfElement createElement(String qualifiedName) {
        return new IdfElement(domCreateElement(qualifiedName));
    }
	
    private Element domCreateElement(String qualifiedName) {
		Element retValue = null;
		
        String[] prefixWithName = qualifiedName.split(":", 2);
        if (prefixWithName.length > 1) {
        	// we can use the full qualified name when creating with NS !
        	retValue = domNewElementNS(prefixWithName[0], qualifiedName);		        	
        } else {
        	retValue = domNewElement(qualifiedName);
        }

        return retValue;
    }
	
    /** Create an Element WITHOUT NameSpace (NS) qualification !
     * @param nameWithoutNS if you pass name with NS prefix (*:*), the prefix isn't handles as namespace !
     * @return null if problems
     */
    private Element domNewElement(String nameWithoutNS) {
		Element retValue = null;
		try {
			retValue = myDoc.createElement(nameWithoutNS);
		} catch (Exception ex) {
			log.error("Problems creating DOM Element '" + nameWithoutNS + "' -> DOM Doc for creation = '" + myDoc + "'", ex);
		}

        return retValue;
    }

    /** Create an Element WITH NameSpace (NS) qualification !
     * Namespace URI must be added with its prefix to internal map  before calling this method !!! 
	 * @param nsKey key of NS, must be present in internal map for mapping to URI !
	 * @param qualifiedName can be the full qualified name including namespace prefix !
	 * @return null if problems
	 */
	private Element domNewElementNS(String nsKey, String qualifiedName) {
		Element retValue = null;

		String nsUri = myNSMap.get(nsKey);
		try {
			retValue = myDoc.createElementNS(nsUri, qualifiedName);
		} catch (Exception ex) {
			log.error("Problems creating DOM Element '" + qualifiedName + "' -> nsKey = '" + nsKey +
					"', found nsUri = '" + nsUri + "', DOM Doc for creation = '" + myDoc + "'", ex);
		}
		
		return retValue;
	}
	
	private Text domNewTextNode(String data) {
		return myDoc.createTextNode(escapeXmlText(data));
	}

	private String escapeXmlText(String text) {
		return StringEscapeUtils.escapeXml(text);
	}

}
