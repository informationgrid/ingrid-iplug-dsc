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

// ========== punkthoehe ==========
var punkthoeheId = sourceRecord.get(DatabaseSourceRecord.ID);
var punkthoeheRows = SQL.all("SELECT * FROM punkthoehe WHERE id=?", [punkthoeheId]);
for (i=0; i<punkthoeheRows.size(); i++) {
    var punkthoeheRow = punkthoeheRows.get(i);
    var title = "Punkthöhe: ";

    // ---------- hoehensystem ----------
    var rows = SQL.all("SELECT * FROM hoehensystem WHERE id=?", [punkthoeheRow.get("hoehensystem")]);
    for (j=0; j<rows.size(); j++) {
        var hoehensystemRow = rows.get(j);
    }

    // ---------- hoehensystemdef ----------
    var rows = SQL.all("SELECT * FROM hoehensystemdef WHERE id=?", [hoehensystemRow.get("hoehensystemdef")]);
    for (j=0; j<rows.size(); j++) {
        var hoehensystemdefRow = rows.get(j);
    }

    // ---------- bundesland ----------
    var rows = SQL.all("SELECT * FROM bundesland WHERE id=?", [hoehensystemRow.get("bundesland")]);
    for (j=0; j<rows.size(); j++) {
        var bundeslandRow = rows.get(j);
    }

    // ---------- punktkennzeichen ----------
    var rows = SQL.all("SELECT * FROM punktkennzeichen WHERE id=?", [punkthoeheRow.get("punktkennzeichen")]);
    for (j=0; j<rows.size(); j++) {
        var punktkennzeichenRow = rows.get(j);
    }

    // ---------- bundeswasserstr ----------
    var rows = SQL.all("SELECT * FROM bundeswasserstr WHERE id=?", [punktkennzeichenRow.get("bundeswasserstr")]);
    for (j=0; j<rows.size(); j++) {
        var bundeswasserstrRow = rows.get(j);
    }

    // ---------- punktart ----------
    var rows = SQL.all("SELECT * FROM punktart WHERE id=?", [punktkennzeichenRow.get("punktart")]);
    for (j=0; j<rows.size(); j++) {
        var punktartRow = rows.get(j);
    }


    title = title + hoehensystemRow.get("hoehensystemnummer") + ", " + punkthoeheRow.get("punktkennzeichen") + ", " + punkthoeheRow.get("datum");

    DOM.addElement(idfBody, "h1").addText(title);
    DOM.addElement(idfBody, "p");

    DOM.addElement(idfBody, "p").addText("Punktkennzeichen: " + punkthoeheRow.get("punktkennzeichen"));
    DOM.addElement(idfBody, "p").addText("H\u00F6henstatus: " + hoehensystemRow.get("hoehensystemnummer"));
    DOM.addElement(idfBody, "p").addText("H\u00F6he: " + punkthoeheRow.get("hoehe"));
    DOM.addElement(idfBody, "p").addText("Datum der H\u00F6henmessung: " + punkthoeheRow.get("datum"));
    DOM.addElement(idfBody, "p").addText("H\u00F6henzuverl\u00E6ssigkeit: " + punkthoeheRow.get("hzk"));
    DOM.addElement(idfBody, "p").addText("Bemerkung zur H\u00F6he: " + punkthoeheRow.get("bemerkung"));
    DOM.addElement(idfBody, "p").addText("Name der Wasserstra\u00DFe: " + bundeswasserstrRow.get("name"));
    DOM.addElement(idfBody, "p").addText("Punktart Name: " + punktartRow.get("name"));
    DOM.addElement(idfBody, "p").addText("Bezeichnung des H\u00F6hensystems: " + hoehensystemdefRow.get("name"));
    DOM.addElement(idfBody, "p").addText("Bundesland Name: " + bundeslandRow.get("name"));

    // ---------- link to GEOBAS ----------
    DOM.addElement(idfBody, "p");
    DOM.addElement(idfBody, "p/a")
        .addAttribute("href", "http://geobas.wsv.bvbs.bund.de/geobas_p1/main?cmd=view_details&id=" + punkthoeheRow.get("id") + "&table=punkthoehe")
        .addAttribute("target", "_blank")
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
