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

// ---------- lagesystem ----------
var lagesystemId = sourceRecord.get(DatabaseSourceRecord.ID);
var lagesystemRows = SQL.all("SELECT * FROM lagesystem WHERE id=?", [lagesystemId]);
for (i=0; i<lagesystemRows.size(); i++) {
    var lagesystemRow = lagesystemRows.get(i);

/*
    // Example iterating all columns !
    var colNames = lagesystemRow.keySet().toArray();
    for (var i in colNames) {
        var colName = colNames[i];
        IDX.add(colName, lagesystemRow.get(colName));
	}
*/
    IDX.add("title", "Lagesystem: " + lagesystemRow.get("lagesystemnummer"));
    // only objects passed by ref, NOT plain strings !
    var summaryObj = { summary:"Stammdaten: " };

    addLagesystem(lagesystemRow, summaryObj);

    // ---------- bundesland ----------
    var rows = SQL.all("SELECT * FROM bundesland WHERE id=?", [lagesystemRow.get("bundesland")]);
    for (j=0; j<rows.size(); j++) {
    	addBundesland(rows.get(j), summaryObj);
    }

    // ---------- lagesystemdef ----------
    var rows = SQL.all("SELECT * FROM lagesystemdef WHERE id=?", [lagesystemRow.get("lagesystemdef")]);
    for (j=0; j<rows.size(); j++) {
    	addLagesystemdef(rows.get(j), summaryObj);
    }

    IDX.add("summary", summaryObj.summary);
}

function addLagesystem(row, summaryObj) {
    IDX.add("lagesystem.id", row.get("id"));
    IDX.add("lagesystem.lagesystemnummer", row.get("lagesystemnummer"));
    if (hasValue(row.get("lagesystemnummer"))) {
    	summaryObj.summary = summaryObj.summary + row.get("lagesystemnummer");
    }
}

function addBundesland(row, summary) {
    IDX.add("bundesland.id", row.get("id"));
    IDX.add("bundesland.kurzbezeichnung", row.get("kurzbezeichnung"));
    IDX.add("bundesland.name", row.get("name"));
    if (hasValue(row.get("name"))) {
    	summaryObj.summary = summaryObj.summary + ", " + row.get("name");
    }
}

function addLagesystemdef(row, summary) {
    IDX.add("lagesystemdef.id", row.get("id"));
    IDX.add("lagesystemdef.name", row.get("name"));
    if (hasValue(row.get("name"))) {
    	summaryObj.summary = summaryObj.summary + ", " + row.get("name");
    }
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
