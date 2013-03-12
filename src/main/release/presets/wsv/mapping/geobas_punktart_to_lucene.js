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

// ---------- punktart ----------
var punktartId = sourceRecord.get(DatabaseSourceRecord.ID);
var punktartRows = SQL.all("SELECT * FROM punktart WHERE id=?", [punktartId]);
for (i=0; i<punktartRows.size(); i++) {
    var punktartRow = punktartRows.get(i);
    var title = "Stammdaten PUNKTART: ";
    var summary = "";

    IDX.add("punktart.id", punktartRow.get("id"));
    IDX.add("punktart.kurzbezeichnung", punktartRow.get("kurzbezeichnung"));
    IDX.add("punktart.name", punktartRow.get("name"));

    title = title + punktartRow.get("kurzbezeichnung") + ", " + punktartRow.get("name");
    summary = summary + punktartRow.get("kurzbezeichnung") + ", " + punktartRow.get("name");

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
