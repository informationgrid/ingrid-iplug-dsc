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

// constant to punish the rank of a service/data object, which has no coupled resource
var BOOST_NO_COUPLED_RESOURCE  = 0.9;
//constant to boost the rank of a service/data object, which has at least one coupled resource
var BOOST_HAS_COUPLED_RESOURCE = 1.0;

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
    // Example adding additional HTML to result
//    IDX.add("additional_html_1", "<h1>MEIN ZUSATZ</h1>", false);

	addT01Object(objRows.get(i));
    var catalogId = objRows.get(i).get("cat_id");
    var objUuid = objRows.get(i).get("obj_uuid");
    var objClass = objRows.get(i).get("obj_class");

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
    // ---------- object_types_catalogue ----------
    var subRows = SQL.all("SELECT * FROM object_types_catalogue WHERE obj_id=?", [objId]);
    for (k=0; k<subRows.size(); k++) {
        addObjectTypesCatalogue(subRows.get(k));
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
            var objServOpId   = subRows.get(k).get("id");
            var isCapabilityOperation = rows.get(j).get("type_key") == "2" && subRows.get(k).get("name_key") == "1"; // key of "Darstellungsdienste" is "2" and "GetCapabilities" is "1" !

            // ---------- t011_obj_serv_op_connpoint ----------
            var subSubRows = SQL.all("SELECT * FROM t011_obj_serv_op_connpoint WHERE obj_serv_op_id=?", [objServOpId]);
            for (l=0; l<subSubRows.size(); l++) {
                addT011ObjServOpConnpoint(subSubRows.get(l), isCapabilityOperation);
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
    // add Capabilities Url from service to coupled data object (INGRID32-81)
    if (objClass == "1") {
        var serviceObjects = SQL.all("SELECT * FROM object_reference oRef, t01_object t01 WHERE oRef.obj_to_uuid=? AND oRef.obj_to_uuid=t01.obj_uuid AND t01.obj_class=1 AND oRef.obj_from_id IN (SELECT t01_b.id FROM t01_object t01_b WHERE t01_b.obj_class=3)", [objUuid]);
        log.debug("Found ServiceObjects from uuid=" + objUuid + ": " + serviceObjects.size());
        for (k=0; k<serviceObjects.size(); k++) {
            // get capabilities urls from service object, who links to this object!
            var capabilitiesUrls = SQL.all("SELECT * FROM object_reference oref, t01_object t01obj, t011_obj_serv serv, t011_obj_serv_operation servOp, t011_Obj_serv_op_connPoint servOpConn WHERE oref.obj_from_id=t01obj.id AND serv.obj_id=t01obj.id AND servOp.obj_serv_id=serv.id AND servOp.name_key=1 AND servOpConn.obj_serv_op_id=servOp.id AND obj_to_uuid=? AND obj_from_id=? AND special_ref=3600 AND serv.type_key=2 AND t01obj.work_state='V'", [objUuid, serviceObjects.get(k).get("obj_from_id")]);
            for (l=0; l<capabilitiesUrls.size(); l++) {
                //log.debug("Found capabilitiesUrls for "+k+". service object: " + capabilitiesUrls.size());
                addCapabilitiesUrl(capabilitiesUrls.get(l));
            }
        }
        // boost this documents according to how many services are connected to this data object
        boostDocumentsByReferences(serviceObjects.size());
    }    
    // ---------- t011_obj_geo ----------
    var rows = SQL.all("SELECT * FROM t011_obj_geo WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addT011ObjGeo(rows.get(j));
        var objGeoId = rows.get(j).get("id");

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
    // ---------- t017_url_ref (except preview image) ----------
    var rows = SQL.all("SELECT * FROM t017_url_ref WHERE obj_id=? AND special_ref!=9000", [objId]);
    for (j=0; j<rows.size(); j++) {
        addT017UrlRef(rows.get(j));
    }
    // ---------- t017_url_ref - preview image----------
    var rows = SQL.all("SELECT * FROM t017_url_ref WHERE obj_id=? AND special_ref=9000", [objId]);
    for (j=0; j<rows.size(); j++) {
        // add complete styling information, so we don't have to make any changes in the portal
        var previewImageHtmlTag = "<img src='" + rows.get(j).get("url_link") + "' height='100' class='preview_image' />";
        IDX.add("additional_html_1", previewImageHtmlTag);
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

        // ---------- add referenced address ----------
        addAddress(adrUuid);
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
    // ---------- spatial_system ----------
    var rows = SQL.all("SELECT * FROM spatial_system WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addSpatialSystem(rows.get(j));
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
    var rows = SQL.all("SELECT oRef.*, t01.obj_name FROM object_reference oRef, t01_object t01 WHERE oRef.obj_to_uuid=t01.obj_uuid AND oRef.obj_from_id=? AND t01.work_state='V'", [objId]);
    for (j=0; j<rows.size(); j++) {
        addObjectReferenceTo(rows.get(j));
    }
    // add explicitly coupled resources of a service, for easier extraction on portal side
    if (objClass == "3") {
        var numCoupledResources = 0;
        for (j=0; j<rows.size(); j++) {
            // only add references from coupled resources ( service <-> data )
            if (rows.get(j).get("special_ref") == "3600") {
                addCoupledResource(rows.get(j));
                numCoupledResources++;
            }
        }
        // boost this documents according to how many data objects are connected to this service
        boostDocumentsByReferences(numCoupledResources);
    }
    // ---------- object_reference FROM ----------
    var rows = SQL.all("SELECT * FROM object_reference, t01_object WHERE obj_to_uuid=? AND obj_to_uuid=obj_uuid AND work_state='V'", [objUuid]);
    for (j=0; j<rows.size(); j++) {
        addObjectReferenceFrom(rows.get(j));
        var objFromId = rows.get(j).get("obj_from_id");

        // ---------- t01_object FROM ----------
        var subRows = SQL.all("SELECT * FROM t01_object WHERE id=? AND work_state='V'", [objFromId]);
        for (k=0; k<subRows.size(); k++) {
            addT01ObjectFrom(subRows.get(k));
            
            // service FROM (helps to identify links from services to data-objects)
            // this kind of link comes from an object of class 3 and has a link type of '3600'
            if ("3600".equals(rows.get(j).get("special_ref")) && "3".equals(subRows.get(k).get("obj_class"))) {
                var firstCapabilitiesUrl = SQL.first("SELECT * FROM object_reference oref, t01_object t01obj, t011_obj_serv serv, t011_obj_serv_operation servOp, t011_Obj_serv_op_connPoint servOpConn WHERE oref.obj_from_id=t01obj.id AND serv.obj_id=t01obj.id AND servOp.obj_serv_id=serv.id AND servOp.name_key=1 AND servOpConn.obj_serv_op_id=servOp.id AND obj_to_uuid=? AND obj_from_id=? AND special_ref=3600 AND serv.type_key=2 AND t01obj.work_state='V'", [rows.get(j).get("obj_to_uuid"), objFromId]);
                var dsIdentifier = SQL.first("SELECT * FROM t011_obj_geo WHERE obj_id=(SELECT id FROM t01_object WHERE obj_uuid=? AND work_state='V')", [objUuid]);
                var catalog = SQL.first("SELECT * FROM t03_catalogue WHERE id=?", [catalogId]);
                addServiceLinkInfo(subRows.get(k), firstCapabilitiesUrl, dsIdentifier, catalog);
            }
        }
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
    // ---------- object_data_quality ----------
    var rows = SQL.all("SELECT * FROM object_data_quality WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addObjectDataQuality(rows.get(j));
    }
    // ---------- object_format_inspire ----------
    var rows = SQL.all("SELECT * FROM object_format_inspire WHERE obj_id=?", [objId]);
    for (j=0; j<rows.size(); j++) {
        addObjectFormatInspire(rows.get(j));
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
    // --------------
    // time: then add t0, t1, t2 fields dependent from time_type
    var timeMap = TRANSF.transformIGCTimeFields(row.get("time_from"), row.get("time_to"), row.get("time_type"));
    // store as term and not as number, searcher queries via TermRangeQuery and NOT NumericRangeQuery !
    if (hasValue(timeMap.get("t0"))) {
        IDX.add("t0", timeMap.get("t0"));
    }
    if (hasValue(timeMap.get("t1"))) {
        IDX.add("t1", timeMap.get("t1"));
    }
    if (hasValue(timeMap.get("t2"))) {
        IDX.add("t2", timeMap.get("t2"));
    }
    // --------------
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
    if (hasValue(row.get("is_inspire_relevant")) && row.get("is_inspire_relevant")=='Y') {
        // add all three fields here to equalize the multiplicity of the fields content in index
    	IDX.add("t04_search.type", "F");
        IDX.add("t04_search.searchterm", "inspireidentifiziert");
        IDX.add("searchterm_value.alternate_term", "");        
    }
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
function addT011ObjServOpConnpoint(row, isCapabilityUrl) {
    IDX.add("t011_obj_serv_op_connpoint.line", row.get("line"));
    IDX.add("t011_obj_serv_op_connpoint.connect_point", row.get("connect_point"));
    
    // add capability url if it was defined as one
    if (isCapabilityUrl == true) {
        addCapabilitiesUrl(row);
    }
}
function addCapabilitiesUrl(row) {
    IDX.add("capabilities_url", row.get("connect_point"));
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
    IDX.add("t011_obj_serv_op_platform.platform_key", row.get("platform_key"));
    IDX.add("t011_obj_serv_op_platform.platform_value", row.get("platform_value"));
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
    IDX.add("t011_obj_geo.rec_exact", row.get("rec_exact"));
    IDX.add("t011_obj_geo.rec_grade", row.get("rec_grade"));
    IDX.add("t011_obj_geo.hierarchy_level", row.get("hierarchy_level"));
    IDX.add("t011_obj_geo.vector_topology_level", row.get("vector_topology_level"));
    IDX.add("t011_obj_geo.pos_accuracy_vertical", row.get("pos_accuracy_vertical"));
    IDX.add("t011_obj_geo.keyc_incl_w_dataset", row.get("keyc_incl_w_dataset"));
    IDX.add("t011_obj_geo.datasource_uuid", row.get("datasource_uuid"));
}
function addObjectTypesCatalogue(row) {
    IDX.add("object_types_catalogue.line", row.get("line"));
    IDX.add("object_types_catalogue.title_key", row.get("title_key"));
    IDX.add("object_types_catalogue.title_value", row.get("title_value"));
    IDX.add("object_types_catalogue.type_date", row.get("type_date"));
    IDX.add("object_types_catalogue.type_version", row.get("type_version"));
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
    IDX.add("t03_catalogue.cat_namespace", row.get("cat_namespace"));
    IDX.add("t03_catalogue.country_key", row.get("country_key"));
    IDX.add("t03_catalogue.country_code", row.get("country_value"));
    IDX.add("t03_catalogue.language_key", row.get("language_key"));
    IDX.add("t03_catalogue.language_code", row.get("language_value"));
    IDX.add("t03_catalogue.workflow_control", row.get("workflow_control"));
    IDX.add("t03_catalogue.expiry_duration", row.get("expiry_duration"));
    IDX.add("t03_catalogue.create_time", row.get("create_time"));
    IDX.add("t03_catalogue.mod_uuid", row.get("mod_uuid"));
    IDX.add("t03_catalogue.mod_time", row.get("mod_time"));
    // also language so index can deliver language specific requests !
    // e.g. when portal requests language dependent !
    IDX.add("lang", TRANSF.getLanguageShortcutFromIGCCode(row.get("language_key")));
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

// Adds address to index. If address is hidden then parent address is added.
// Also adds address children not hidden (queried from portal ???).
function addAddress(addrUuid) {
	// ---------- address_node ----------
    var addrNodeRows = SQL.all("SELECT * FROM address_node WHERE addr_uuid=? AND addr_id_published IS NOT NULL", [addrUuid]);
    for (k=0; k<addrNodeRows.size(); k++) {
        var parentAddrUuid = addrNodeRows.get(k).get("fk_addr_uuid");
        var addrIdPublished = addrNodeRows.get(k).get("addr_id_published");

        // ---------- t02_address ----------
        var addrRow = SQL.first("SELECT * FROM t02_address WHERE id=? and (hide_address IS NULL OR hide_address != 'Y')", [addrIdPublished]);
        if (hasValue(addrRow)) {
            // address not hidden, add all data
            addT02Address(addrRow);

            // ---------- t021_communication ----------
            var commRows = SQL.all("SELECT * FROM t021_communication WHERE adr_id=?", [addrIdPublished]);
            for (l=0; l<commRows.size(); l++) {
                addT021Communication(commRows.get(l));
            }

            // ---------- address_node CHILDREN, queried from portal ??? ----------
            // only children published and NOT hidden !
            var childRows = SQL.all("SELECT address_node.* FROM address_node, t02_address WHERE address_node.fk_addr_uuid=? AND address_node.addr_id_published=t02_address.id AND (t02_address.hide_address IS NULL OR t02_address.hide_address != 'Y')", [addrUuid]);
            for (l=0; l<childRows.size(); l++) {
                addAddressNodeChildren(childRows.get(l));
            }

        } else {
if (log.isDebugEnabled()) {
    log.debug("Hidden address !!! uuid=" + addrUuid + " -> instead map parent address uuid=" + parentAddrUuid);
}
            // address hidden, add parent !
            if (hasValue(parentAddrUuid)) {
                addAddress(parentAddrUuid);
            }
        }
    }	
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
	// QUERIED FROM PORTAL !?
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
    // map "nativekey" also as areaid ! queried via extended search gazetteer !
    IDX.add("spatial_ref_value.nativekey", row.get("nativekey"));
    IDX.add("areaid", row.get("nativekey"));

    // --------------
    // BB Coordinates ! stored as WGS84 in fields x1, y1, x2, y2 in index (will be queried) !
    // store NUMERIC so spatial queries (range) work !
/*
    // Example transforming single point (x,y) into WGS84 and store in x1, x2 !
    // Pass given Coordinate System, allowed values:
    // COORDS_ETRS89_UTM31N, COORDS_ETRS89_UTM32N, COORDS_ETRS89_UTM33N, COORDS_ETRS89_UTM34N, COORDS_GK2, COORDS_GK3, COORDS_GK4, COORDS_GK5, COORDS_WGS84
    var transfPoint = TRANSF.transformPointToWGS84(row.get("x1"), row.get("y1"), CoordTransformUtil.CoordType.COORDS_ETRS89_UTM31N)
    IDX.addNumeric("x1", transfPoint[0]);
    IDX.addNumeric("y1", transfPoint[1]);
*/
    // we already have WGS84, so we use orig values
    IDX.addNumeric("x1", row.get("x1"));
    IDX.addNumeric("y1", row.get("y1"));
    // also store orig coordinates in index
    IDX.addNumeric("spatial_ref_value.x1", row.get("x1"));
    IDX.addNumeric("spatial_ref_value.y1", row.get("y1"));
    // and fields x2, y2 for query
    IDX.addNumeric("x2", row.get("x2"));
    IDX.addNumeric("y2", row.get("y2"));
    // also store orig coordinates in index
    IDX.addNumeric("spatial_ref_value.x2", row.get("x2"));
    IDX.addNumeric("spatial_ref_value.y2", row.get("y2"));
    // --------------

    IDX.add("spatial_ref_value.topic_type", row.get("topic_type"));
}
function addSpatialRefSns(row) {
    IDX.add("spatial_ref_sns.sns_id", row.get("sns_id"));
    // GS Soil FIX !!! map id of gazetteer Location also as areaid, cause NO "nativekey" set in Location at the moment !
    // Extended search portal uses this id as areaid if no nativekey set.
    // Should be solved in the future when gazetteer also delivers nativekey which then is set as areaid (see above).
//    IDX.add("areaid", row.get("sns_id"));
    IDX.add("spatial_ref_sns.expired_at", row.get("expired_at"));
}
function addSpatialSystem(row) {
    IDX.add("spatial_system.line", row.get("line"));
    IDX.add("spatial_system.referencesystem_key", row.get("referencesystem_key"));
    IDX.add("spatial_system.referencesystem_value", row.get("referencesystem_value"));
    // legacy mapping (used in csw interface)
    IDX.add("t011_obj_geo.referencesystem_key", row.get("referencesystem_key"));
    IDX.add("t011_obj_geo.referencesystem_id", row.get("referencesystem_value"));
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
function addCoupledResource(row) {
    IDX.add("coupled_resource", row.get("obj_to_uuid") + "#" + row.get("obj_name")); // + "#" + row.get("datasource_uuid"));
}
function addServiceLinkInfo(row, capabilitiyUrl, dsIdentifier, catalog) {
    // add class from refering object, which is used to determine in-links from services (INGRID32-81)
    var data = row.get("obj_uuid") + "@@" + row.get("obj_name") + "@@";
    if (capabilitiyUrl) {
        data += capabilitiyUrl.get("connect_point");
    }
    data += "@@";
    if (dsIdentifier) {
        data += addNamespace(dsIdentifier.get("datasource_uuid"), catalog);
    }
    IDX.add("refering_service_uuid", data);
}
function addNamespace(identifier, catalog) {
    var myNamespace = "";
    // check if namespace already exists
    var idTokens = identifier.split("#");
    if (idTokens.length > 1 && hasValue(idTokens[0])) {
        return identifier;
    }
    
    myNamespace = catalog.get("cat_namespace");

    var myNamespaceLength = 0;
    if (!hasValue(myNamespace)) {
        // not set in catalog, we use default namespace (database catalog name!)
        var dbCatalog = SQL.getConnection().getCatalog();
        if (!hasValue(dbCatalog)) {
            dbCatalog = catRow.get("cat_name");
        }
        myNamespace = "http://portalu.de/" + dbCatalog;
        // JS String !
        myNamespaceLength = myNamespace.length;
    }
    
    if (myNamespaceLength > 0 && myNamespace.substring(myNamespaceLength-1) != "#") {
        myNamespace = myNamespace + "#";
    }

    return myNamespace + identifier;
}
function addT01ObjectFrom(row) {
    IDX.add("refering.object_reference.obj_uuid", row.get("obj_uuid"));
}
function addT0114EnvTopic(row) {
    IDX.add("t0114_env_topic.line", row.get("line"));
    IDX.add("t0114_env_topic.topic_key", row.get("topic_key"));
    // get the query value of the topic, this one has to be in the "topic" index field (queried by portal)
    var specificLangId = TRANSF.LANG_ID_INGRID_QUERY_VALUE;
    IDX.add("topic", TRANSF.getCodeListEntryFromIGCSyslistEntry(1410, row.get("topic_key"), specificLangId));
    // we also index the displayed value of the topic
    IDX.add("t0114_env_topic.topic_value", TRANSF.getIGCSyslistEntryName(1410, row.get("topic_key")));
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
    IDX.add("object_use.terms_of_use_key", row.get("terms_of_use_key"));
    IDX.add("object_use.terms_of_use_value", row.get("terms_of_use_value"));
}
function addObjectConformity(row) {
    IDX.add("object_conformity.line", row.get("line"));
    IDX.add("object_conformity.degree_key", row.get("degree_key"));
    IDX.add("object_conformity.degree_value", row.get("degree_value"));
    IDX.add("object_conformity.specification_key", row.get("specification_key"));
    IDX.add("object_conformity.specification_value", row.get("specification_value"));
}
function addObjectDataQuality(row) {
    IDX.add("object_data_quality.line", row.get("line"));
    IDX.add("object_data_quality.dq_element_id", row.get("dq_element_id"));
    IDX.add("object_data_quality.name_of_measure_key", row.get("name_of_measure_key"));
    IDX.add("object_data_quality.name_of_measure_value", row.get("name_of_measure_value"));
    IDX.add("object_data_quality.result_value", row.get("result_value"));
    IDX.add("object_data_quality.measure_description", row.get("measure_description"));
}
function addObjectFormatInspire(row) {
    IDX.add("object_format_inspire.line", row.get("line"));
    IDX.add("object_format_inspire.format_key", row.get("format_key"));
    IDX.add("object_format_inspire.format_value", row.get("format_value"));
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

function boostDocumentsByReferences(num) {
    // punish score of document if no coupled resource has been found
    if (num == 0) {
        IDX.addDocumentBoost(BOOST_NO_COUPLED_RESOURCE);
    } else {
        // boost document if it has more than one coupled resource
        IDX.addDocumentBoost(BOOST_HAS_COUPLED_RESOURCE);
    }
}
