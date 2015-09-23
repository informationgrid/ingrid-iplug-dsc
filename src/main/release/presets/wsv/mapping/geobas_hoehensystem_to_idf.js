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

// ========== hoehensystem ==========
var hoehensystemId = sourceRecord.get(DatabaseSourceRecord.ID);
var hoehensystemRows = SQL.all("SELECT * FROM hoehensystem WHERE id=?", [hoehensystemId]);
for (i=0; i<hoehensystemRows.size(); i++) {
    var hoehensystemRow = hoehensystemRows.get(i);
    var row = hoehensystemRow;
    DOM.addElement(idfBody, "h1").addText("Stammdaten HOEHENSYSTEM: " + row.get("hoehensystemnummer"));
    DOM.addElement(idfBody, "p");

//    DOM.addElement(idfBody, "p").addText("Id: " + row.get("id"));

    // ---------- bundesland ----------
    var rows = SQL.all("SELECT * FROM bundesland WHERE id=?", [hoehensystemRow.get("bundesland")]);
    for (j=0; j<rows.size(); j++) {
    	var row = rows.get(j);
        DOM.addElement(idfBody, "p").addText("Bundesland: " + hoehensystemRow.get("bundesland") + ", " + row.get("name") + ", " + row.get("kurzbezeichnung"));
    }

    // ---------- hoehensystemdef ----------
    var rows = SQL.all("SELECT * FROM hoehensystemdef WHERE id=?", [hoehensystemRow.get("hoehensystemdef")]);
    for (j=0; j<rows.size(); j++) {
    	var row = rows.get(j);
        DOM.addElement(idfBody, "p").addText("Hoehensystemdef: " + hoehensystemRow.get("hoehensystemdef") + ", " + row.get("name"));
    }

    DOM.addElement(idfBody, "p").addText("Hoehensystemnummer: " + hoehensystemRow.get("hoehensystemnummer"));

    // ---------- Organisation ----------
    var rows = SQL.all("SELECT * FROM organisation WHERE id=?", [hoehensystemRow.get("organisation")]);
    for (j=0; j<rows.size(); j++) {
    	var row = rows.get(j);

    	var bundesland = row.get("bundesland");
        var bundeslandRow = SQL.first("SELECT * FROM bundesland WHERE id=?", [row.get("bundesland")]);
    	if (hasValue(bundeslandRow)) {
    		bundesland = bundeslandRow.get("name");
    	}
        DOM.addElement(idfBody, "p").addText("Organisation: " + row.get("id") + ", " + row.get("name") + ", " + row.get("strasse") + ", " + row.get("plz") + " " + row.get("ort") + ", " + bundesland);
    }

    // ---------- link to GEOBAS ----------
    DOM.addElement(idfBody, "p");
    DOM.addElement(idfBody, "p/a")
		.addAttribute("href", "http://geobas.wsv.bvbs.bund.de/geobas_p1/main?cmd=view_details&id=" + hoehensystemRow.get("id") + "&table=hoehensystem")
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
