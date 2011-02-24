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
importPackage(Packages.java.sql);
importPackage(Packages.org.apache.lucene.document);
importPackage(Packages.de.ingrid.iplug.dsc.om);

if (log.isDebugEnabled()) {
	log.debug("Mapping source record to lucene document: " + sourceRecord.toString());
}


if (!(sourceRecord instanceof DatabaseSourceRecord)) {
    throw new IllegalArgumentException("Record is no DatabaseRecord!");
}

var id = sourceRecord.get(DatabaseSourceRecord.ID);

 
// ---------- t01_object ----------

var rows = SQL.all("SELECT * FROM t01_object WHERE id=?", [id]);
for (i=0; i<rows.size(); i++ ) {
    var row = rows.get(i);
/*
    // Example iterating all columns !
    var colNames = row.keySet().toArray();
    for (var i in colNames) {
        var colName = colNames[i];
        IDX.add(colName, row.get(colName));
	}
*/
    addT01Object(row);

    // TODO: - Coord mapping
}

function addT01Object(row) {
    IDX.add("t01_object.id", row.get("id"));
    IDX.add("t01_object.obj_id", row.get("obj_uuid"));
    IDX.add("title", row.get("obj_name"));
    IDX.add("t01_object.org_obj_id", row.get("org_obj_id"));
    IDX.add("t01_object.obj_class", row.get("obj_class"));
    IDX.add("summary", row.get("obj_descr"));
    IDX.add("t01_object.cat_id", row.get("cat_id"));
    IDX.add("t01_object.info_note", row.get("info_note"));
    IDX.add("t01_object.loc_descr", row.get("loc_descr"));

    // time: add t0, t1, t2 fields dependent from time_type
    TRANSF.processTimeFields(row.get("time_from"), row.get("time_to"), row.get("time_type"));
    IDX.add("t01_object.time_type", row.get("time_type"));
    IDX.add("t01_object.time_descr", row.get("time_descr"));
    IDX.add("t01_object.time_period", row.get("time_period"));
    IDX.add("t01_object.time_interval", row.get("time_interval"));
    IDX.add("t01_object.time_status", row.get("time_status"));
    IDX.add("t01_object.time_alle", row.get("time_alle"));

    IDX.add("t01_object.publish_id", row.get("publish_id"));
    IDX.add("t01_object.dataset_alternate_name", row.get("dataset_alternate_name"));
    IDX.add("t01_object.dataset_character_set", row.get("dataset_character_set"));
    IDX.add("t01_object.dataset_usage", row.get("dataset_usage"));
    IDX.add("t01_object.data_language_key", row.get("data_language_key"));
    IDX.add("t01_object.data_language", row.get("data_language"));
    IDX.add("t01_object.metadata_character_set", row.get("metadata_character_set"));
    IDX.add("t01_object.metadata_standard_name", row.get("metadata_standard_name"));
    IDX.add("t01_object.metadata_standard_version", row.get("metadata_standard_version"));
    IDX.add("t01_object.metadata_language_key", row.get("metadata_language_key"));
    IDX.add("t01_object.metadata_language", row.get("metadata_language"));
    IDX.add("t01_object.vertical_extent_minimum", row.get("vertical_extent_minimum"));
    IDX.add("t01_object.vertical_extent_maximum", row.get("vertical_extent_maximum"));
    IDX.add("t01_object.vertical_extent_unit", row.get("vertical_extent_unit"));
    IDX.add("t01_object.vertical_extent_vdatum", row.get("vertical_extent_vdatum"));
    IDX.add("t01_object.ordering_instructions", row.get("ordering_instructions"));
    IDX.add("t01_object.is_catalog_data", row.get("is_catalog_data"));
    IDX.add("t01_object.create_time", row.get("create_time"));
    IDX.add("t01_object.mod_time", row.get("mod_time"));
    IDX.add("t01_object.mod_uuid", row.get("mod_uuid"));
    IDX.add("t01_object.responsible_uuid", row.get("responsible_uuid"));
}
/*
function hasValue(val) {
    if (typeof val == "undefined") {
        return false; 
    } else if (val == null) {
        return false; 
    } else if (typeof val == "string" && val == "") {
        return false;
    } else {
      return true;
    }
}
*/