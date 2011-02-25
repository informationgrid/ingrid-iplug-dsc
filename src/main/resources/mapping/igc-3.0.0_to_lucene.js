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
    var catalogId = objRows.get(i).get("cat_id");
    var objUuid = objRows.get(i).get("obj_uuid");

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
    // ---------- t011_obj_geo ----------
    var rows = SQL.all("SELECT * FROM t011_obj_geo WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addT011ObjGeo(rows.get(j));
        var objGeoId = rows.get(j).get("id");

        // ---------- t011_obj_geo_keyc ----------
        var subRows = SQL.all("SELECT * FROM t011_obj_geo_keyc WHERE obj_geo_id=?", [objGeoId]);
        for (k=0; k<subRows.size(); k++) {
            addT011ObjGeoKeyc(subRows.get(k));
        }
        // ---------- t011_obj_geo_scale ----------
        var subRows = SQL.all("SELECT * FROM t011_obj_geo_scale WHERE obj_geo_id=?", [objGeoId]);
        for (k=0; k<subRows.size(); k++) {
            addT011ObjGeoScale(subRows.get(k));
        }
        // ---------- t011_obj_geo_spatial_rep ----------
        var subRows = SQL.all("SELECT * FROM t011_obj_geo_spatial_rep WHERE obj_geo_id=?", [objGeoId]);
        for (k=0; k<subRows.size(); k++) {
            addT011ObjGeoSpatialRep(subRows.get(k));
        }
        // ---------- t011_obj_geo_supplinfo ----------
        var subRows = SQL.all("SELECT * FROM t011_obj_geo_supplinfo WHERE obj_geo_id=?", [objGeoId]);
        for (k=0; k<subRows.size(); k++) {
            addT011ObjGeoSupplinfo(subRows.get(k));
        }
        // ---------- t011_obj_geo_symc ----------
        var subRows = SQL.all("SELECT * FROM t011_obj_geo_symc WHERE obj_geo_id=?", [objGeoId]);
        for (k=0; k<subRows.size(); k++) {
            addT011ObjGeoSymc(subRows.get(k));
        }
        // ---------- t011_obj_geo_vector ----------
        var subRows = SQL.all("SELECT * FROM t011_obj_geo_vector WHERE obj_geo_id=?", [objGeoId]);
        for (k=0; k<subRows.size(); k++) {
            addT011ObjGeoVector(subRows.get(k));
        }
    }
    // ---------- t03_catalogue ----------
    var rows = SQL.all("SELECT * FROM t03_catalogue WHERE id=?", [catalogId]);
    for (j=0; j<rows.size(); j++) {
        addT03Catalogue(rows.get(j));
    }
    // ---------- t0112_media_option ----------
    var rows = SQL.all("SELECT * FROM t0112_media_option WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addT0112MediaOption(rows.get(j));
    }
    // ---------- t017_url_ref ----------
    var rows = SQL.all("SELECT * FROM t017_url_ref WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addT017UrlRef(rows.get(j));
    }
    // ---------- searchterm_obj ----------
    var rows = SQL.all("SELECT * FROM searchterm_obj WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addSearchtermObj(rows.get(j));
        var searchtermId = rows.get(j).get("searchterm_id");

        // ---------- searchterm_value ----------
        var subRows = SQL.all("SELECT * FROM searchterm_value WHERE id=?", [searchtermId]);
        for (k=0; k<subRows.size(); k++) {
            addSearchtermValue(subRows.get(k));
            var searchtermSnsId = subRows.get(k).get("searchterm_sns_id");           
            if (hasValue(searchtermSnsId)) {
	            // ---------- searchterm_sns ----------
	            var subSubRows = SQL.all("SELECT * FROM searchterm_sns WHERE id=?", [searchtermSnsId]);
	            for (l=0; l<subSubRows.size(); l++) {
	                addSearchtermSns(subSubRows.get(l));
	            }
            }
        }
    }
    // ---------- t012_obj_adr ----------
    var rows = SQL.all("SELECT * FROM t012_obj_adr WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addT012ObjAdr(rows.get(j));
        var adrUuid = rows.get(j).get("adr_uuid");

        // ---------- referenced address_node ----------
        var subRows = SQL.all("SELECT * FROM address_node WHERE addr_uuid=?", [adrUuid]);
        for (k=0; k<subRows.size(); k++) {
            var addrIdPublished = subRows.get(k).get("addr_id_published");

	        // ---------- t02_address ----------
	        var subSubRows = SQL.all("SELECT * FROM t02_address WHERE id=?", [addrIdPublished]);
	        for (l=0; l<subSubRows.size(); l++) {
	            addT02Address(subSubRows.get(l));
	        }
	        // ---------- t021_communication ----------
	        var subSubRows = SQL.all("SELECT * FROM t021_communication WHERE adr_id=?", [addrIdPublished]);
	        for (l=0; l<subSubRows.size(); l++) {
	            addT021Communication(subSubRows.get(l));
	        }
            // ---------- address_node CHILDREN ----------
            // only published ones !
            var subSubRows = SQL.all("SELECT * FROM address_node WHERE fk_addr_uuid=? AND addr_id_published IS NOT NULL", [adrUuid]);
            for (l=0; l<subSubRows.size(); l++) {
                addAddressNodeChildren(subSubRows.get(l));
            }
        }
    }
    // ---------- spatial_reference ----------
    var rows = SQL.all("SELECT * FROM spatial_reference WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addSpatialReference(rows.get(j));
        var spatialRefId = rows.get(j).get("spatial_ref_id");

        // ---------- spatial_ref_value ----------
        var subRows = SQL.all("SELECT * FROM spatial_ref_value WHERE id=?", [spatialRefId]);
        for (k=0; k<subRows.size(); k++) {
            addSpatialRefValue(subRows.get(k));
            var spatialRefSnsId = subRows.get(k).get("spatial_ref_sns_id");           
            if (hasValue(spatialRefSnsId)) {
                // ---------- spatial_ref_sns ----------
                var subSubRows = SQL.all("SELECT * FROM spatial_ref_sns WHERE id=?", [spatialRefSnsId]);
                for (l=0; l<subSubRows.size(); l++) {
                    addSpatialRefSns(subSubRows.get(l));
                }
            }
        }
    }
    // ---------- object_node CHILDREN ----------
    // only published ones !
    var rows = SQL.all("SELECT * FROM object_node WHERE fk_obj_uuid=? AND obj_id_published IS NOT NULL", [objUuid]);
    for (j=0; j<rows.size(); j++) {
        addObjectNodeChildren(rows.get(j));
    }
    // ---------- object_node PARENT ----------
    // NOTICE: Has to be published !
    var rows = SQL.all("SELECT fk_obj_uuid FROM object_node WHERE obj_uuid=?", [objUuid]);
    for (j=0; j<rows.size(); j++) {
        addObjectNodeParent(rows.get(j));
    }
    // ---------- object_reference TO ----------
    var rows = SQL.all("SELECT * FROM object_reference WHERE obj_from_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addObjectReferenceTo(rows.get(j));
    }
    // ---------- object_reference FROM ----------
    var rows = SQL.all("SELECT * FROM object_reference WHERE obj_to_uuid=?", [objUuid]);
    for (j=0; j<rows.size(); j++) {
        addObjectReferenceFrom(rows.get(j));
        var objFromId = rows.get(j).get("obj_from_id");

        // ---------- t01_object FROM ----------
        var subRows = SQL.all("SELECT * FROM t01_object WHERE id=?", [objFromId]);
        for (k=0; k<subRows.size(); k++) {
            addT01ObjectFrom(subRows.get(k));
        }
    }
    // ---------- t0114_env_category ----------
    var rows = SQL.all("SELECT * FROM t0114_env_category WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addT0114EnvCategory(rows.get(j));
    }
    // ---------- t0114_env_topic ----------
    var rows = SQL.all("SELECT * FROM t0114_env_topic WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addT0114EnvTopic(rows.get(j));
    }
    // ---------- t011_obj_topic_cat ----------
    var rows = SQL.all("SELECT * FROM t011_obj_topic_cat WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addT011ObjTopicCat(rows.get(j));
    }
    // ---------- object_access ----------
    var rows = SQL.all("SELECT * FROM object_access WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addObjectAccess(rows.get(j));
    }
    // ---------- object_use ----------
    var rows = SQL.all("SELECT * FROM object_use WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addObjectUse(rows.get(j));
    }
    // ---------- object_conformity ----------
    var rows = SQL.all("SELECT * FROM object_conformity WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addObjectConformity(rows.get(j));
    }
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

    // time: first add pure database values (not needed, but we can do this now ;)
    IDX.add("t01_object.time_from", row.get("time_from"));
    IDX.add("t01_object.time_to", row.get("time_to"));
    IDX.add("t01_object.time_type", row.get("time_type"));
    // time: then add t0, t1, t2 fields dependent from time_type
    TRANSF.processTimeFields(row.get("time_from"), row.get("time_to"), row.get("time_type"));
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
function addT011ObjGeo(row) {
    IDX.add("t011_obj_geo.special_base", row.get("special_base"));
    IDX.add("t011_obj_geo.data_base", row.get("data_base"));
    IDX.add("t011_obj_geo.method", row.get("method"));
    IDX.add("t011_obj_geo.referencesystem_id", row.get("referencesystem_value"));
    IDX.add("t011_obj_geo.referencesystem_key", row.get("referencesystem_key"));
    IDX.add("t011_obj_geo.rec_exact", row.get("rec_exact"));
    IDX.add("t011_obj_geo.rec_grade", row.get("rec_grade"));
    IDX.add("t011_obj_geo.hierarchy_level", row.get("hierarchy_level"));
    IDX.add("t011_obj_geo.vector_topology_level", row.get("vector_topology_level"));
    IDX.add("t011_obj_geo.pos_accuracy_vertical", row.get("pos_accuracy_vertical"));
    IDX.add("t011_obj_geo.keyc_incl_w_dataset", row.get("keyc_incl_w_dataset"));
    IDX.add("t011_obj_geo.datasource_uuid", row.get("datasource_uuid"));
}
function addT011ObjGeoKeyc(row) {
    IDX.add("t011_obj_geo_keyc.line", row.get("line"));
    IDX.add("t011_obj_geo_keyc.keyc_key", row.get("keyc_key"));
    IDX.add("t011_obj_geo_keyc.subject_cat", row.get("keyc_value"));
    IDX.add("t011_obj_geo_keyc.key_date", row.get("key_date"));
    IDX.add("t011_obj_geo_keyc.edition", row.get("edition"));
}
function addT011ObjGeoScale(row) {
    IDX.add("t011_obj_geo_scale.line", row.get("line"));
    IDX.add("t011_obj_geo_scale.scale", row.get("scale"));
    IDX.add("t011_obj_geo_scale.resolution_ground", row.get("resolution_ground"));
    IDX.add("t011_obj_geo_scale.resolution_scan", row.get("resolution_scan"));
}
function addT011ObjGeoSpatialRep(row) {
    IDX.add("t011_obj_geo_spatial_rep.line", row.get("line"));
    IDX.add("t011_obj_geo_spatial_rep.type", row.get("type"));
}
function addT011ObjGeoSupplinfo(row) {
    IDX.add("t011_obj_geo_supplinfo.line", row.get("line"));
    IDX.add("t011_obj_geo_supplinfo.feature_type", row.get("feature_type"));
}
function addT011ObjGeoSymc(row) {
    IDX.add("t011_obj_geo_symc.line", row.get("line"));
    IDX.add("t011_obj_geo_symc.symbol_cat_key", row.get("symbol_cat_key"));
    IDX.add("t011_obj_geo_symc.symbol_cat", row.get("symbol_cat_value"));
    IDX.add("t011_obj_geo_symc.symbol_date", row.get("symbol_date"));
    IDX.add("t011_obj_geo_symc.edition", row.get("edition"));
}
function addT011ObjGeoVector(row) {
    IDX.add("t011_obj_geo_vector.line", row.get("line"));
    IDX.add("t011_obj_geo_vector.geometric_object_type", row.get("geometric_object_type"));
    IDX.add("t011_obj_geo_vector.geometric_object_count", row.get("geometric_object_count"));
}
function addT03Catalogue(row) {
    IDX.add("t03_catalogue.cat_uuid", row.get("cat_uuid"));
    IDX.add("t03_catalogue.cat_name", row.get("cat_name"));
    IDX.add("t03_catalogue.country_key", row.get("country_key"));
    IDX.add("t03_catalogue.country_code", row.get("country_value"));
    IDX.add("t03_catalogue.language_key", row.get("language_key"));
    IDX.add("t03_catalogue.language_code", row.get("language_value"));
    IDX.add("t03_catalogue.workflow_control", row.get("workflow_control"));
    IDX.add("t03_catalogue.expiry_duration", row.get("expiry_duration"));
    IDX.add("t03_catalogue.create_time", row.get("create_time"));
    IDX.add("t03_catalogue.mod_uuid", row.get("mod_uuid"));
    IDX.add("t03_catalogue.mod_time", row.get("mod_time"));
}
function addT0112MediaOption(row) {
    IDX.add("t0112_media_option.line", row.get("line"));
    IDX.add("t0112_media_option.medium_note", row.get("medium_note"));
    IDX.add("t0112_media_option.medium_name", row.get("medium_name"));
    IDX.add("t0112_media_option.transfer_size", row.get("transfer_size"));
}
function addT017UrlRef(row) {
    IDX.add("t017_url_ref.line", row.get("line"));
    IDX.add("t017_url_ref.url_link", row.get("url_link"));
    IDX.add("t017_url_ref.special_ref", row.get("special_ref"));
    IDX.add("t017_url_ref.special_name", row.get("special_name"));
    IDX.add("t017_url_ref.content", row.get("content"));
    IDX.add("t017_url_ref.datatype_key", row.get("datatype_key"));
    IDX.add("t017_url_ref.datatype", row.get("datatype_value"));
    IDX.add("t017_url_ref.volume", row.get("volume"));
    IDX.add("t017_url_ref.icon", row.get("icon"));
    IDX.add("t017_url_ref.icon_text", row.get("icon_text"));
    IDX.add("t017_url_ref.descr", row.get("descr"));
    IDX.add("t017_url_ref.url_type", row.get("url_type"));
}
function addSearchtermObj(row) {
    IDX.add("t04_search.line", row.get("line"));
}
function addSearchtermValue(row) {
    IDX.add("t04_search.type", row.get("type"));
    IDX.add("t04_search.searchterm", row.get("term"));
    IDX.add("searchterm_value.alternate_term", row.get("alternate_term"));
}
function addSearchtermSns(row) {
    IDX.add("searchterm_sns.sns_id", row.get("sns_id"));
}
function addT012ObjAdr(row) {
    IDX.add("t012_obj_adr.line", row.get("line"));
    IDX.add("t012_obj_adr.adr_id", row.get("adr_uuid"));
    IDX.add("t012_obj_adr.typ", row.get("type"));
    IDX.add("t012_obj_adr.special_ref", row.get("special_ref"));
    IDX.add("t012_obj_adr.special_name", row.get("special_name"));
    IDX.add("t012_obj_adr.mod_time", row.get("mod_time"));
}
function addT02Address(row) {
    IDX.add("t02_address.adr_id", row.get("adr_uuid"));
    IDX.add("t02_address.org_adr_id", row.get("org_adr_id"));
    IDX.add("t02_address.typ", row.get("adr_type"));
    IDX.add("t02_address.institution", row.get("institution"));
    IDX.add("t02_address.lastname", row.get("lastname"));
    IDX.add("t02_address.firstname", row.get("firstname"));
    IDX.add("t02_address.address_key", row.get("address_key"));
    IDX.add("t02_address.address_value", row.get("address_value"));
    IDX.add("t02_address.title_key", row.get("title_key"));
    IDX.add("t02_address.title", row.get("title_value"));
    IDX.add("t02_address.street", row.get("street"));
    IDX.add("t02_address.postcode", row.get("postcode"));
    IDX.add("t02_address.postbox", row.get("postbox"));
    IDX.add("t02_address.postbox_pc", row.get("postbox_pc"));
    IDX.add("t02_address.city", row.get("city"));
    IDX.add("t02_address.country_key", row.get("country_key"));
    IDX.add("t02_address.country_code", row.get("country_value"));
    IDX.add("t02_address.job", row.get("job"));
    IDX.add("t02_address.descr", row.get("descr"));
    IDX.add("t02_address.create_time", row.get("create_time"));
    IDX.add("t02_address.mod_time", row.get("mod_time"));
    IDX.add("t02_address.mod_uuid", row.get("mod_uuid"));
    IDX.add("t02_address.responsible_uuid", row.get("responsible_uuid"));
}
function addT021Communication(row) {
    IDX.add("t021_communication.line", row.get("line"));
    IDX.add("t021_communication.commtype_key", row.get("commtype_key"));
    IDX.add("t021_communication.comm_type", row.get("commtype_value"));
    IDX.add("t021_communication.comm_value", row.get("comm_value"));
    IDX.add("t021_communication.descr", row.get("descr"));
}
function addAddressNodeChildren(row) {
    IDX.add("t022_adr_adr.adr_from_id", row.get("fk_addr_uuid"));
    IDX.add("t022_adr_adr.adr_to_id", row.get("addr_uuid"));
}
function addSpatialReference(row) {
    IDX.add("spatial_reference.line", row.get("line"));
}
function addSpatialRefValue(row) {
    IDX.add("spatial_ref_value.type", row.get("type"));
    IDX.add("spatial_ref_value.name_key", row.get("name_key"));

    // map "name_value" also as location !
    IDX.add("spatial_ref_value.name_value", row.get("name_value"));
    IDX.add("location", row.get("name_value"));
    // map "nativekey" also as areaid !
    IDX.add("spatial_ref_value.nativekey", row.get("nativekey"));
    IDX.add("areaid", row.get("nativekey"));
    // map "x1" also as x1 !
    IDX.add("spatial_ref_value.x1", row.get("x1"));
    IDX.add("x1", row.get("x1"));
    // map "y1" also as y1 !
    IDX.add("spatial_ref_value.y1", row.get("y1"));
    IDX.add("y1", row.get("y1"));
    // map "x2" also as x2 !
    IDX.add("spatial_ref_value.x2", row.get("x2"));
    IDX.add("x2", row.get("x2"));
    // map "y2" also as y2 !
    IDX.add("spatial_ref_value.y2", row.get("y2"));
    IDX.add("y2", row.get("y2"));

    IDX.add("spatial_ref_value.topic_type", row.get("topic_type"));
}
function addSpatialRefSns(row) {
    IDX.add("spatial_ref_sns.sns_id", row.get("sns_id"));
    IDX.add("spatial_ref_sns.expired_at", row.get("expired_at"));
}
function addObjectNodeChildren(row) {
    IDX.add("children.object_node.obj_uuid", row.get("obj_uuid"));
}
function addObjectNodeParent(row) {
    IDX.add("parent.object_node.obj_uuid", row.get("fk_obj_uuid"));
}
function addObjectReferenceTo(row) {
    IDX.add("object_reference.line", row.get("line"));
    IDX.add("object_reference.obj_from_id", row.get("obj_from_id"));
    IDX.add("object_reference.obj_to_uuid", row.get("obj_to_uuid"));
    IDX.add("object_reference.special_ref", row.get("special_ref"));
    IDX.add("object_reference.special_name", row.get("special_name"));
    IDX.add("object_reference.descr", row.get("descr"));
}
function addObjectReferenceFrom(row) {
    IDX.add("refering.object_reference.line", row.get("line"));
    IDX.add("refering.object_reference.obj_id", row.get("obj_from_id"));
    IDX.add("refering.object_reference.special_ref", row.get("special_ref"));
    IDX.add("refering.object_reference.special_name", row.get("special_name"));
    IDX.add("refering.object_reference.descr", row.get("descr"));
}
function addT01ObjectFrom(row) {
    IDX.add("refering.object_reference.obj_uuid", row.get("obj_uuid"));
}
function addT0114EnvCategory(row) {
    IDX.add("t0114_env_category.line", row.get("line"));
    IDX.add("t0114_env_category.cat_key", row.get("cat_key"));
    // add syslist value to index (in all languages)
    TRANSF.addSyslistEntryNameToIndex(1400, row.get("cat_key"),
        ["funct_category", "t0114_env_category.cat_value"])
}
function addT0114EnvTopic(row) {
    IDX.add("t0114_env_topic.line", row.get("line"));
    IDX.add("t0114_env_topic.topic_key", row.get("topic_key"));
    // add syslist value to index (in all languages)
    TRANSF.addSyslistEntryNameToIndex(1410, row.get("topic_key"),
        ["topic", "t0114_env_topic.topic_value"])
}
function addT011ObjTopicCat(row) {
    IDX.add("t011_obj_topic_cat.line", row.get("line"));
    IDX.add("t011_obj_topic_cat.topic_category", row.get("topic_category"));
}
function addObjectAccess(row) {
    IDX.add("object_access.line", row.get("line"));
    IDX.add("object_access.restriction_key", row.get("restriction_key"));
    IDX.add("object_access.restriction_value", row.get("restriction_value"));
}
function addObjectUse(row) {
    IDX.add("object_use.line", row.get("line"));
    IDX.add("object_use.terms_of_use", row.get("terms_of_use"));
}
function addObjectConformity(row) {
    IDX.add("object_conformity.line", row.get("line"));
    IDX.add("object_conformity.specification", row.get("specification"));
    IDX.add("object_conformity.degree_key", row.get("degree_key"));
    IDX.add("object_conformity.degree_value", row.get("degree_value"));
    IDX.add("object_conformity.publication_date", row.get("publication_date"));
}


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
