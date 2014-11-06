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
