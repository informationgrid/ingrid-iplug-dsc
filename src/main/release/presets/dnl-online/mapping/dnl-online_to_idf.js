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
importPackage(Packages.org.w3c.dom);
importPackage(Packages.de.ingrid.iplug.dsc.om);

if (log.isDebugEnabled()) {
	log.debug("Mapping source record to idf document: " + sourceRecord.toString());
}

if (!(sourceRecord instanceof DatabaseSourceRecord)) {
    throw new IllegalArgumentException("Record is no DatabaseRecord!");
}

// ---------- <idf:body> ----------
var idfBody = XPATH.getNode(idfDoc, "/idf:html/idf:body");

// ========== bundesland ==========
var objId = sourceRecord.get(DatabaseSourceRecord.ID);
var objRows = SQL.all("SELECT * FROM dnl_dokumente WHERE id=?", [objId]);
for (i=0; i<objRows.size(); i++) {
    var row = objRows.get(i);
    DOM.addElement(idfBody, "h1").addText(row.get("titel"));
    DOM.addElement(idfBody, "p");
    DOM.addElement(idfBody, "h5").addText("Beschreibung: " + getRenderValue(row.get("abstract")));
    DOM.addElement(idfBody, "p");
    DOM.addElement(idfBody, "p").addText("Titelzusatz: " + getRenderValue(row.get("titelzus")));
    DOM.addElement(idfBody, "p").addText("Autor: " + getRenderValue(row.get("autoren")));
    DOM.addElement(idfBody, "p").addText("Autoreninstitution: " + getRenderValue(row.get("autoreninst")));
    DOM.addElement(idfBody, "p").addText("ISBN: " + getRenderValue(row.get("isbn")));
    DOM.addElement(idfBody, "p").addText("Verlag: " + getRenderValue(row.get("verlag")));
    DOM.addElement(idfBody, "p").addText("Herausgeber: " + getRenderValue(row.get("hrsg")));
    DOM.addElement(idfBody, "p").addText("Herausgeberinstitution: " + getRenderValue(row.get("hrsginst")));
    DOM.addElement(idfBody, "p").addText("Erscheinungsjahr: " + getRenderValue(row.get("erschjahr")));
    DOM.addElement(idfBody, "p").addText("Zeitschrift: " + getRenderValue(row.get("zeitschrift")));
    DOM.addElement(idfBody, "p").addText("Signatur: " + getRenderValue(row.get("signatur")));
    DOM.addElement(idfBody, "p").addText("Fussnote: " + getRenderValue(row.get("fussnote")));
    DOM.addElement(idfBody, "p").addText("Bezug: " + getRenderValue(row.get("bezug")));
    DOM.addElement(idfBody, "p").addText("Schlagworte: " + getRenderValue(row.get("schlagworte")));
}

function getRenderValue(val) {
	if (!hasValue(val)) {
        return ""; 
    }
    return val;
}

function hasValue(val) {
    if (typeof val == "undefined") {
        return false; 
    } else if (val == null) {
        return false; 
    } else if (typeof val == "string" && val == "") {
        return false;
    } else if (typeof val == "object" && val.toString().equals("")) {
        return false;
    } else {
      return true;
    }
}
