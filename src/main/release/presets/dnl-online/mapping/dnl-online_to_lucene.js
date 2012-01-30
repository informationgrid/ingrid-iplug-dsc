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

// ---------- dnl_dokumente ----------
var objId = sourceRecord.get(DatabaseSourceRecord.ID);
var objRows = SQL.all("SELECT * FROM dnl_dokumente WHERE id=?", [objId]);
for (i=0; i<objRows.size(); i++) {
    var row = objRows.get(i);

    // database ID seems to start at 0 !
    var databaseID = row.get("id");
    IDX.add("id", databaseID);
    // ID in URL starts at 1, so we have to add 1 to database ID !
    var idInURL = parseInt(databaseID) + 1;
    IDX.add("url", "http://www.dnl-online.de/1905.html?portalu=1&id=" + idInURL);

    IDX.add("title", row.get("titel"));
    IDX.add("t011_obj_data.description", row.get("titelzus"));
    IDX.add("t011_obj_literatur.publishing", row.get("verlag"));
    IDX.add("t011_obj_literatur.isbn", row.get("isbn"));
    IDX.add("t011_obj_literatur.publish_year", row.get("erschjahr"));
    IDX.add("t011_obj_literatur.publish_in", row.get("zeitschrift"));
    IDX.add("signatur", row.get("signatur"));
    IDX.add("t011_obj_literatur.description", row.get("fussnote"));
    IDX.add("t011_obj_literatur.doc_info", row.get("bezug"));
    IDX.add("summary", row.get("abstract"));
    IDX.add("fs_keywords", row.get("schlagworte"));
    IDX.add("t011_obj_literatur.autor", row.get("autoren"));
    IDX.add("autoreninstitution", row.get("autoreninst"));
    IDX.add("t011_obj_literatur.publisher", row.get("hrsg"));
    IDX.add("herausgeberinstitution", row.get("hrsginst"));
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
