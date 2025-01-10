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

// ---------- hoehensystem ----------
var hoehensystemId = sourceRecord.get("id");
var hoehensystemRows = SQL.all("SELECT * FROM hoehensystem WHERE id=?", [hoehensystemId]);
for (i=0; i<hoehensystemRows.size(); i++) {
    var hoehensystemRow = hoehensystemRows.get(i);
    var row = hoehensystemRow;
    var title = "Stammdaten HOEHENSYSTEM: ";
    var summary = "";
	var geobasUrl = "http://10.140.105.57:8080/geobas_q1/main?cmd=view_details&id=";

    IDX.add("hoehensystem.id", row.get("id"));
    IDX.add("hoehensystem.bundesland", row.get("bundesland"));
    IDX.add("hoehensystem.historie", row.get("historie"));
    IDX.add("hoehensystem.aktion", row.get("aktion"));
    IDX.add("hoehensystem.hoehensystemdef", row.get("hoehensystemdef"));
    IDX.add("hoehensystem.organisation", row.get("organisation"));
    IDX.add("hoehensystem.hoehensystemnummer", row.get("hoehensystemnummer"));
    IDX.add("hoehensystem.original", row.get("original"));

	title = title + row.get("hoehensystemnummer");
	geobasUrl = geobasUrl + row.get("id") + "&table=hoehensystem";

    // ---------- bundesland ----------
    var rows = SQL.all("SELECT * FROM bundesland WHERE id=?", [hoehensystemRow.get("bundesland")]);
    for (j=0; j<rows.size(); j++) {
    	var row = rows.get(j);
        IDX.add("bundesland.id", row.get("id"));
        IDX.add("bundesland.name", row.get("name"));
    	summary = summary + row.get("name");
   }

    // ---------- hoehensystemdef ----------
    var rows = SQL.all("SELECT * FROM hoehensystemdef WHERE id=?", [hoehensystemRow.get("hoehensystemdef")]);
    for (j=0; j<rows.size(); j++) {
    	var row = rows.get(j);
        IDX.add("hoehensystemdef.id", row.get("id"));
        IDX.add("hoehensystemdef.name", row.get("name"));
    	summary = summary + ", " + row.get("name");
    }

	summary = summary + ", " + hoehensystemRow.get("hoehensystemnummer");

    IDX.add("title", title);
    IDX.add("summary", summary);
    
    // deliver url or NOT !?
    // changes display in result list !
    // with URL the url is displayed below summary and title links to URL
    // without url title links to detail view !
    //IDX.add("url", geobasUrl);
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
