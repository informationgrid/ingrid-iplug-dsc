if (javaVersion.indexOf( "1.8" ) === 0) {
    load("nashorn:mozilla_compat.js");
}

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

// ========== bundeswasserstr ==========
var objId = sourceRecord.get("id");
var objRows = SQL.all("SELECT * FROM bundeswasserstr WHERE id=?", [objId]);
for (i=0; i<objRows.size(); i++) {
    var bundeswasserstrRow = objRows.get(i);
    var row = bundeswasserstrRow;
    DOM.addElement(idfBody, "h1").addText("Stammdaten BUNDESWASSERSTR: " + row.get("name") + ", " + row.get("kurzbezeichnung"));
    DOM.addElement(idfBody, "p");

//    DOM.addElement(idfBody, "p").addText("Id: " + row.get("id"));
    DOM.addElement(idfBody, "p").addText("BWST: " + row.get("kurzbezeichnung"));
    DOM.addElement(idfBody, "p").addText("Name der Wasserstra\u00DFe: " + row.get("name"));

    // ---------- link to GEOBAS ----------
    DOM.addElement(idfBody, "p");
    DOM.addElement(idfBody, "p/a")
        .addAttribute("href", "http://geobas.wsv.bvbs.bund.de/geobas_p1/main?cmd=view_details&id=" + bundeswasserstrRow.get("id") + "&table=bundeswasserstr")
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
