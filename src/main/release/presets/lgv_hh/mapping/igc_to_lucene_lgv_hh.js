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
	log.debug("LGV HH: Additional mapping of source record to lucene document: " + sourceRecord.toString());
}

if (!(sourceRecord instanceof DatabaseSourceRecord)) {
    throw new IllegalArgumentException("Record is no DatabaseRecord!");
}

// ---------- t01_object ----------
var objId = sourceRecord.get(DatabaseSourceRecord.ID);
var objRows = SQL.all("SELECT * FROM t01_object WHERE id=?", [objId]);
for (i=0; i<objRows.size(); i++) {
	addT01Object(objRows.get(i));
}

function addT01Object(row) {
    // add additional keyword explicit for hh ! Needed for new facet (REDMINE-122)
    if (hasValue(row.get("is_open_data")) && row.get("is_open_data")=='Y') {
        if (log.isInfoEnabled()) {
            log.info("LGV HH: Adding index Field \"t04_search.searchterm:#opendata_hh#\"");
        }
        // add as FREIER term, no alternate value
        addSearchtermValue("F", "#opendata_hh#", "");
    }
}

function addSearchtermValue(type, value, alternate_value) {
    IDX.add("t04_search.type", type);
    IDX.add("t04_search.searchterm", value);
    IDX.add("searchterm_value.alternate_term", alternate_value);
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
