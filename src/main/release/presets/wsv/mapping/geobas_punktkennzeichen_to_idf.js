/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2024 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.2 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * https://joinup.ec.europa.eu/software/page/eupl
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * **************************************************#
 */
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

// ========== punktkennzeichen ==========
var punktkennzeichenId = sourceRecord.get("id");
var punktkennzeichenRows = SQL.all("SELECT * FROM punktkennzeichen WHERE id=?", [punktkennzeichenId]);
for (i=0; i<punktkennzeichenRows.size(); i++) {
    var punktkennzeichenRow = punktkennzeichenRows.get(i);
    var title = "Punktkennzeichen: ";

    // ---------- punktart for title ----------
    var rowsPunktart = SQL.all("SELECT * FROM punktart WHERE id=?", [punktkennzeichenRow.get("punktart")]);
    for (j=0; j<rowsPunktart.size(); j++) {
        var row = rowsPunktart.get(j);
    	title = title + row.get("name") + " (" + row.get("kurzbezeichnung") + ")";
    }

    // ---------- bundeswasserstr for title ----------
    var rowsBundeswasserstr = SQL.all("SELECT * FROM bundeswasserstr WHERE id=?", [punktkennzeichenRow.get("bundeswasserstr")]);
    for (j=0; j<rowsBundeswasserstr.size(); j++) {
    	var row = rowsBundeswasserstr.get(j);
        title = title + ", " + row.get("kurzbezeichnung");
    }

    title = title + ", " + punktkennzeichenRow.get("station");
    title = title + ", " + punktkennzeichenRow.get("punktnummer");

    DOM.addElement(idfBody, "h1").addText(title);
    DOM.addElement(idfBody, "p");

    // ---------- punktart ----------
    for (j=0; j<rowsPunktart.size(); j++) {
        var row = rowsPunktart.get(j);
        DOM.addElement(idfBody, "p").addText("Punktart: " + row.get("name") + ", " + row.get("kurzbezeichnung"));
    }

    // ---------- bundeswasserstr ----------
    for (j=0; j<rowsBundeswasserstr.size(); j++) {
        var row = rowsBundeswasserstr.get(j);
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

    // ---------- link to GEOBAS ----------
    DOM.addElement(idfBody, "p");
    DOM.addElement(idfBody, "p/a")
        .addAttribute("href", "http://geobas.wsv.bvbs.bund.de/geobas_p1/main?cmd=view_details&id=" + punktkennzeichenRow.get("id") + "&table=punktkennzeichen")
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
    } else if (typeof val == "object" && Object.keys(val).length === 0) {
        return false;
    } else {
      return true;
    }
}
