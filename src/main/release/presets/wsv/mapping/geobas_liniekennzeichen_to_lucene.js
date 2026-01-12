/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2026 wemove digital solutions GmbH
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

importPackage(Packages.org.apache.lucene.document);
importPackage(Packages.de.ingrid.iplug.dsc.om);
importPackage(Packages.de.ingrid.geo.utils.transformation);

if (log.isDebugEnabled()) {
	log.debug("Mapping source record to lucene document: " + sourceRecord.toString());
}

if (!(sourceRecord instanceof DatabaseSourceRecord)) {
    throw new IllegalArgumentException("Record is no DatabaseRecord!");
}

// ---------- liniekennzeichen ----------
var liniekennzeichenId = sourceRecord.get("id");
var liniekennzeichenRows = SQL.all("SELECT * FROM liniekennzeichen WHERE id=?", [liniekennzeichenId]);
for (i=0; i<liniekennzeichenRows.size(); i++) {
    var liniekennzeichenRow = liniekennzeichenRows.get(i);
    var title = "Linie LINIEKENNZEICHEN: ";
    var summary = "";

    IDX.add("liniekennzeichen.id", liniekennzeichenRow.get("id"));
    IDX.add("liniekennzeichen.bundeswasserstr", liniekennzeichenRow.get("bundeswasserstr"));
    IDX.add("liniekennzeichen.linienart", liniekennzeichenRow.get("linienart"));
    IDX.add("liniekennzeichen.liniennummer", liniekennzeichenRow.get("liniennummer"));

    // ---------- bundeswasserstr ----------
    var rows = SQL.all("SELECT * FROM bundeswasserstr WHERE id=?", [liniekennzeichenRow.get("bundeswasserstr")]);
    for (j=0; j<rows.size(); j++) {
        var row = rows.get(j);
        IDX.add("bundeswasserstr.id", row.get("id"));
        IDX.add("bundeswasserstr.kurzbezeichnung", row.get("kurzbezeichnung"));
        IDX.add("bundeswasserstr.name", row.get("name"));

        title = title + row.get("kurzbezeichnung");
    	summary = summary + row.get("kurzbezeichnung") + " " + row.get("name");
   }

    // ---------- linienart ----------
    var rows = SQL.all("SELECT * FROM linienart WHERE id=?", [liniekennzeichenRow.get("linienart")]);
    for (j=0; j<rows.size(); j++) {
        var row = rows.get(j);
        IDX.add("linienart.id", row.get("id"));
        IDX.add("linienart.kurzbezeichnung", row.get("kurzbezeichnung"));
        IDX.add("linienart.name", row.get("name"));

        title = title + ", " + row.get("kurzbezeichnung");
        summary = summary + ", " + row.get("kurzbezeichnung") + " " + row.get("name");
    }

    title = title + ", " + liniekennzeichenRow.get("liniennummer");
    summary = summary + ", " + liniekennzeichenRow.get("liniennummer");

    IDX.add("title", title);
    IDX.add("summary", summary);
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
