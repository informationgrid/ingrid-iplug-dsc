/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2021 wemove digital solutions GmbH
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

// ========== punkthoehe ==========
var punkthoeheId = sourceRecord.get("id");
var punkthoeheRows = SQL.all("SELECT * FROM punkthoehe WHERE id=?", [punkthoeheId]);
for (i=0; i<punkthoeheRows.size(); i++) {
    var punkthoeheRow = punkthoeheRows.get(i);
    var title = "Punkthoehe: ";

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
    DOM.addElement(idfBody, "p").addText("H\u00F6henzuverl\u00E4ssigkeit: " + punkthoeheRow.get("hzk"));
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
