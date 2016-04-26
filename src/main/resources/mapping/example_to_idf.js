/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2016 wemove digital solutions GmbH
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

// ---------- CREATE DETAIL DATA (IDF) OF A RESULT ----------

// extract id of the record and read record(s) from database
var objId = sourceRecord.get("id");
var objRows = SQL.all("SELECT * FROM [YOUR TABLE NAME] WHERE id=?", [objId]);
for (i=0; i<objRows.size(); i++) {
    var row = objRows.get(i);

    // Create HTML with data
    DOM.addElement(idfBody, "h1").addText(row.get("daten"));
    DOM.addElement(idfBody, "p");

//    DOM.addElement(idfBody, "p").addText("Id: " + row.get("id"));
    DOM.addElement(idfBody, "p").addText("Name: " + row.get("daten"));
    DOM.addElement(idfBody, "p").addText("Kurzbezeichnung: " + row.get("kurzbeschreibung"));

    // Example of various datasource links via iterating different columns of record
    DOM.addElement(idfBody, "p");
    var sourceTypes = ["WMS", "Dateidownload", "FTP", "AtomFeeed", "Portal", "SOS", "WFS", "WMTS", "JSON", "WSDL"];
    for (var i = 0; i < sourceTypes.length; i++) {
        var key = sourceTypes[i].toLowerCase();
        // hasValue function is defined in other script global.js also read by mapper !
        if (hasValue(row.get(key))) {
          DOM.addElement(idfBody, "p/a")
              .addAttribute("href", row.get(key))
              .addAttribute("target", "_blank")
              .addText(sourceTypes[i]);
        }
    }
}