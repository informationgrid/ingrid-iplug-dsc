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

// ========== punktkennzeichen ==========
var punktkennzeichenId = sourceRecord.get(DatabaseSourceRecord.ID);
var punktkennzeichenRows = SQL.all("SELECT * FROM punktkennzeichen WHERE id=?", [punktkennzeichenId]);
for (i=0; i<punktkennzeichenRows.size(); i++) {
    var punktkennzeichenRow = punktkennzeichenRows.get(i);
    var title = "Punktkennzeichen: ";

    // ---------- punktart ----------
    var rows = SQL.all("SELECT * FROM punktart WHERE id=?", [punktkennzeichenRow.get("punktart")]);
    for (j=0; j<rows.size(); j++) {
    	title = title + rows.get(j).get("name");
    }
	title = title + ", " + punktkennzeichenRow.get("station");
	title = title + ", " + punktkennzeichenRow.get("punktnummer");

	DOM.addElement(idfBody, "h1").addText(title);
    DOM.addElement(idfBody, "p");

    for (j=0; j<rows.size(); j++) {
    	var row = rows.get(j);
        DOM.addElement(idfBody, "p").addText("Punktart: " + row.get("name") + ", " + row.get("kurzbezeichnung"));
    }

    // ---------- bundeswasserstr ----------
    var rows = SQL.all("SELECT * FROM bundeswasserstr WHERE id=?", [punktkennzeichenRow.get("bundeswasserstr")]);
    for (j=0; j<rows.size(); j++) {
    	var row = rows.get(j);
        DOM.addElement(idfBody, "p").addText("Bundeswasserstr: " + row.get("name") + ", " + row.get("kurzbezeichnung"));
    }

    // ---------- ufer ----------
    var rows = SQL.all("SELECT * FROM ufer WHERE id=?", [punktkennzeichenRow.get("ufer")]);
    for (j=0; j<rows.size(); j++) {
    	var row = rows.get(j);
        DOM.addElement(idfBody, "p").addText("Ufer: " + row.get("name") + ", " + row.get("kurzbezeichnung"));
    }

    // ---------- punktkennzeichen ----------
    DOM.addElement(idfBody, "p").addText("Station: " + punktkennzeichenRow.get("station"));
    DOM.addElement(idfBody, "p").addText("Punktnummer: " + punktkennzeichenRow.get("punktnummer"));
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
