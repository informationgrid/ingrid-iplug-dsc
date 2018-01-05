/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2018 wemove digital solutions GmbH
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

// ========== punktlage ==========
var punktlageId = sourceRecord.get("id");
var punktlageRows = SQL.all("SELECT * FROM punktlage WHERE id=?", [punktlageId]);
for (i=0; i<punktlageRows.size(); i++) {
    var punktlageRow = punktlageRows.get(i);
    var title = "Punktlage: ";

    // ---------- lagesystem ----------
    var rows = SQL.all("SELECT * FROM lagesystem WHERE id=?", [punktlageRow.get("lagesystem")]);
    for (j=0; j<rows.size(); j++) {
        var lagesystemRow = rows.get(j);
    }

    // ---------- lagesystemdef ----------
    var rows = SQL.all("SELECT * FROM lagesystemdef WHERE id=?", [lagesystemRow.get("lagesystemdef")]);
    for (j=0; j<rows.size(); j++) {
        var lagesystemdefRow = rows.get(j);
    }

    // ---------- bundesland ----------
    var rows = SQL.all("SELECT * FROM bundesland WHERE id=?", [lagesystemRow.get("bundesland")]);
    for (j=0; j<rows.size(); j++) {
        var bundeslandRow = rows.get(j);
    }

    // ---------- punktkennzeichen ----------
    var rows = SQL.all("SELECT * FROM punktkennzeichen WHERE id=?", [punktlageRow.get("punktkennzeichen")]);
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


    title = title + lagesystemRow.get("lagesystemnummer") + ", " + punktlageRow.get("punktkennzeichen") + ", " + punktlageRow.get("datum");

    DOM.addElement(idfBody, "h1").addText(title);
    DOM.addElement(idfBody, "p");

    DOM.addElement(idfBody, "p").addText("Punktkennzeichen: " + punktlageRow.get("punktkennzeichen"));
    DOM.addElement(idfBody, "p").addText("Lagestatus: " + lagesystemRow.get("lagesystemnummer"));
    DOM.addElement(idfBody, "p").addText("Y/Rechtswert/East: " + punktlageRow.get("y_koordinate"));
    DOM.addElement(idfBody, "p").addText("X/Hochwert/North: " + punktlageRow.get("x_koordinate"));
    DOM.addElement(idfBody, "p").addText("Z-Koordinate: " + punktlageRow.get("z_koordinate"));
    DOM.addElement(idfBody, "p").addText("Datum der Lagemessung: " + punktlageRow.get("datum"));
    DOM.addElement(idfBody, "p").addText("Lagezuverl\u00E4ssigkeit: " + punktlageRow.get("lzk"));
    DOM.addElement(idfBody, "p").addText("Bemerkung zur Lage: " + punktlageRow.get("bemerkung"));
    DOM.addElement(idfBody, "p").addText("Name der Wasserstra\u00DFe: " + bundeswasserstrRow.get("name"));
    DOM.addElement(idfBody, "p").addText("Punktart Name: " + punktartRow.get("name"));
    DOM.addElement(idfBody, "p").addText("Bezeichnung des Lagesystems: " + lagesystemdefRow.get("name"));
    DOM.addElement(idfBody, "p").addText("Bundesland Name: " + bundeslandRow.get("name"));

    // ---------- link to GEOBAS ----------
    DOM.addElement(idfBody, "p");
    DOM.addElement(idfBody, "p/a")
        .addAttribute("href", "http://geobas.wsv.bvbs.bund.de/geobas_p1/main?cmd=view_details&id=" + punktlageRow.get("id") + "&table=punktlage")
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
