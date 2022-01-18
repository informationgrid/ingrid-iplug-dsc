/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2022 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.1 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * http://ec.europa.eu/idabc/eupl5
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

// ========== lagesystem ==========
var lagesystemId = sourceRecord.get("id");
var lagesystemRows = SQL.all("SELECT * FROM lagesystem WHERE id=?", [lagesystemId]);
for (i=0; i<lagesystemRows.size(); i++) {
    var lagesystemRow = lagesystemRows.get(i);
    var title = "Stammdaten LAGESYSTEM: ";

    // ---------- bundesland ----------
    var rows = SQL.all("SELECT * FROM bundesland WHERE id=?", [lagesystemRow.get("bundesland")]);
    for (j=0; j<rows.size(); j++) {
    	var bundeslandRow = rows.get(j);
    }

    // ---------- lagesystemdef ----------
    var rows = SQL.all("SELECT * FROM lagesystemdef WHERE id=?", [lagesystemRow.get("lagesystemdef")]);
    for (j=0; j<rows.size(); j++) {
    	var lagesystemdefRow = rows.get(j);
    }


    title = title + lagesystemRow.get("lagesystemnummer") + ", " + bundeslandRow.get("kurzbezeichnung") + ", " + lagesystemdefRow.get("id");

    DOM.addElement(idfBody, "h1").addText(title);
    DOM.addElement(idfBody, "p");

    DOM.addElement(idfBody, "p").addText("Bundesland Kurzbezeichnung: " + bundeslandRow.get("kurzbezeichnung"));
    DOM.addElement(idfBody, "p").addText("Bundesland: " + bundeslandRow.get("name"));
    DOM.addElement(idfBody, "p").addText("Bezeichnung des Lagesystems: " + lagesystemdefRow.get("name"));
    DOM.addElement(idfBody, "p").addText("Lagestatus: " + lagesystemRow.get("lagesystemnummer"));

    // ---------- link to GEOBAS ----------
    DOM.addElement(idfBody, "p");
    DOM.addElement(idfBody, "p/a")
        .addAttribute("href", "http://geobas.wsv.bvbs.bund.de/geobas_p1/main?cmd=view_details&id=" + lagesystemRow.get("id") + "&table=lagesystem")
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
