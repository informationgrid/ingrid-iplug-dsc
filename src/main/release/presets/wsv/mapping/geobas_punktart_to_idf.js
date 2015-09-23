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

// ========== punktart ==========
var punktartId = sourceRecord.get(DatabaseSourceRecord.ID);
var punktartRows = SQL.all("SELECT * FROM punktart WHERE id=?", [punktartId]);
for (i=0; i<punktartRows.size(); i++) {
    var punktartRow = punktartRows.get(i);
    var title = "Stammdaten PUNKTART: ";
    title = title + punktartRow.get("kurzbezeichnung") + ", " + punktartRow.get("name");

    DOM.addElement(idfBody, "h1").addText(title);
    DOM.addElement(idfBody, "p");

    // ---------- punktart ----------
    DOM.addElement(idfBody, "p").addText("Punktart (WPA): " + punktartRow.get("kurzbezeichnung"));
    DOM.addElement(idfBody, "p").addText("Name: " + punktartRow.get("name"));

    // ---------- link to GEOBAS ----------
    DOM.addElement(idfBody, "p");
    DOM.addElement(idfBody, "p/a")
        .addAttribute("href", "http://geobas.wsv.bvbs.bund.de/geobas_p1/main?cmd=view_details&id=" + punktartRow.get("id") + "&table=punktart")
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
