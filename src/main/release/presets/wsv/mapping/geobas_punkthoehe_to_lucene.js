/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2022 wemove digital solutions GmbH
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

importPackage(Packages.org.apache.lucene.document);
importPackage(Packages.de.ingrid.iplug.dsc.om);
importPackage(Packages.de.ingrid.geo.utils.transformation);

if (log.isDebugEnabled()) {
	log.debug("Mapping source record to lucene document: " + sourceRecord.toString());
}

if (!(sourceRecord instanceof DatabaseSourceRecord)) {
    throw new IllegalArgumentException("Record is no DatabaseRecord!");
}

// ---------- punkthoehe ----------
var punkthoeheId = sourceRecord.get("id");
var punkthoeheRows = SQL.all("SELECT * FROM punkthoehe WHERE id=?", [punkthoeheId]);
for (i=0; i<punkthoeheRows.size(); i++) {
    var punkthoeheRow = punkthoeheRows.get(i);
    var title = "Punkthoehe: ";
    var summary = "";

    IDX.add("punkthoehe.id", punkthoeheRow.get("id"));
    IDX.add("punkthoehe.hzk", punkthoeheRow.get("hzk"));
    IDX.add("punkthoehe.hoehensystem", punkthoeheRow.get("hoehensystem"));
    IDX.add("punkthoehe.punktkennzeichen", punkthoeheRow.get("punktkennzeichen"));
    IDX.add("punkthoehe.vermarkungsart", punkthoeheRow.get("vermarkungsart"));
    IDX.add("punkthoehe.h_stdabweichung", punkthoeheRow.get("h_stdabweichung"));
    IDX.add("punkthoehe.hoehe", punkthoeheRow.get("hoehe"));
    IDX.add("punkthoehe.bemerkung", punkthoeheRow.get("bemerkung"));
    IDX.add("punkthoehe.datum", punkthoeheRow.get("datum"));

    // ---------- hoehensystem ----------
    var rows = SQL.all("SELECT * FROM hoehensystem WHERE id=?", [punkthoeheRow.get("hoehensystem")]);
    var hoehensystemnummer = "";
    for (j=0; j<rows.size(); j++) {
        var row = rows.get(j);

        IDX.add("hoehensystem.id", row.get("id"));
        IDX.add("hoehensystem.bundesland", row.get("bundesland"));
        IDX.add("hoehensystem.historie", row.get("historie"));
        IDX.add("hoehensystem.aktion", row.get("aktion"));
        IDX.add("hoehensystem.hoehensystemdef", row.get("hoehensystemdef"));
        IDX.add("hoehensystem.organisation", row.get("organisation"));
        IDX.add("hoehensystem.hoehensystemnummer", row.get("hoehensystemnummer"));
        IDX.add("hoehensystem.original", row.get("original"));

        hoehensystemnummer = row.get("hoehensystemnummer");
        title = title + hoehensystemnummer;
   }

    // ---------- punktkennzeichen ----------
    var rows = SQL.all("SELECT * FROM punktkennzeichen WHERE id=?", [punkthoeheRow.get("punktkennzeichen")]);
    for (j=0; j<rows.size(); j++) {
        var row = rows.get(j);

        IDX.add("punktkennzeichen.id", row.get("id"));
        IDX.add("punktkennzeichen.station", row.get("station"));
        IDX.add("punktkennzeichen.punktnummer", row.get("punktnummer"));
        IDX.add("punktkennzeichen.valid", row.get("valid"));

        title = title + ", " + row.get("id");
        summary = summary + row.get("id");
    }


    title = title + ", " + punkthoeheRow.get("datum");
    summary = summary + ", " + hoehensystemnummer;
    summary = summary + ", Hoehe=" + punkthoeheRow.get("hoehe");
    summary = summary + ", " + punkthoeheRow.get("datum");
    summary = summary + ", HZK=" + punkthoeheRow.get("hzk");
    if (hasValue(punkthoeheRow.get("bemerkung"))) {
        summary = summary + ", " + punkthoeheRow.get("bemerkung");    	
    }

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
    } else if (typeof val == "object" && val.toString().equals("")) {
        return false;
    } else {
      return true;
    }
}
