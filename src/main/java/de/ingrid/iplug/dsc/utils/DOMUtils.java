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
	
	public class IdfElement {
	    
	    private Element e;
	    
	    public IdfElement (Element element) {
	        this.e = element;
	    }
	    
	    public IdfElement addElement(String qualifiedName) {
	        String[] qNames = qualifiedName.split("/");
	        Element parent = e;
	        Element newElement = null;
	        for (int i=0; i<qNames.length; i++) {
	            newElement = doc.createElement(qNames[i]);
	            parent.appendChild(newElement);
	            parent = newElement; 
	        }
	        return new IdfElement(newElement);
	    }
	    
	    public IdfElement addAttribute(String attrName, String attrValue) {
	        e.setAttribute(attrName, attrValue);
	        return this;
	    }
        
	    public IdfElement addText(String text) {
            e.appendChild(newTextNode(text));
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

	private DOMUtils() {
	}
	
	private void initialize(Document doc) {
		this.doc = doc;
	}

	public IdfElement addElement(Element element, String qualifiedName) {
	    return new IdfElement(element).addElement(qualifiedName);
	}

    public IdfElement addAttribute(Element element, String attrName, String attrValue) {
        element.setAttribute(attrName, attrValue);
        return new IdfElement(element);
    }

    public IdfElement addText(Element element, String text) {
        element.appendChild(newTextNode(text));
        return new IdfElement(element);
    }
    
    public IdfElement createElement(String qualifiedName) {
        return new IdfElement(doc.createElement(qualifiedName));
    }
	
    private Element newElement(String qualifiedName) {
        return doc.createElement(qualifiedName);
    }
	
	private Text newTextNode(String data) {
		return doc.createTextNode(data);
	}

}
