/**
 * SourceRecord to IDF Document mapping
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 *
 * The following global variable are passed from the application:
 *
 * @param sourceRecord A SourceRecord instance, that defines the input
 * @param idfDoc A IDF Document (XML-DOM) instance, that defines the output
 * @param log A Log instance
 * @param SQL SQL helper class encapsulating utility methods
 * @param XPATH xpath helper class encapsulating utility methods
 * @param TRANSF Helper class for transforming, processing values
 * @param DOM Helper class encapsulating processing DOM
 */
importPackage(Packages.java.sql);
importPackage(Packages.org.w3c.dom);
importPackage(Packages.de.ingrid.utils.xml);
importPackage(Packages.de.ingrid.iplug.dsc.om);

if (log.isDebugEnabled()) {
	log.debug("Mapping source record to idf document: " + sourceRecord.toString());
}

if (!(sourceRecord instanceof DatabaseSourceRecord)) {
    throw new IllegalArgumentException("Record is no DatabaseRecord!");
}
// ---------- Constants ----------
// Namespaces URI
var gmdURI = "http://www.isotc211.org/2005/gmd";
var gcoURI = "http://www.isotc211.org/2005/gco";
var srvURI = "http://www.isotc211.org/2005/srv";
var gmlURI = "http://www.opengis.net/gml";
var gtsURI = "http://www.isotc211.org/2005/gts";
var xlinkURI = "http://www.w3.org/1999/xlink";

// ---------- <idf:body> ----------
var idfBody = XPATH.getNode(idfDoc, "/idf:html/idf:body");

// ---------- <gmd:MD_Metadata> ----------
var gmdMetadata = idfBody.appendChild(DOM.createElement(gmdURI, "gmd:MD_Metadata"));
// add known namespaces
gmdMetadata.setAttribute("xmlns:gmd", gmdURI);
gmdMetadata.setAttribute("xmlns:gco", gcoURI);
gmdMetadata.setAttribute("xmlns:srv", srvURI);
gmdMetadata.setAttribute("xmlns:gml", gmlURI);
gmdMetadata.setAttribute("xmlns:gts", gtsURI);
gmdMetadata.setAttribute("xmlns:xlink", xlinkURI);
// and schema references
gmdMetadata.setAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
gmdMetadata.setAttribute("xsi:schemaLocation", gmdURI + " http://schemas.opengis.net/iso/19139/20060504/gmd/gmd.xsd");

// ========== t01_object ==========
var objId = sourceRecord.get(DatabaseSourceRecord.ID);
var objRows = SQL.all("SELECT * FROM t01_object WHERE id=?", [objId]);
for (i=0; i<objRows.size(); i++) {
    var objRow = objRows.get(i);
/*
    // Example iterating all columns !
    var objRow = objRows.get(i);
    var colNames = objRow.keySet().toArray();
    for (var i in colNames) {
        var colName = colNames[i];
        var colValue = objRow.get(colName);
    }
*/

// ---------- <gmd:fileIdentifier> ----------
    var value = objRow.get("org_obj_id");
    if (!hasValue(value)) {
        value = objRow.get("obj_uuid");
    }
    if (hasValue(value)) {
        gmdMetadata.appendChild(DOM.createElement(gmdURI, "gmd:fileIdentifier"))
            .appendChild(DOM.createElementWithText(gcoURI, "gco:CharacterString", value));
    }

// ---------- <gmd:language> ----------
    var value = objRow.get("metadata_language_key");
    if (hasValue(value)) {
        var langCodeValue = TRANSF.getLanguageISO639_2FromIGCCode(value);
        var langCodeElem = DOM.createElementWithText(gmdURI, "gmd:LanguageCode", langCodeValue);
        langCodeElem.setAttribute("codeList", "http://www.loc.gov/standards/iso639-2/");
        langCodeElem.setAttribute("codeListValue", langCodeValue);
        gmdMetadata.appendChild(DOM.createElement(gmdURI, "gmd:language"))
            .appendChild(langCodeElem);
    }
}

function hasValue(val) {
    if (typeof val == "undefined") {
        return false; 
    } else if (val == null) {
        return false; 
    } else if (typeof val == "string" && val == "") {
        return false;
    } else {
      return true;
    }
}
