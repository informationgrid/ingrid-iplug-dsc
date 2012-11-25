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

// ========== organisation ==========
var objId = sourceRecord.get(DatabaseSourceRecord.ID);
var objRows = SQL.all("SELECT * FROM organisation WHERE id=?", [objId]);
for (i=0; i<objRows.size(); i++) {
    var organisationRow = objRows.get(i);
    var row = organisationRow;
    DOM.addElement(idfBody, "h1").addText("Stammdaten ORGANISATION: " + row.get("name") + ", " + row.get("dienststellenid"));
    DOM.addElement(idfBody, "p");

    DOM.addElement(idfBody, "p").addText("Id: " + row.get("id"));
    DOM.addElement(idfBody, "p").addText("Name: " + row.get("name"));
    DOM.addElement(idfBody, "p").addText("Dienststellenid: " + row.get("dienststellenid"));
    DOM.addElement(idfBody, "p").addText("Strasse: " + row.get("strasse"));
    DOM.addElement(idfBody, "p").addText("Plz: " + row.get("plz"));
    DOM.addElement(idfBody, "p").addText("Ort: " + row.get("ort"));

    // ---------- Organisation ----------
    var rows = SQL.all("SELECT * FROM bundesland WHERE id=?", [row.get("bundesland")]);
    for (j=0; j<rows.size(); j++) {
    	var row = rows.get(j);

        DOM.addElement(idfBody, "p").addText("Bundesland: " + row.get("id") + ", " + row.get("name") + ", " + row.get("kurzbezeichnung"));
    }

    // ---------- link to GEOBAS ----------
    DOM.addElement(idfBody, "p");
    DOM.addElement(idfBody, "p/a")
		.addAttribute("href", "http://10.140.105.57:8080/geobas_q1/main?cmd=view_details&id=" + organisationRow.get("id") + "&table=organisation")
		.addText("GEOBAS")
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
