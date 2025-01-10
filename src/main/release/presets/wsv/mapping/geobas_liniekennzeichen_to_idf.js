/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2025 wemove digital solutions GmbH
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

// ========== liniekennzeichen ==========
var liniekennzeichenId = sourceRecord.get("id");
var liniekennzeichenRows = SQL.all("SELECT * FROM liniekennzeichen WHERE id=?", [liniekennzeichenId]);
for (i=0; i<liniekennzeichenRows.size(); i++) {
    var liniekennzeichenRow = liniekennzeichenRows.get(i);
    var title = "Linie LINIEKENNZEICHEN: ";

    // ---------- bundeswasserstr ----------
    var rows = SQL.all("SELECT * FROM bundeswasserstr WHERE id=?", [liniekennzeichenRow.get("bundeswasserstr")]);
    for (j=0; j<rows.size(); j++) {
        var bundeswasserstrRow = rows.get(j);
   }

    // ---------- linienart ----------
    var rows = SQL.all("SELECT * FROM linienart WHERE id=?", [liniekennzeichenRow.get("linienart")]);
    for (j=0; j<rows.size(); j++) {
        var linienartRow = rows.get(j);
    }

    // ---------- organisation ----------
    var rows = SQL.all("SELECT * FROM organisation WHERE id=?", [liniekennzeichenRow.get("organisation")]);
    for (j=0; j<rows.size(); j++) {
        var organisationRow = rows.get(j);
   }

    // ---------- bundesland ----------
    var rows = SQL.all("SELECT * FROM bundesland WHERE id=?", [organisationRow.get("bundesland")]);
    for (j=0; j<rows.size(); j++) {
        var bundeslandRow = rows.get(j);
   }


    title = title + bundeswasserstrRow.get("kurzbezeichnung") + ", " + linienartRow.get("kurzbezeichnung") + ", " + liniekennzeichenRow.get("liniennummer");

    DOM.addElement(idfBody, "h1").addText(title);
    DOM.addElement(idfBody, "p");

    DOM.addElement(idfBody, "p").addText("BWST: " + bundeswasserstrRow.get("kurzbezeichnung"));
    DOM.addElement(idfBody, "p").addText("WLA: " + linienartRow.get("kurzbezeichnung"));
    DOM.addElement(idfBody, "p").addText("Liniennummer: " + liniekennzeichenRow.get("liniennummer"));
    DOM.addElement(idfBody, "p").addText("Name der Wasserstra\u00DFe: " + bundeswasserstrRow.get("name"));
    DOM.addElement(idfBody, "p").addText("Linienart Name: " + linienartRow.get("name"));
    DOM.addElement(idfBody, "p").addText("Bezeichnung der Dienststelle: " + organisationRow.get("name"));
    DOM.addElement(idfBody, "p").addText("Dienststellen-Nr.: " + organisationRow.get("dienststellenid"));
    DOM.addElement(idfBody, "p").addText("Dienststelle Bundesland Name: " + bundeslandRow.get("name"));
    DOM.addElement(idfBody, "p").addText("Dienststelle Bundesland Kurzbezeichnung: " + bundeslandRow.get("kurzbezeichnung"));

    // ---------- link to GEOBAS ----------
    DOM.addElement(idfBody, "p");
    DOM.addElement(idfBody, "p/a")
        .addAttribute("href", "http://geobas.wsv.bvbs.bund.de/geobas_p1/main?cmd=view_details&id=" + liniekennzeichenRow.get("id") + "&table=liniekennzeichen")
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
