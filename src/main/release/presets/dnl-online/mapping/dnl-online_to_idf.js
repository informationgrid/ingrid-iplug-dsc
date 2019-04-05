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

// ========== bundesland ==========
var objId = sourceRecord.get("id");
var objRows = SQL.all("SELECT * FROM dnl_dokumente WHERE id=?", [objId]);
for (i=0; i<objRows.size(); i++) {
    var row = objRows.get(i);
    DOM.addElement(idfBody, "h1").addText(row.get("titel"));
    DOM.addElement(idfBody, "p");
    DOM.addElement(idfBody, "h5").addText("Beschreibung: " + getRenderValue(row.get("abstract")));
    DOM.addElement(idfBody, "p");
    DOM.addElement(idfBody, "p").addText("Titelzusatz: " + getRenderValue(row.get("titelzus")));
    DOM.addElement(idfBody, "p").addText("Autor: " + getRenderValue(row.get("autoren")));
    DOM.addElement(idfBody, "p").addText("Autoreninstitution: " + getRenderValue(row.get("autoreninst")));
    DOM.addElement(idfBody, "p").addText("ISBN: " + getRenderValue(row.get("isbn")));
    DOM.addElement(idfBody, "p").addText("Verlag: " + getRenderValue(row.get("verlag")));
    DOM.addElement(idfBody, "p").addText("Herausgeber: " + getRenderValue(row.get("hrsg")));
    DOM.addElement(idfBody, "p").addText("Herausgeberinstitution: " + getRenderValue(row.get("hrsginst")));
    DOM.addElement(idfBody, "p").addText("Erscheinungsjahr: " + getRenderValue(row.get("erschjahr")));
    DOM.addElement(idfBody, "p").addText("Zeitschrift: " + getRenderValue(row.get("zeitschrift")));
    DOM.addElement(idfBody, "p").addText("Signatur: " + getRenderValue(row.get("signatur")));
    DOM.addElement(idfBody, "p").addText("Fussnote: " + getRenderValue(row.get("fussnote")));
    DOM.addElement(idfBody, "p").addText("Bezug: " + getRenderValue(row.get("bezug")));
    DOM.addElement(idfBody, "p").addText("Schlagworte: " + getRenderValue(row.get("schlagworte")));
}

function getRenderValue(val) {
	if (!hasValue(val)) {
        return ""; 
    }
    return val;
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
