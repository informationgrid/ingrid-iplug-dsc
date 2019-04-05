/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2019 wemove digital solutions GmbH
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

// ========== organisation ==========
var objId = sourceRecord.get("id");
var objRows = SQL.all("SELECT * FROM organisation WHERE id=?", [objId]);
for (i=0; i<objRows.size(); i++) {
    var organisationRow = objRows.get(i);
    var row = organisationRow;
    DOM.addElement(idfBody, "h1").addText("Stammdaten ORGANISATION: " + row.get("name") + ", " + row.get("dienststellenid"));
    DOM.addElement(idfBody, "p");

//    DOM.addElement(idfBody, "p").addText("Id: " + row.get("id"));
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
		.addAttribute("href", "http://geobas.wsv.bvbs.bund.de/geobas_p1/main?cmd=view_details&id=" + organisationRow.get("id") + "&table=organisation")
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
