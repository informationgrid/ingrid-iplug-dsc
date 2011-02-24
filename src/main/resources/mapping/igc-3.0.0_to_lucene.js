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

// ---------- t01_object ----------
var objId = sourceRecord.get(DatabaseSourceRecord.ID);
var objRows = SQL.all("SELECT * FROM t01_object WHERE id=?", [objId]);
for (i=0; i<objRows.size(); i++) {
/*
    // Example iterating all columns !
    var objRow = objRows.get(i);
    var colNames = objRow.keySet().toArray();
    for (var i in colNames) {
        var colName = colNames[i];
        IDX.add(colName, objRow.get(colName));
	}
*/
    addT01Object(objRows.get(i));

    // ---------- t0110_avail_format ----------
    var rows = SQL.all("SELECT * FROM t0110_avail_format WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addT0110AvailFormat(rows.get(j));
    }
    // ---------- t0113_dataset_reference ----------
    var rows = SQL.all("SELECT * FROM t0113_dataset_reference WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addT0113DatasetReference(rows.get(j));
    }
    // ---------- t014_info_impart ----------
    var rows = SQL.all("SELECT * FROM t014_info_impart WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addT014InfoImpart(rows.get(j));
    }
    // ---------- t015_legist ----------
    var rows = SQL.all("SELECT * FROM t015_legist WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addT015Legist(rows.get(j));
    }
    // ---------- t011_obj_literature ----------
    var rows = SQL.all("SELECT * FROM t011_obj_literature WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addT011ObjLiterature(rows.get(j));
    }
    // ---------- t011_obj_project ----------
    var rows = SQL.all("SELECT * FROM t011_obj_project WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addT011ObjProject(rows.get(j));
    }
    // ---------- t011_obj_data ----------
    var rows = SQL.all("SELECT * FROM t011_obj_data WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addT011ObjData(rows.get(j));
    }
    // ---------- t011_obj_data_para ----------
    var rows = SQL.all("SELECT * FROM t011_obj_data_para WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addT011ObjDataPara(rows.get(j));
    }
    // ---------- t011_obj_serv ----------
    var rows = SQL.all("SELECT * FROM t011_obj_serv WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addT011ObjServ(rows.get(j));
        var objServId = rows.get(j).get("id");

        // ---------- t011_obj_serv_operation ----------
        var subRows = SQL.all("SELECT * FROM t011_obj_serv_operation WHERE obj_serv_id=?", [objServId]);
        for (k=0; k<subRows.size(); k++) {
            addT011ObjServOperation(subRows.get(k));
            var objServOpId = subRows.get(k).get("id");

            // ---------- t011_obj_serv_op_connpoint ----------
            var subSubRows = SQL.all("SELECT * FROM t011_obj_serv_op_connpoint WHERE obj_serv_op_id=?", [objServOpId]);
            for (l=0; l<subSubRows.size(); l++) {
                addT011ObjServOpConnpoint(subSubRows.get(l));
            }
            // ---------- t011_obj_serv_op_depends ----------
            var subSubRows = SQL.all("SELECT * FROM t011_obj_serv_op_depends WHERE obj_serv_op_id=?", [objServOpId]);
            for (l=0; l<subSubRows.size(); l++) {
                addT011ObjServOpDepends(subSubRows.get(l));
            }
            // ---------- t011_obj_serv_op_para ----------
            var subSubRows = SQL.all("SELECT * FROM t011_obj_serv_op_para WHERE obj_serv_op_id=?", [objServOpId]);
            for (l=0; l<subSubRows.size(); l++) {
                addT011ObjServOpPara(subSubRows.get(l));
            }
            // ---------- t011_obj_serv_op_platform ----------
            var subSubRows = SQL.all("SELECT * FROM t011_obj_serv_op_platform WHERE obj_serv_op_id=?", [objServOpId]);
            for (l=0; l<subSubRows.size(); l++) {
                addT011ObjServOpPlatform(subSubRows.get(l));
            }
        }
        // ---------- t011_obj_serv_version ----------
        var subRows = SQL.all("SELECT * FROM t011_obj_serv_version WHERE obj_serv_id=?", [objServId]);
        for (k=0; k<subRows.size(); k++) {
            addT011ObjServVersion(subRows.get(k));
        }
        // ---------- t011_obj_serv_scale ----------
        var subRows = SQL.all("SELECT * FROM t011_obj_serv_scale WHERE obj_serv_id=?", [objServId]);
        for (k=0; k<subRows.size(); k++) {
            addT011ObjServScale(subRows.get(k));
        }
        // ---------- t011_obj_serv_type ----------
        var subRows = SQL.all("SELECT * FROM t011_obj_serv_type WHERE obj_serv_id=?", [objServId]);
        for (k=0; k<subRows.size(); k++) {
            addT011ObjServType(subRows.get(k));
        }
        // ---------- t011_obj_serv_url ----------
        var subRows = SQL.all("SELECT * FROM t011_obj_serv_url WHERE obj_serv_id=?", [objServId]);
        for (k=0; k<subRows.size(); k++) {
            addT011ObjServUrl(subRows.get(k));
        }
    }

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
    IDX.add("t01_object.data_language", row.get("data_language_value"));
    IDX.add("t01_object.metadata_character_set", row.get("metadata_character_set"));
    IDX.add("t01_object.metadata_standard_name", row.get("metadata_standard_name"));
    IDX.add("t01_object.metadata_standard_version", row.get("metadata_standard_version"));
    IDX.add("t01_object.metadata_language_key", row.get("metadata_language_key"));
    IDX.add("t01_object.metadata_language", row.get("metadata_language_value"));
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
function addT0110AvailFormat(row) {
    IDX.add("t0110_avail_format.line", row.get("line"));
    IDX.add("t0110_avail_format.name", row.get("format_value"));
    IDX.add("t0110_avail_format.format_key", row.get("format_key"));
    IDX.add("t0110_avail_format.version", row.get("ver"));
    IDX.add("t0110_avail_format.file_decompression_technique", row.get("file_decompression_technique"));
    IDX.add("t0110_avail_format.specification", row.get("specification"));
}
function addT0113DatasetReference(row) {
    IDX.add("t0113_dataset_reference.line", row.get("line"));
    IDX.add("t0113_dataset_reference.reference_date", row.get("reference_date"));
    IDX.add("t0113_dataset_reference.type", row.get("type"));
}
function addT014InfoImpart(row) {
    IDX.add("t014_info_impart.line", row.get("line"));
    IDX.add("t014_info_impart.impart_value", row.get("impart_value"));
    IDX.add("t014_info_impart.impart_key", row.get("impart_key"));
}
function addT015Legist(row) {
    IDX.add("t015_legist.line", row.get("line"));
    IDX.add("t015_legist.name", row.get("legist_value"));
    IDX.add("t015_legist.legist_key", row.get("legist_key"));
}
function addT011ObjLiterature(row) {
    IDX.add("t011_obj_literatur.autor", row.get("author"));
    IDX.add("t011_obj_literatur.publisher", row.get("publisher"));
    IDX.add("t011_obj_literature.type_key", row.get("type_key"));
    IDX.add("t011_obj_literatur.typ", row.get("type_value"));
    IDX.add("t011_obj_literatur.publish_in", row.get("publish_in"));
    IDX.add("t011_obj_literatur.volume", row.get("volume"));
    IDX.add("t011_obj_literatur.sides", row.get("sides"));
    IDX.add("t011_obj_literatur.publish_year", row.get("publish_year"));
    IDX.add("t011_obj_literatur.publish_loc", row.get("publish_loc"));
    IDX.add("t011_obj_literatur.loc", row.get("loc"));
    IDX.add("t011_obj_literatur.doc_info", row.get("doc_info"));
    IDX.add("t011_obj_literatur.base", row.get("base"));
    IDX.add("t011_obj_literatur.isbn", row.get("isbn"));
    IDX.add("t011_obj_literatur.publishing", row.get("publishing"));
    IDX.add("t011_obj_literatur.description", row.get("description"));
}
function addT011ObjProject(row) {
    IDX.add("t011_obj_project.leader", row.get("leader"));
    IDX.add("t011_obj_project.member", row.get("member"));
    IDX.add("t011_obj_project.description", row.get("description"));
}
function addT011ObjData(row) {
    IDX.add("t011_obj_data.base", row.get("base"));
    IDX.add("t011_obj_data.description", row.get("description"));
}
function addT011ObjDataPara(row) {
    IDX.add("t011_obj_data_para.line", row.get("line"));
    IDX.add("t011_obj_data_para.parameter", row.get("parameter"));
    IDX.add("t011_obj_data_para.unit", row.get("unit"));
}
function addT011ObjServ(row) {
    IDX.add("t011_obj_serv.type_key", row.get("type_key"));
    IDX.add("t011_obj_serv.type", row.get("type_value"));
    IDX.add("t011_obj_serv.history", row.get("history"));
    IDX.add("t011_obj_serv.environment", row.get("environment"));
    IDX.add("t011_obj_serv.base", row.get("base"));
    IDX.add("t011_obj_serv.description", row.get("description"));
    IDX.add("t011_obj_serv.has_access_constraint", row.get("has_access_constraint"));
}
function addT011ObjServOperation(row) {
    IDX.add("t011_obj_serv_operation.line", row.get("line"));
    IDX.add("t011_obj_serv_operation.name_key", row.get("name_key"));
    IDX.add("t011_obj_serv_operation.name", row.get("name_value"));
    IDX.add("t011_obj_serv_operation.descr", row.get("descr"));
    IDX.add("t011_obj_serv_operation.invocation_name", row.get("invocation_name"));
}
function addT011ObjServOpConnpoint(row) {
    IDX.add("t011_obj_serv_op_connpoint.line", row.get("line"));
    IDX.add("t011_obj_serv_op_connpoint.connect_point", row.get("connect_point"));
}
function addT011ObjServOpDepends(row) {
    IDX.add("t011_obj_serv_op_depends.line", row.get("line"));
    IDX.add("t011_obj_serv_op_depends.depends_on", row.get("depends_on"));
}
function addT011ObjServOpPara(row) {
    IDX.add("t011_obj_serv_op_para.line", row.get("line"));
    IDX.add("t011_obj_serv_op_para.name", row.get("name"));
    IDX.add("t011_obj_serv_op_para.direction", row.get("direction"));
    IDX.add("t011_obj_serv_op_para.descr", row.get("descr"));
    IDX.add("t011_obj_serv_op_para.optional", row.get("optional"));
    IDX.add("t011_obj_serv_op_para.repeatability", row.get("repeatability"));
}
function addT011ObjServOpPlatform(row) {
    IDX.add("t011_obj_serv_op_platform.line", row.get("line"));
    IDX.add("t011_obj_serv_op_platform.platform", row.get("platform"));
}
function addT011ObjServVersion(row) {
    IDX.add("t011_obj_serv_version.line", row.get("line"));
    IDX.add("t011_obj_serv_version.version", row.get("serv_version"));
}
function addT011ObjServScale(row) {
    IDX.add("t011_obj_serv_scale.line", row.get("line"));
    IDX.add("t011_obj_serv_scale.scale", row.get("scale"));
    IDX.add("t011_obj_serv_scale.resolution_ground", row.get("resolution_ground"));
    IDX.add("t011_obj_serv_scale.resolution_scan", row.get("resolution_scan"));
}
function addT011ObjServType(row) {
    IDX.add("t011_obj_serv_type.line", row.get("line"));
    IDX.add("t011_obj_serv_type.serv_type_key", row.get("serv_type_key"));
    IDX.add("t011_obj_serv_type.serv_type_value", row.get("serv_type_value"));
}
function addT011ObjServUrl(row) {
    IDX.add("t011_obj_serv_url.line", row.get("line"));
    IDX.add("t011_obj_serv_url.name", row.get("name"));
    IDX.add("t011_obj_serv_url.url", row.get("url"));
    IDX.add("t011_obj_serv_url.description", row.get("description"));
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