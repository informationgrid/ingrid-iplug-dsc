/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2020 wemove digital solutions GmbH
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

// ---------- punktlage ----------
var punktlageId = sourceRecord.get("id");
var punktlageRows = SQL.all("SELECT * FROM punktlage WHERE id=?", [punktlageId]);
for (i=0; i<punktlageRows.size(); i++) {
    var punktlageRow = punktlageRows.get(i);
    var title = "Punktlage: ";
    var summary = "";

    IDX.add("punktlage.id", punktlageRow.get("id"));
    IDX.add("punktlage.lzk", punktlageRow.get("lzk"));
    IDX.add("punktlage.lagesystem", punktlageRow.get("lagesystem"));
    IDX.add("punktlage.punktkennzeichen", punktlageRow.get("punktkennzeichen"));
    IDX.add("punktlage.x_koordinate", punktlageRow.get("x_koordinate"));
    IDX.add("punktlage.y_koordinate", punktlageRow.get("y_koordinate"));
    IDX.add("punktlage.z_koordinate", punktlageRow.get("z_koordinate"));
    IDX.add("punktlage.datum", punktlageRow.get("datum"));
    IDX.add("punktlage.x_stdabweichung", punktlageRow.get("x_stdabweichung"));
    IDX.add("punktlage.y_stdabweichung", punktlageRow.get("y_stdabweichung"));
    IDX.add("punktlage.z_stdabweichung", punktlageRow.get("z_stdabweichung"));
    IDX.add("punktlage.bemerkung", punktlageRow.get("bemerkung"));

    // ---------- lagesystem ----------
    var rows = SQL.all("SELECT * FROM lagesystem WHERE id=?", [punktlageRow.get("lagesystem")]);
    var lagesystemnummer = "";
    for (j=0; j<rows.size(); j++) {
        var row = rows.get(j);

        IDX.add("lagesystem.id", row.get("id"));
        IDX.add("lagesystem.lagesystemnummer", row.get("lagesystemnummer"));
        IDX.add("lagesystem.bundesland", row.get("bundesland"));
        IDX.add("lagesystem.lagesystemdef", row.get("lagesystemdef"));

        lagesystemnummer = row.get("lagesystemnummer");
        title = title + lagesystemnummer;
   }

    // ---------- punktkennzeichen ----------
    var rows = SQL.all("SELECT * FROM punktkennzeichen WHERE id=?", [punktlageRow.get("punktkennzeichen")]);
    for (j=0; j<rows.size(); j++) {
        var row = rows.get(j);

        IDX.add("punktkennzeichen.id", row.get("id"));
        IDX.add("punktkennzeichen.station", row.get("station"));
        IDX.add("punktkennzeichen.punktnummer", row.get("punktnummer"));
        IDX.add("punktkennzeichen.valid", row.get("valid"));

        title = title + ", " + row.get("id");
        summary = summary + row.get("id");
    }


    title = title + ", " + punktlageRow.get("datum");
    summary = summary + ", " + lagesystemnummer;
    summary = summary + ", X=" + punktlageRow.get("x_koordinate");
    summary = summary + ", Y=" + punktlageRow.get("y_koordinate");
    summary = summary + ", Z=" + punktlageRow.get("z_koordinate");
    summary = summary + ", " + punktlageRow.get("datum");
    summary = summary + ", LZK=" + punktlageRow.get("lzk");
    if (hasValue(punktlageRow.get("bemerkung"))) {
        summary = summary + ", " + punktlageRow.get("bemerkung");    	
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
