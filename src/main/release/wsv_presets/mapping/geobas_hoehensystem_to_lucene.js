/**
 * SourceRecord to Lucene Document mapping
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 *
 * The following global variable are passed from the application:
 *
 * @param sourceRecord A SourceRecord instance, that defines the input
 * @param luceneDoc A lucene Document instance, that defines the output
 * @param log A Log instance
 * @param SQL SQL helper class encapsulating utility methods
 * @param IDX Lucene index helper class encapsulating utility methods for output
 * @param TRANSF Helper class for transforming, processing values/fields.
 */
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
var hoehensystemId = sourceRecord.get(DatabaseSourceRecord.ID);
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

	title = title + row.get("bundesland") + ", " + row.get("hoehensystemdef") + ", " + row.get("hoehensystemnummer");
	geobasUrl = geobasUrl + row.get("id") + "&table=hoehensystem";

    // ---------- bundesland ----------
    var rows = SQL.all("SELECT * FROM bundesland WHERE id=?", [hoehensystemRow.get("bundesland")]);
    for (j=0; j<rows.size(); j++) {
    	var row = rows.get(j);
    	summary = summary + row.get("name");
   }

    // ---------- hoehensystemdef ----------
    var rows = SQL.all("SELECT * FROM hoehensystemdef WHERE id=?", [hoehensystemRow.get("hoehensystemdef")]);
    for (j=0; j<rows.size(); j++) {
    	var row = rows.get(j);
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
    } else if (typeof val == "object" && val.toString().equals("")) {
        return false;
    } else {
      return true;
    }
}
