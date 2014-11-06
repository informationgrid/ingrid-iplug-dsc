/*
 * Copyright (c) 2014 wemove GmbH
 * Licensed under the EUPL V.1.1
 *
 * This Software is provided to You under the terms of the European
 * Union Public License (the "EUPL") version 1.1 as published by the
 * European Union. Any use of this Software, other than as authorized
 * under this License is strictly prohibited (to the extent such use
 * is covered by a right of the copyright holder of this Software).
 *
 * This Software is provided under the License on an "AS IS" basis and
 * without warranties of any kind concerning the Software, including
 * without limitation merchantability, fitness for a particular purpose,
 * absence of defects or errors, accuracy, and non-infringement of
 * intellectual property rights other than copyright. This disclaimer
 * of warranty is an essential part of the License and a condition for
 * the grant of any rights to this Software.
 *
 * For more  details, see <http://joinup.ec.europa.eu/software/page/eupl>
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
var objRows = SQL.all("SELECT * FROM bundesland WHERE id=?", [objId]);
for (i=0; i<objRows.size(); i++) {
    var bundeslandRow = objRows.get(i);
    var row = bundeslandRow;
    DOM.addElement(idfBody, "h1").addText("Stammdaten BUNDESLAND: " + row.get("name") + ", " + row.get("kurzbezeichnung"));
    DOM.addElement(idfBody, "p");

//    DOM.addElement(idfBody, "p").addText("Id: " + row.get("id"));
    DOM.addElement(idfBody, "p").addText("Name: " + row.get("name"));
    DOM.addElement(idfBody, "p").addText("Kurzbezeichnung: " + row.get("kurzbezeichnung"));

    // ---------- Organisation ----------
    var rows = SQL.all("SELECT * FROM organisation WHERE id=?", [row.get("organisation")]);
    for (j=0; j<rows.size(); j++) {
    	var row = rows.get(j);

    	var bundesland = row.get("bundesland");
        var tmpRow = SQL.first("SELECT * FROM bundesland WHERE id=?", [row.get("bundesland")]);
    	if (hasValue(tmpRow)) {
    		bundesland = tmpRow.get("name");
    	}
        DOM.addElement(idfBody, "p").addText("Organisation: " + row.get("id") + ", " + row.get("name") + ", " + row.get("strasse") + ", " + row.get("plz") + " " + row.get("ort") + ", " + bundesland);
    }

    // ---------- link to GEOBAS ----------
    DOM.addElement(idfBody, "p");
    DOM.addElement(idfBody, "p/a")
		.addAttribute("href", "http://geobas.wsv.bvbs.bund.de/geobas_p1/main?cmd=view_details&id=" + bundeslandRow.get("id") + "&table=bundesland")
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
