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

importPackage(Packages.org.apache.lucene.document);
importPackage(Packages.de.ingrid.iplug.dsc.om);
importPackage(Packages.de.ingrid.geo.utils.transformation);

if (log.isDebugEnabled()) {
	log.debug("Mapping source record to lucene document: " + sourceRecord.toString());
}

if (!(sourceRecord instanceof DatabaseSourceRecord)) {
    throw new IllegalArgumentException("Record is no DatabaseRecord!");
}

// ---------- lagesystem ----------
var lagesystemId = sourceRecord.get("id");
var lagesystemRows = SQL.all("SELECT * FROM lagesystem WHERE id=?", [lagesystemId]);
for (i=0; i<lagesystemRows.size(); i++) {
    var lagesystemRow = lagesystemRows.get(i);
    var title = "Stammdaten LAGESYSTEM: ";
    var summary = "";

    IDX.add("lagesystem.id", lagesystemRow.get("id"));
    IDX.add("lagesystem.lagesystemnummer", lagesystemRow.get("lagesystemnummer"));
    IDX.add("lagesystem.bundesland", lagesystemRow.get("bundesland"));
    IDX.add("lagesystem.lagesystemdef", lagesystemRow.get("lagesystemdef"));

    title = title + lagesystemRow.get("lagesystemnummer");

    // ---------- bundesland ----------
    var rows = SQL.all("SELECT * FROM bundesland WHERE id=?", [lagesystemRow.get("bundesland")]);
    for (j=0; j<rows.size(); j++) {
        var row = rows.get(j);
        IDX.add("bundesland.id", row.get("id"));
        IDX.add("bundesland.kurzbezeichnung", row.get("kurzbezeichnung"));
        IDX.add("bundesland.name", row.get("name"));

        title = title + ", " + row.get("kurzbezeichnung");
    	summary = summary + row.get("kurzbezeichnung") + " " + row.get("name");
   }

    // ---------- lagesystemdef ----------
    var rows = SQL.all("SELECT * FROM lagesystemdef WHERE id=?", [lagesystemRow.get("lagesystemdef")]);
    for (j=0; j<rows.size(); j++) {
        var row = rows.get(j);
        IDX.add("lagesystemdef.id", row.get("id"));
        IDX.add("lagesystemdef.name", row.get("name"));

        title = title + ", " + row.get("id");
    	summary = summary + ", " + row.get("id") + " " + rows.get(j).get("name");
    }

    summary = summary + ", " + lagesystemRow.get("lagesystemnummer");

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
