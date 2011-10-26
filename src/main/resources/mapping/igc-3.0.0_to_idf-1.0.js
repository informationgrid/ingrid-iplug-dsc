/**
 * SourceRecord to IDF Document mapping
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 *
 * The following global variable are passed from the application:
 *
 * @param sourceRecord A SourceRecord instance, that defines the input
 * @param idfDoc A IDF Document (XML-DOM) instance, that defines the output
 * @param log A Log instance
 * @param SQL SQL helper class encapsulating utility methods
 * @param XPATH xpath helper class encapsulating utility methods
 * @param TRANSF Helper class for transforming, processing values
 * @param DOM Helper class encapsulating processing DOM
 */
importPackage(Packages.org.w3c.dom);
importPackage(Packages.de.ingrid.iplug.dsc.om);

if (log.isDebugEnabled()) {
	log.debug("Mapping source record to idf document: " + sourceRecord.toString());
}

if (!(sourceRecord instanceof DatabaseSourceRecord)) {
    throw new IllegalArgumentException("Record is no DatabaseRecord!");
}
// ---------- Initialize ----------
// add Namespaces to Utility for convenient handling of NS !
DOM.addNS("gmd", "http://www.isotc211.org/2005/gmd");
DOM.addNS("gco", "http://www.isotc211.org/2005/gco");
DOM.addNS("srv", "http://www.isotc211.org/2005/srv");
DOM.addNS("gml", "http://www.opengis.net/gml");
DOM.addNS("gts", "http://www.isotc211.org/2005/gts");
DOM.addNS("xlink", "http://www.w3.org/1999/xlink");

// ---------- <idf:body> ----------
var idfBody = XPATH.getNode(idfDoc, "/idf:html/idf:body");

// ---------- <idf:idfMdMetadata> ----------
var mdMetadata = DOM.addElement(idfBody, "idf:idfMdMetadata");
// add needed "ISO" namespaces to top ISO node 
mdMetadata.addAttribute("xmlns:gmd", DOM.getNS("gmd"));
mdMetadata.addAttribute("xmlns:gco", DOM.getNS("gco"));
mdMetadata.addAttribute("xmlns:srv", DOM.getNS("srv"));
mdMetadata.addAttribute("xmlns:gml", DOM.getNS("gml"));
mdMetadata.addAttribute("xmlns:gts", DOM.getNS("gts"));
mdMetadata.addAttribute("xmlns:xlink", DOM.getNS("xlink"));
// and schema references
mdMetadata.addAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
mdMetadata.addAttribute("xsi:schemaLocation", DOM.getNS("gmd") + " http://schemas.opengis.net/csw/2.0.2/profiles/apiso/1.0.0/apiso.xsd");

// ========== t01_object ==========
var objId = sourceRecord.get(DatabaseSourceRecord.ID);
var objRows = SQL.all("SELECT * FROM t01_object WHERE id=?", [objId]);
for (i=0; i<objRows.size(); i++) {
    var objRow = objRows.get(i);
    var objUuid = objRow.get("obj_uuid");
    var objClass = objRow.get("obj_class");
    var objParentUuid = null; // will be set below
    
    // local variables
    var row = null;
    var rows = null;
    var value = null;
    var elem = null;
/*
    // Example iterating all columns !
    var colNames = objRow.keySet().toArray();
    for (var i in colNames) {
        var colName = colNames[i];
        var colValue = objRow.get(colName);
    }
*/

// ---------- <gmd:fileIdentifier> ----------
    value = getFileIdentifier(objRow);
    if (hasValue(value)) {
    	mdMetadata.addElement("gmd:fileIdentifier/gco:CharacterString").addText(value);
    }

// ---------- <gmd:language> ----------
    value = TRANSF.getLanguageISO639_2FromIGCCode(objRow.get("metadata_language_key"));
    if (hasValue(value)) {
    	mdMetadata.addElement("gmd:language/gmd:LanguageCode")
    		.addAttribute("codeList", "http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/Codelist/ML_gmxCodelists.xml#LanguageCode")
    		.addAttribute("codeListValue", value).addText(value);
    }
// ---------- <gmd:characterSet> ----------
    value = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(510, objRow.get("metadata_character_set"));
    if (hasValue(value)) {
    	mdMetadata.addElement("gmd:characterSet/gmd:MD_CharacterSetCode")
    		.addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#MD_CharacterSetCode")
    		.addAttribute("codeListValue", value);
    }
// ---------- <gmd:parentIdentifier> ----------
    // NOTICE: Has to be published ! Guaranteed by select of passed sourceRecord ! 
    rows = SQL.all("SELECT fk_obj_uuid FROM object_node WHERE obj_uuid=?", [objUuid]);
    // Should be only one row !
    objParentUuid = rows.get(0).get("fk_obj_uuid");
    if (hasValue(objParentUuid)) {
    	mdMetadata.addElement("gmd:parentIdentifier/gco:CharacterString").addText(objParentUuid);
    }
// ---------- <gmd:hierarchyLevel> ----------
// ---------- <gmd:hierarchyLevelName> ----------
    var hierarchyLevel = getHierarchLevel(objClass);
    var hierarchyLevelName = map(objClass, {"0":"job", "1":"", "2":"document", "3":"service", "4":"project", "5":"database", "6":"application"});
    if (hasValue(hierarchyLevel)) {
    	mdMetadata.addElement("gmd:hierarchyLevel/gmd:MD_ScopeCode")
    		.addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#MD_ScopeCode")
    		.addAttribute("codeListValue", hierarchyLevel).addText(hierarchyLevel);
    }
    if (hasValue(hierarchyLevelName)) {
    	mdMetadata.addElement("gmd:hierarchyLevelName/gco:CharacterString").addText(hierarchyLevelName);
    }
    // ---------- <gmd:contact> ----------
    var addressRows = SQL.all("SELECT t02_address.*, t012_obj_adr.type FROM t012_obj_adr, t02_address WHERE t012_obj_adr.adr_uuid=t02_address.adr_uuid AND t02_address.work_state=? AND t012_obj_adr.obj_id=? AND t012_obj_adr.type=? ORDER BY line", ['V', objId, 7]);
    for (var i=0; i< addressRows.size(); i++) {
    	var addressRow = addressRows.get(i); 
    	var role = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(505, addressRow.get("type"));
    	if (hasValue(role)) {
    		mdMetadata.addElement("gmd:contact").addElement(getIdfResponsibleParty(addressRow, role));
    	}
    }
    // ---------- <gmd:dateStamp> ----------
    if (hasValue(objRow.get("mod_time"))) {
    	var isoDate = TRANSF.getISODateFromIGCDate(objRow.get("mod_time"));
       	// do only return the date section, ignore the time part of the date
    	// see CSW 2.0.2 AP ISO 1.0 (p.41)
    	mdMetadata.addElement("gmd:dateStamp").addElement(getDate(isoDate));
    }
    
    // ---------- <gmd:metadataStandardName> ----------
    var mdStandardName;
    if (hasValue(objRow.get("metadata_standard_name"))) {
    	mdStandardName=objRow.get("metadata_standard_name");
    } else if (objClass.equals("3") || objClass.equals("6")) {
    	mdStandardName="ISO19119";
    } else {
    	mdStandardName="ISO19115";
    }
	mdMetadata.addElement("gmd:metadataStandardName/gco:CharacterString").addText(mdStandardName);

    // ---------- <gmd:metadataStandardVersion> ----------
    var mdStandardName;
    if (hasValue(objRow.get("metadata_standard_version"))) {
    	mdStandardName=objRow.get("metadata_standard_version");
    } else if (objClass.equals("3") || objClass.equals("6")) {
    	mdStandardName="2005/PDAM 1";
    } else {
    	mdStandardName="2003/Cor.1:2006";
    }
	mdMetadata.addElement("gmd:metadataStandardVersion/gco:CharacterString").addText(mdStandardName);

    // ---------- <gmd:topologyLevel> ----------
	var objGeoRow = SQL.first("SELECT * FROM t011_obj_geo WHERE obj_id=?", [objId]);
	var objGeoId;
	if (hasValue(objGeoRow)) {
        objGeoId = objGeoRow.get("id");
		var mdVectorSpatialRepresentation;
		var vectorTopologyLevel = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(528, objGeoRow.get("vector_topology_level"));
		if (hasValue(vectorTopologyLevel)) {
			if (!mdVectorSpatialRepresentation) mdVectorSpatialRepresentation = mdMetadata.addElement("gmd:spatialRepresentationInfo/gmd:MD_VectorSpatialRepresentation");
			mdVectorSpatialRepresentation.addElement("gmd:topologyLevel/gmd:MD_TopologyLevelCode")
				.addAttribute("codeList","http://www.tc211.org/ISO19139/resources/codeList.xml#MD_TopologyLevelCode")
				.addAttribute("codeListValue", vectorTopologyLevel);
		}
		
		// ---------- <gmd:MD_GeometricObjects> ----------
		var objGeoVectorRows = SQL.all("SELECT * FROM t011_obj_geo_vector WHERE obj_geo_id=?", [objGeoId]);
		for (var j=0; j<objGeoVectorRows.size(); j++) {
            var objGeoVectorRow = objGeoVectorRows.get(j);
            var geoObjType = objGeoVectorRow.get("geometric_object_type");
            var geoObjCount = objGeoVectorRow.get("geometric_object_count");
            if (hasValue(geoObjType) || hasValue(geoObjCount)) {
                if (!mdVectorSpatialRepresentation) {
                    mdVectorSpatialRepresentation = mdMetadata.addElement("gmd:spatialRepresentationInfo/gmd:MD_VectorSpatialRepresentation");
                }
                var mdGeometricObjects = mdVectorSpatialRepresentation.addElement("gmd:geometricObjects/gmd:MD_GeometricObjects");
                var geometricObjectTypeCode = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(515, geoObjType); 
                mdGeometricObjects.addElement("gmd:geometricObjectType/gmd:MD_GeometricObjectTypeCode")
                    .addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#MD_GeometricObjectTypeCode")
                    .addAttribute("codeListValue", geometricObjectTypeCode);
                if (hasValue(geoObjCount)) {
                    mdGeometricObjects.addElement("gmd:geometricObjectCount/gco:Integer").addText(geoObjCount);
                }
            }
		}

		// ---------- <gmd:referenceSystemIdentifier> ----------
		var referenceSystem = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(100, objGeoRow.get("referencesystem_key"));
		if (!hasValue(referenceSystem)) {
			referenceSystem = objGeoRow.get("referencesystem_value");
		}
		if (hasValue(referenceSystem)) {
			var rsIdentifier = mdMetadata.addElement("gmd:referenceSystemInfo/gmd:MD_ReferenceSystem/gmd:referenceSystemIdentifier/gmd:RS_Identifier");
			rsIdentifier.addElement("gmd:code").addElement("gco:CharacterString").addText(referenceSystem);
			if (referenceSystem.startsWith("EPSG")) {
				rsIdentifier.addElement("gmd:codeSpace/gco:CharacterString").addText("EPSG");
			}
		}
	}
	// ---------- <gmd:identificationInfo> ----------
	var identificationInfo;
	if (objClass.equals("3") || objClass.equals("6")) {
		identificationInfo = mdMetadata.addElement("gmd:identificationInfo/srv:SV_ServiceIdentification");
	} else {
		identificationInfo = mdMetadata.addElement("gmd:identificationInfo/gmd:MD_DataIdentification");
	}
	identificationInfo.addAttribute("uuid", "ingrid#" + getCitationIdentifier(objRow));
	
	// ---------- <gmd:identificationInfo/gmd:citation/gmd:CI_Citation> ----------
	var ciCitation = identificationInfo.addElement("gmd:citation/gmd:CI_Citation");
	// ---------- <gmd:identificationInfo/gmd:citation/gmd:CI_Citation/gmd:title> ----------
	ciCitation.addElement("gmd:title/gco:CharacterString").addText(objRow.get("obj_name"));
	// ---------- <gmd:identificationInfo/gmd:citation/gmd:CI_Citation/gmd:alternateTitle> ----------
	if (hasValue(objRow.get("dataset_alternate_name"))) {
		ciCitation.addElement("gmd:alternateTitle/gco:CharacterString").addText(objRow.get("dataset_alternate_name"));
	}
	// ---------- <gmd:identificationInfo/gmd:citation/gmd:CI_Citation/gmd:date/gmd:CI_Date> ----------
	var referenceDateRows = SQL.all("SELECT * FROM t0113_dataset_reference WHERE obj_id=?", [objId]);
	for (j=0; j<referenceDateRows.size(); j++) {
		var referenceDateRow = referenceDateRows.get(j); 
		var ciDate = ciCitation.addElement("gmd:date/gmd:CI_Date");
        ciDate.addElement("gmd:date").addElement(getDateOrDateTime(TRANSF.getISODateFromIGCDate(referenceDateRow.get("reference_date"))));
        var dateType = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(502, referenceDateRow.get("type"));
        ciDate.addElement("gmd:dateType/gmd:CI_DateTypeCode")
        	.addAttribute("codeList","http://www.tc211.org/ISO19139/resources/codeList.xml#CI_DateTypeCode")
        	.addAttribute("codeListValue", dateType);
	}
	// date needed, we add dummy if no date !
	if (referenceDateRows.size() == 0) {
        ciCitation.addElement("gmd:date").addAttribute("gco:nilReason", "missing");
        // or add gco:nilReason underneath gmd:CI_Date ???
/*
        var ciDate = ciCitation.addElement("gmd:date/gmd:CI_Date");
        ciDate.addElement("gmd:date").addAttribute("gco:nilReason", "missing")
            .addElement("gco:Date");
        ciDate.addElement("gmd:dateType").addAttribute("gco:nilReason", "missing");
*/
	}

    // gmd:editionDate MUST BE BEFORE gmd:identifier (next one below !)
	// start mapping literature properties
	if (objClass.equals("2")) {
		var literatureRow = SQL.first("SELECT * from t011_obj_literature WHERE obj_id=?", [objId]);
		if (hasValue(literatureRow)) {
			// ---------- <gmd:identificationInfo/gmd:citation/gmd:CI_Citation/gmd:editionDate> ----------			
			if (hasValue(literatureRow.get("publish_year"))) {
                ciCitation.addElement("gmd:editionDate").addElement(getDateOrDateTime(TRANSF.getISODateFromIGCDate(literatureRow.get("publish_year"))));
			}
		}
	}

    // ---------- <gmd:identificationInfo/gmd:citation/gmd:CI_Citation/gmd:identifier/gmd:RS_Identifier> ----------
    var rsIdentifier = ciCitation.addElement("gmd:identifier/gmd:RS_Identifier");
    rsIdentifier.addElement("gmd:code/gco:CharacterString").addText(getCitationIdentifier(objRow));
    rsIdentifier.addElement("gmd:codeSpace/gco:CharacterString").addText("ingrid");

    // continue mapping literature properties
    if (objClass.equals("2")) {
        var literatureRow = SQL.first("SELECT * from t011_obj_literature WHERE obj_id=?", [objId]);
        if (hasValue(literatureRow)) {
			// ---------- <gmd:identificationInfo/gmd:citation/gmd:CI_Citation/gmd:citedResponsibleParty/gmd:role/@codeListValue=originator> ----------
			if (hasValue(literatureRow.get("author"))) {
				var responsiblePartyOriginator = ciCitation.addElement("gmd:citedResponsibleParty/gmd:CI_ResponsibleParty");
				responsiblePartyOriginator.addElement("gmd:individualName/gco:CharacterString").addText(literatureRow.get("author"));
				responsiblePartyOriginator.addElement("gmd:role/gmd:CI_RoleCode")
	            	.addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#CI_RoleCode")
	            	.addAttribute("codeListValue", "originator");
			}
			// ---------- <gmd:identificationInfo/gmd:citation/gmd:CI_Citation/gmd:citedResponsibleParty/gmd:role/@codeListValue=resourceProvider> ----------
			if (hasValue(literatureRow.get("loc"))) {
				var responsiblePartyResourceProvider = ciCitation.addElement("gmd:citedResponsibleParty/gmd:CI_ResponsibleParty");
				responsiblePartyResourceProvider.addElement("gmd:organisationName/gco:CharacterString").addText("Contact intructions for the location of resource");
				responsiblePartyResourceProvider.addElement("gmd:contactInfo/gmd:CI_Contact/gmd:contactInstructions/gco:CharacterString")
					.addText(literatureRow.get("loc"));
				responsiblePartyResourceProvider.addElement("gmd:role/gmd:CI_RoleCode")
	            	.addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#CI_RoleCode")
	            	.addAttribute("codeListValue", "resourceProvider");
			}
		    var addressRows = SQL.all("SELECT t02_address.*, t012_obj_adr.type FROM t012_obj_adr, t02_address WHERE t012_obj_adr.adr_uuid=t02_address.adr_uuid AND t02_address.work_state=? AND t012_obj_adr.obj_id=? AND t012_obj_adr.type=? ORDER BY line", ['V', objId, 3360]);
		    for (var i=0; i< addressRows.size(); i++) {
		    	ciCitation.addElement("gmd:citedResponsibleParty").addElement(getIdfResponsibleParty(addressRows.get(i), "resourceProvider"));
		    }
			// ---------- <gmd:identificationInfo/gmd:citation/gmd:CI_Citation/gmd:citedResponsibleParty/gmd:role/@codeListValue=publisher> ----------
			if (hasValue(literatureRow.get("publish_loc")) || hasValue(literatureRow.get("publisher"))) {
				var responsiblePartyPublisher = ciCitation.addElement("gmd:citedResponsibleParty/gmd:CI_ResponsibleParty");
				if (!hasValue(literatureRow.get("publisher"))) {
					responsiblePartyPublisher.addElement("gmd:individualName/gco:CharacterString").addText("Location of the editor");
				} else {
					responsiblePartyPublisher.addElement("gmd:individualName/gco:CharacterString").addText(literatureRow.get("publisher"));
				}
				if (hasValue(literatureRow.get("publish_loc"))) {
					responsiblePartyPublisher.addElement("gmd:contactInfo/gmd:CI_Contact/gmd:address/gmd:CI_Address/gmd:city/gco:CharacterString")
						.addText(literatureRow.get("publish_loc"));
				}
				responsiblePartyPublisher.addElement("gmd:role/gmd:CI_RoleCode")
	            	.addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#CI_RoleCode")
	            	.addAttribute("codeListValue", "publisher");
			}
			// ---------- <gmd:identificationInfo/gmd:citation/gmd:CI_Citation/gmd:citedResponsibleParty/gmd:role/@codeListValue=distribute> ----------
			if (hasValue(literatureRow.get("publishing"))) {
				var responsiblePartyDistributor = ciCitation.addElement("gmd:citedResponsibleParty/gmd:CI_ResponsibleParty");
				responsiblePartyDistributor.addElement("gmd:organisationName/gco:CharacterString").addText(literatureRow.get("publishing"));
				responsiblePartyDistributor.addElement("gmd:role/gmd:CI_RoleCode")
		            .addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#CI_RoleCode")
		            .addAttribute("codeListValue", "distribute");
			}
			// ---------- <gmd:identificationInfo/gmd:citation/gmd:CI_Citation/gmd:series> ----------
			var citationSeries;
			if (hasValue(literatureRow.get("publish_in"))) {
				citationSeries = ciCitation.addElement("gmd:series/gmd:CI_Series");
				citationSeries.addElement("gmd:name/gco:CharacterString").addText(literatureRow.get("publish_in"));
			}
			if (hasValue(literatureRow.get("volume"))) {
				if (!citationSeries) citationSeries = ciCitation.addElement("gmd:series/gmd:CI_Series");
				citationSeries.addElement("gmd:issueIdentification/gco:CharacterString").addText(literatureRow.get("volume"));
			}
			if (hasValue(literatureRow.get("sides"))) {
				if (!citationSeries) citationSeries = ciCitation.addElement("gmd:series/gmd:CI_Series");
				citationSeries.addElement("gmd:page/gco:CharacterString").addText(literatureRow.get("sides"));
			}
			if (hasValue(literatureRow.get("doc_info"))) {
				ciCitation.addElement("gmd:otherCitationDetails/gco:CharacterString").addText(literatureRow.get("doc_info"));
			}
			if (hasValue(literatureRow.get("isbn"))) {
				if (!citationSeries) citationSeries = ciCitation.addElement("gmd:series/gmd:CI_Series");
				ciCitation.addElement("gmd:ISBN/gco:CharacterString").addText(literatureRow.get("isbn"));
			}
		}
	} else if (objClass.equals("4")) {
		var projectRow = SQL.first("SELECT * from t011_obj_project WHERE obj_id=?", [objId]);
		if (hasValue(projectRow)) {
			// ---------- <gmd:identificationInfo/gmd:citation/gmd:CI_Citation/gmd:citedResponsibleParty/gmd:role/@codeListValue=projectManager> ----------
			if (hasValue(projectRow.get("leader"))) {
				var responsiblePartyOriginator = ciCitation.addElement("gmd:citedResponsibleParty/gmd:CI_ResponsibleParty");
				responsiblePartyOriginator.addElement("gmd:individualName/gco:CharacterString").addText(projectRow.get("leader"));
				responsiblePartyOriginator.addElement("gmd:role/gmd:CI_RoleCode")
		            .addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#CI_RoleCode")
		            .addAttribute("codeListValue", "projectManager");
			}
		    var addressRows = SQL.all("SELECT t02_address.*, t012_obj_adr.type FROM t012_obj_adr, t02_address WHERE t012_obj_adr.adr_uuid=t02_address.adr_uuid AND t02_address.work_state=? AND t012_obj_adr.obj_id=? AND t012_obj_adr.type=? ORDER BY line", ['V', objId, 3400]);
		    for (var i=0; i< addressRows.size(); i++) {
		    	ciCitation.addElement("gmd:citedResponsibleParty").addElement(getIdfResponsibleParty(addressRows.get(i), "projectManager"));
		    }
			// ---------- <gmd:identificationInfo/gmd:citation/gmd:CI_Citation/gmd:citedResponsibleParty/gmd:role/@codeListValue=projectParticipant> ----------
			if (hasValue(projectRow.get("member"))) {
				var responsiblePartyOriginator = ciCitation.addElement("gmd:citedResponsibleParty/gmd:CI_ResponsibleParty");
				responsiblePartyOriginator.addElement("gmd:individualName/gco:CharacterString").addText(projectRow.get("member"));
				responsiblePartyOriginator.addElement("gmd:role/gmd:CI_RoleCode")
		            .addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#CI_RoleCode")
		            .addAttribute("codeListValue", "projectParticipant");
			}
		    var addressRows = SQL.all("SELECT t02_address.*, t012_obj_adr.type FROM t012_obj_adr, t02_address WHERE t012_obj_adr.adr_uuid=t02_address.adr_uuid AND t02_address.work_state=? AND t012_obj_adr.obj_id=? AND t012_obj_adr.type=? ORDER BY line", ['V', objId, 3410]);
		    for (var i=0; i< addressRows.size(); i++) {
		    	ciCitation.addElement("gmd:citedResponsibleParty").addElement(getIdfResponsibleParty(addressRows.get(i), "projectParticipant"));
		    }
		}
		
	}
	
	// ---------- <gmd:identificationInfo/gmd:abstract> ----------
	var abstr = objRow.get("obj_descr");
    var objServRow;
	if (objClass.equals("3")) {
		// More data of the service that cannot be mapped within ISO19119, but must be 
		// supplied by INSPIRE. Add mapping in abstract
        var abstractPostfixIntro = "\n\n\nWeitere Daten des Dienstes, die nicht standard-konform (ISO 19119) hinterlegt werden k\u00F6nnen, zum Teil gem\u00E4\u00DF INSPIRE-Direktive aber bereit zu stellen sind*:\n\n\n";
		var abstractPostfix; 
		objServRow = SQL.first("SELECT * FROM t011_obj_serv WHERE obj_id=?", [objId]);
		if (hasValue(objServRow.get("environment"))) {
            if (!abstractPostfix) {
                abstractPostfix = abstractPostfixIntro;
            }
			abstractPostfix = abstractPostfix + "Systemumgebung: " + objServRow.get("environment") + "\n";
			abstractPostfix = abstractPostfix + "(environmentDescription/gco:CharacterString= " + objServRow.get("environment") + ")\n\n";
		}
		if (hasValue(objServRow.get("description"))) {
            if (!abstractPostfix) {
                abstractPostfix = abstractPostfixIntro;
            }
			abstractPostfix = abstractPostfix + "Erl\u00E4uterung zum Fachbezug: " + objServRow.get("description") + "\n";
			abstractPostfix = abstractPostfix + "(supplementalInformation/gco:CharacterString= " + objServRow.get("description") + ")\n\n";
		}
		
		var objServScaleRows = SQL.all("SELECT * FROM t011_obj_serv_scale WHERE obj_serv_id=?", [objServRow.get("id")]);
		for (var j=0; j<objServScaleRows.size(); j++) {
			var objServScaleRow = objServScaleRows.get(j);
			if (hasValue(objServScaleRow.get("scale"))) {
                if (!abstractPostfix) {
                    abstractPostfix = abstractPostfixIntro;
                }
				abstractPostfix = abstractPostfix + "Erstellungsma\u00DFstab: " + objServScaleRow.get("scale") + "\n";
				abstractPostfix = abstractPostfix + "(spatialResolution/MD_Resolution/equivalentScale/MD_RepresentativeFraction/denominator/gco:Integer= " + objServScaleRow.get("scale") + ")\n";
			}
		}
		for (var j=0; j<objServScaleRows.size(); j++) {
			var objServScaleRow = objServScaleRows.get(j);
			if (hasValue(objServScaleRow.get("resolution_ground"))) {
                if (!abstractPostfix) {
                    abstractPostfix = abstractPostfixIntro;
                }
				abstractPostfix = abstractPostfix + "Bodenaufl\u00F6sung (Meter): " + objServScaleRow.get("resolution_ground") + "\n";
				abstractPostfix = abstractPostfix + "(spatialResolution/MD_Resolution/distance/gco:Distance[@uom=\"meter\"]= " + objServScaleRow.get("resolution_ground") + ")\n";
			}
		}
		for (var j=0; j<objServScaleRows.size(); j++) {
			var objServScaleRow = objServScaleRows.get(j);
			if (hasValue(objServScaleRow.get("resolution_scan"))) {
                if (!abstractPostfix) {
                    abstractPostfix = abstractPostfixIntro;
                }
				abstractPostfix = abstractPostfix + "Scanaufl\u00F6sung (DPI): " + objServScaleRow.get("resolution_scan") + "\n";
				abstractPostfix = abstractPostfix + "(spatialResolution/MD_Resolution/distance/gco:Distance[@uom=\"dpi\"]= " + objServScaleRow.get("resolution_scan") + ")\n";
			}
		}
        if (abstractPostfix) {
            abstractPostfix = abstractPostfix + "\n\n---\n";
            abstractPostfix = abstractPostfix + "* N\u00E4here Informationen zur INSPIRE-Direktive: http://inspire.jrc.ec.europa.eu/implementingRulesDocs_md.cfm";            
            abstr = abstr + abstractPostfix;
        }
	}
	identificationInfo.addElement("gmd:abstract/gco:CharacterString").addText(abstr);

    // ---------- <gmd:identificationInfo/gmd:purpose> ----------
    
    value = getPurpose(objRow);
    if (hasValue(value)) {
        identificationInfo.addElement("gmd:purpose/gco:CharacterString").addText(value);
    }

    // ---------- <gmd:identificationInfo/gmd:status> ----------
    value = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(523, objRow.get("time_status"));
    if (hasValue(value)) {
        identificationInfo.addElement("gmd:status/gmd:MD_ProgressCode")
            .addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#MD_ProgressCode")
            .addAttribute("codeListValue", value);
    }

    // ---------- <gmd:identificationInfo/gmd:pointOfContact> ----------
    
    // select only entries from syslist 505 (!= 7) and free entries, all entries of syslist 2010 already mapped above (3360, 3400, 3410) 
    var addressRows = SQL.all("SELECT t02_address.*, t012_obj_adr.type, t012_obj_adr.special_name FROM t012_obj_adr, t02_address WHERE t012_obj_adr.adr_uuid=t02_address.adr_uuid AND t02_address.work_state=? AND t012_obj_adr.obj_id=? AND (t012_obj_adr.type IS NULL OR t012_obj_adr.type!=?) AND (t012_obj_adr.special_ref IS NULL OR t012_obj_adr.special_ref=?) ORDER BY line", ['V', objId, 7, 505]);
    for (var i=0; i< addressRows.size(); i++) {
        var addressRow = addressRows.get(i); 
        var role = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(505, addressRow.get("type"));
        if (!hasValue(role)) {
            role = addressRow.get("special_name");
        }
        if (hasValue(role)) {
            identificationInfo.addElement("gmd:pointOfContact").addElement(getIdfResponsibleParty(addressRow, role));
        }
    }

    // ---------- <gmd:identificationInfo/gmd:resourceMaintenance/gmd:MD_MaintenanceInformation> ----------
    value = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(518, objRow.get("time_period"));
    var mdMaintenanceInformation;
    if (hasValue(value)) {
        mdMaintenanceInformation = identificationInfo.addElement("gmd:resourceMaintenance/gmd:MD_MaintenanceInformation");
        mdMaintenanceInformation.addElement("gmd:maintenanceAndUpdateFrequency/gmd:MD_MaintenanceFrequencyCode")
            .addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#MD_MaintenanceFrequencyCode")
            .addAttribute("codeListValue", value);
        var timeInterval = objRow.get("time_interval");
        var timeAlle = objRow.get("time_alle");
        if (hasValue(timeInterval) && hasValue(timeAlle)) {
            var period19108 = "P";
            if (timeInterval.equalsIgnoreCase("Tage")) {
                period19108 = period19108.concat(timeAlle).concat("D");
            } else if (timeInterval.equalsIgnoreCase("Jahre")) {
                period19108 = period19108.concat(timeAlle).concat("Y");
            } else if (timeInterval.equalsIgnoreCase("Monate")) {
                period19108 = period19108.concat(timeAlle).concat("M");
            } else if (timeInterval.equalsIgnoreCase("Stunden")) {
                period19108 = period19108.concat("T").concat(timeAlle).concat("H");
            } else if (timeInterval.equalsIgnoreCase("Minuten")) {
                period19108 = period19108.concat("T").concat(timeAlle).concat("M");
            } else if (timeInterval.equalsIgnoreCase("Sekunden")) {
                period19108 = period19108.concat("T").concat(timeAlle).concat("S");
            }
            mdMaintenanceInformation.addElement("gmd:userDefinedMaintenanceFrequency/gts:TM_PeriodDuration")
                .addText(period19108);
        }
    }
    if (hasValue(objRow.get("time_descr"))) {
        if (!mdMaintenanceInformation) {
            mdMaintenanceInformation = identificationInfo.addElement("gmd:resourceMaintenance/gmd:MD_MaintenanceInformation");
        }
        mdMaintenanceInformation.addElement("gmd:maintenanceNote/gco:CharacterString").addText(objRow.get("time_descr"));
    }

    // ---------- <gmd:identificationInfo/gmd:resourceFormat> ----------
    if (objClass.equals("2")) {
	    row = SQL.first("SELECT type_key, type_value from t011_obj_literature WHERE obj_id=?", [objId]);
	    if (hasValue(row)) {
            value = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(3385, row.get("type_key"));
	        if (!hasValue(value)) {
	            value = row.get("type_value");
	        }
            if (hasValue(value)) {
                var mdFormat = identificationInfo.addElement("gmd:resourceFormat/gmd:MD_Format");
                mdFormat.addElement("gmd:name/gco:CharacterString").addText(value);
                mdFormat.addElement("gmd:version").addAttribute("gco:nilReason", "inapplicable");
                    // add empty gco:CharacterString because of Validators !
                    // NO EMPTY VALUE NOT ALLOWED BY SCHEMA !
//                    .addElement("gco:CharacterString");
            }
	    }
    }

    // ---------- <gmd:identificationInfo/gmd:descriptiveKeywords> ----------
    
    // INSPIRE themes
    rows = SQL.all("SELECT searchterm_value.term, searchterm_value.entry_id, searchterm_value.type FROM searchterm_obj, searchterm_value WHERE searchterm_obj.searchterm_id=searchterm_value.id AND searchterm_obj.obj_id=? AND searchterm_value.type=?", [objId, "I"]);
    var mdKeywords = getMdKeywords(rows);
    if (mdKeywords != null) {
        identificationInfo.addElement("gmd:descriptiveKeywords").addElement(mdKeywords);
    }

    // GEMET Thesaurus
    rows = SQL.all("SELECT searchterm_value.term, searchterm_value.type FROM searchterm_obj, searchterm_value WHERE searchterm_obj.searchterm_id=searchterm_value.id AND searchterm_obj.obj_id=? AND searchterm_value.type=?", [objId, "G"]);
    mdKeywords = getMdKeywords(rows);
    if (mdKeywords != null) {
        identificationInfo.addElement("gmd:descriptiveKeywords").addElement(mdKeywords);
    }

    // UMTHES Thesaurus
    rows = SQL.all("SELECT searchterm_value.term, searchterm_value.type FROM searchterm_obj, searchterm_value WHERE searchterm_obj.searchterm_id=searchterm_value.id AND searchterm_obj.obj_id=? AND (searchterm_value.type=? OR searchterm_value.type=?)", [objId, "2", "T"]);
    mdKeywords = getMdKeywords(rows);
    if (mdKeywords != null) {
        identificationInfo.addElement("gmd:descriptiveKeywords").addElement(mdKeywords);
    }

    // FREE keywords
    rows = SQL.all("SELECT searchterm_value.term, searchterm_value.type FROM searchterm_obj, searchterm_value WHERE searchterm_obj.searchterm_id=searchterm_value.id AND searchterm_obj.obj_id=? AND (searchterm_value.type=? OR searchterm_value.type=?)", [objId, "1", "F"]);
    mdKeywords = getMdKeywords(rows);
    if (mdKeywords != null) {
        identificationInfo.addElement("gmd:descriptiveKeywords").addElement(mdKeywords);
    }

    // SERVICE classifications
    rows = SQL.all("SELECT t011_obj_serv_type.serv_type_key, t011_obj_serv_type.serv_type_value FROM t011_obj_serv, t011_obj_serv_type WHERE t011_obj_serv.id=t011_obj_serv_type.obj_serv_id AND t011_obj_serv.obj_id=?", [objId]);
    mdKeywords = getMdKeywords(rows);
    if (mdKeywords != null) {
        identificationInfo.addElement("gmd:descriptiveKeywords").addElement(mdKeywords);
    }

    // ENVIRONMENTAL classification (category)
    rows = SQL.all("SELECT cat_key FROM t0114_env_category WHERE obj_id=?", [objId]);
    mdKeywords = getMdKeywords(rows);
    if (mdKeywords != null) {
        identificationInfo.addElement("gmd:descriptiveKeywords").addElement(mdKeywords);
    }

    // ENVIRONMENTAL classification (topic)
    rows = SQL.all("SELECT topic_key FROM t0114_env_topic WHERE obj_id=?", [objId]);
    mdKeywords = getMdKeywords(rows);
    if (mdKeywords != null) {
        identificationInfo.addElement("gmd:descriptiveKeywords").addElement(mdKeywords);
    }

    // IS_INSPIRE_RELEVANT leads to specific keyword, see Email Kst "�nderung am ChangeRequest INGRID23_CR_11", 08.02.2011 15:58
    value = objRow.get("is_inspire_relevant");
    if (hasValue(value) && value.equals('Y')) {
        mdKeywords = DOM.createElement("gmd:MD_Keywords");
        mdKeywords.addElement("gmd:keyword/gco:CharacterString").addText("inspireidentifiziert");
        identificationInfo.addElement("gmd:descriptiveKeywords").addElement(mdKeywords);
    }

    // ---------- <gmd:identificationInfo/gmd:resourceSpecificUsage> ----------
    value = objRow.get("dataset_usage");
    if (hasValue(value)) {
        var mdUsage = identificationInfo.addElement("gmd:resourceSpecificUsage").addElement("gmd:MD_Usage");
        mdUsage.addElement("gmd:specificUsage/gco:CharacterString").addText(value);
        mdUsage.addElement("gmd:userContactInfo").addElement("gmd:CI_ResponsibleParty")
            .addElement("gmd:role").addElement("gmd:CI_RoleCode")
            .addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#CI_RoleCode")
            .addAttribute("codeListValue", "pointOfContact");
    }

    // ---------- <gmd:identificationInfo/gmd:resourceConstraints> ----------
    // ---------- <gmd:MD_LegalConstraints> ----------
    addResourceConstraints(identificationInfo, objId);
    
    
    // ---------- <gmd:identificationInfo/gmd:resourceConstraints> ----------
    // ---------- <gmd:MD_SecurityConstraints> ----------
    value = getSecurityConstraint(objRow);
    if (hasValue(value)) {
        identificationInfo.addElement("gmd:resourceConstraints/gmd:MD_SecurityConstraints/gmd:classification/gmd:MD_ClassificationCode")
            .addAttribute("codeListValue", value)
            .addAttribute("codeList", "http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/Codelist/gmxCodelists.xml#gmd:MD_ClassificationCode")
            .addText(value);
    }

// GEODATENDIENST(3) + INFORMATIONSSYSTEM/DIENST/ANWENDUNG(6)
    if (objClass.equals("3") || objClass.equals("6")) {
        var objServRow = SQL.first("SELECT * FROM t011_obj_serv WHERE obj_id=?", [objId]);
        var objServId = objServRow.get("id");
        
        // ---------- <gmd:identificationInfo/srv:serviceType> ----------
        value = getServiceType(objClass, objServRow);
        if (hasValue(value)) {
            identificationInfo.addElement("srv:serviceType/gco:LocalName").addText(value);
        } else {
            identificationInfo.addElement("srv:serviceType").addAttribute("gco:nilReason", "missing");
                // add empty gco:LocalName because of Validators !
                // NO EMPTY VALUE NOT ALLOWED BY SCHEMA !
//                .addElement("gco:LocalName");
        }

        // ---------- <gmd:identificationInfo/srv:serviceTypeVersion> ----------
        rows = SQL.all("SELECT * FROM t011_obj_serv_version WHERE obj_serv_id=?", [objServId]);
        for (i=0; i<rows.size(); i++) {
            identificationInfo.addElement("srv:serviceTypeVersion/gco:CharacterString").addText(rows.get(i).get("serv_version"));
        }

// NICHT GEODATENDIENST(3) + NICHT INFORMATIONSSYSTEM/DIENST/ANWENDUNG(6)
    } else {
        if (objGeoId) {
	        // ---------- <gmd:identificationInfo/gmd:spatialRepresentationType> ----------
	        rows = SQL.all("SELECT type FROM t011_obj_geo_spatial_rep WHERE obj_geo_id=?", [objGeoId]);
	        for (i=0; i<rows.size(); i++) {
	            value = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(526, rows.get(i).get("type"));
	            if (hasValue(value)) {
	                identificationInfo.addElement("gmd:spatialRepresentationType/gmd:MD_SpatialRepresentationTypeCode")
	                    .addAttribute("codeList", "http://www.tc211.org/ISO19115/resources/codeList.xml#MD_SpatialRepresentationTypeCode")
	                    .addAttribute("codeListValue", value);
	            }
	        }
	
	        // ---------- <gmd:identificationInfo/gmd:spatialResolution/gmd:MD_Resolution/gmd:equivalentScale> ----------
	        rows = SQL.all("SELECT * FROM t011_obj_geo_scale WHERE obj_geo_id=?", [objGeoId]);
	        for (i=0; i<rows.size(); i++) {
                if (hasValue(rows.get(i).get("scale"))) {
	                identificationInfo.addElement("gmd:spatialResolution/gmd:MD_Resolution/gmd:equivalentScale/gmd:MD_RepresentativeFraction/gmd:denominator/gco:Integer")
	                    .addText(TRANSF.getISOIntegerFromIGCNumber(rows.get(i).get("scale")));
                }
	        }

            // ---------- <gmd:identificationInfo/gmd:spatialResolution/gmd:MD_Resolution/gmd:distance> ----------
            for (i=0; i<rows.size(); i++) {
                if (hasValue(rows.get(i).get("resolution_ground"))) {
	                identificationInfo.addElement("gmd:spatialResolution/gmd:MD_Resolution/gmd:distance/gco:Distance")
	                    .addAttribute("uom", "meter").addText(rows.get(i).get("resolution_ground"));
                }
            }

            // ---------- <gmd:identificationInfo/gmd:spatialResolution/gmd:MD_Resolution/gmd:distance> ----------
            for (i=0; i<rows.size(); i++) {
                if (hasValue(rows.get(i).get("resolution_scan"))) {
	                identificationInfo.addElement("gmd:spatialResolution/gmd:MD_Resolution/gmd:distance/gco:Distance")
	                    .addAttribute("uom", "dpi").addText(rows.get(i).get("resolution_scan"));
                }
            }
        }

        // ---------- <gmd:identificationInfo/gmd:language> ----------
        value = TRANSF.getLanguageISO639_2FromIGCCode(objRow.get("data_language_key"));
        if (hasValue(value)) {
            identificationInfo.addElement("gmd:language/gmd:LanguageCode")
                .addAttribute("codeList", "http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/Codelist/ML_gmxCodelists.xml#LanguageCode")
                .addAttribute("codeListValue", value);
        }

        // ---------- <gmd:identificationInfo/gmd:characterSet> ----------
        value = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(510, objRow.get("dataset_character_set"));
        if (hasValue(value)) {
            identificationInfo.addElement("gmd:characterSet/gmd:MD_CharacterSetCode")
                .addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#MD_CharacterSetCode")
                .addAttribute("codeListValue", value);
        }

        // ---------- <gmd:identificationInfo/gmd:topicCategory/gmd:MD_TopicCategoryCode> ----------
        rows = SQL.all("SELECT * FROM t011_obj_topic_cat WHERE obj_id=?", [objId]);
        for (i=0; i<rows.size(); i++) {
            value = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(527, rows.get(i).get("topic_category"));
            if (hasValue(value)) {
                identificationInfo.addElement("gmd:topicCategory/gmd:MD_TopicCategoryCode").addText(value);
            }
        }
    }

// ALLE KLASSEN
    addExtent(identificationInfo, objRow);

// GEODATENDIENST(3) + INFORMATIONSSYSTEM/DIENST/ANWENDUNG(6)
    if (objClass.equals("3") || objClass.equals("6")) {
        // ---------- <gmd:identificationInfo/srv:couplingType/srv:SV_CouplingType> ----------
        // also check whether referenced object is published !
        row = SQL.first("SELECT * FROM object_reference, t01_object WHERE object_reference.obj_to_uuid=t01_object.obj_uuid AND obj_from_id=? AND special_ref=? AND t01_object.work_state=?", [objId, 3345, "V"]);
        var typeValue = "loose";
        if (hasValue(row)) {
            typeValue = "tight";
        }
        identificationInfo.addElement("srv:couplingType/srv:SV_CouplingType")
            .addAttribute("codeList", "http://opengis.org/codelistRegistry?SV_CouplingType")
            .addAttribute("codeListValue", typeValue);

        // ---------- <gmd:identificationInfo/srv:containsOperations/srv:SV_OperationMetadata> ----------
        addServiceOperations(identificationInfo, objServId);
    
	    // ---------- <gmd:identificationInfo/srv:operatesOn/gmd:Reference> ----------
	    rows = SQL.all("SELECT object_reference.obj_to_uuid FROM object_reference, t01_object WHERE object_reference.obj_to_uuid=t01_object.obj_uuid AND obj_from_id=? AND special_ref=? AND t01_object.work_state=?", [objId, 3345, "V"]);
	    for (i=0; i<rows.size(); i++) {
	        identificationInfo.addElement("srv:operatesOn").addAttribute("uuidref", rows.get(i).get("obj_to_uuid"));
	    }
	
	    // ---------- <gmd:identificationInfo/gmd:MD_DataIdentification> ----------
        // add second identification info for all information that cannot be mapped into a SV_ServiceIdentification element
        addServiceAdditionalIdentification(mdMetadata, objServRow, objServId);

// NICHT GEODATENDIENST(3) + NICHT INFORMATIONSSYSTEM/DIENST/ANWENDUNG(6)
    } else {
        // ---------- <gmd:identificationInfo/gmd:supplementalInformation> ----------
        value = null;
        var rs;
        if (objClass.equals("5")) {
            rs = SQL.first("SELECT description FROM t011_obj_data WHERE obj_id=?", [objId]);
        } else if (objClass.equals("2")) {
            rs = SQL.first("SELECT description FROM t011_obj_literature WHERE obj_id=?", [objId]);
        } else if (objClass.equals("4")) {
            rs = SQL.first("SELECT description FROM t011_obj_project WHERE obj_id=?", [objId]);
        }
        if (hasValue(rs)) {
        	value = rs.get("description");
        	if (hasValue(value)) {
        		identificationInfo.addElement("gmd:supplementalInformation/gco:CharacterString").addText(value);
        	}
        }
    }

// contentInfo

// GEO-INFORMATION/KARTE(1)
    if (objClass.equals("1")) {
        // ---------- <idf:idfMdMetadata/gmd:contentInfo/gmd:MD_FeatureCatalogueDescription> ----------
        if (objGeoId) {
            var mdFeatureCatalogueDescription;
	        var objGeoKeycRows = SQL.all("SELECT * FROM t011_obj_geo_keyc WHERE obj_geo_id=?", [objGeoId]);
	        for (i=0; i<objGeoKeycRows.size(); i++) {
	            if (!mdFeatureCatalogueDescription) {
	               mdFeatureCatalogueDescription = mdMetadata.addElement("gmd:contentInfo/gmd:MD_FeatureCatalogueDescription");
                   // ---------- <gmd:MD_FeatureCatalogueDescription/gmd:includedWithDataset> ----------
	               var inclWithDataset = objGeoRow.get("keyc_incl_w_dataset");
	               mdFeatureCatalogueDescription.addElement("gmd:includedWithDataset/gco:Boolean")
	                   .addText(hasValue(inclWithDataset) && inclWithDataset.equals("1"));
	
                    // ---------- <gmd:MD_FeatureCatalogueDescription/gmd:featureTypes> ----------
	                var objGeoSupplinfoRows = SQL.all("SELECT feature_type FROM t011_obj_geo_supplinfo WHERE obj_geo_id=?", [objGeoId]);
	                for (j=0; j<objGeoSupplinfoRows.size(); j++) {
	                    if (hasValue(objGeoSupplinfoRows.get(j).get("feature_type"))) {
	                        mdFeatureCatalogueDescription.addElement("gmd:featureTypes/gco:LocalName").addText(objGeoSupplinfoRows.get(j).get("feature_type"));
	                    }
	                }
	            }

                // ---------- <gmd:MD_FeatureCatalogueDescription/gmd:featureCatalogueCitation/gmd:CI_Citation> ----------
                var ciCitation = mdFeatureCatalogueDescription.addElement("gmd:featureCatalogueCitation/gmd:CI_Citation");
                    // ---------- <gmd:CI_Citation/gmd:title> ----------
                ciCitation.addElement("gmd:title/gco:CharacterString").addText(objGeoKeycRows.get(i).get("keyc_value"));
                    // ---------- <gmd:CI_Citation/gmd:CI_Date> ----------
                var ciDate = ciCitation.addElement("gmd:date/gmd:CI_Date");
                if (hasValue(objGeoKeycRows.get(i).get("key_date"))) {
                    ciDate.addElement("gmd:date").addElement(getDateOrDateTime(TRANSF.getISODateFromIGCDate(objGeoKeycRows.get(i).get("key_date"))));
                } else {
                    ciDate.addElement("gmd:date").addAttribute("gco:nilReason", "missing");
                        // add empty gco:Date because of Validators !
                        // NO EMPTY VALUE NOT ALLOWED BY SCHEMA !
//                        .addElement("gco:Date");
                }
                ciDate.addElement("gmd:dateType/gmd:CI_DateTypeCode")
                    .addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#CI_DateTypeCode")
                    .addAttribute("codeListValue", "creation");
                    // ---------- <gmd:CI_Citation/gmd:edition> ----------
                if (hasValue(objGeoKeycRows.get(i).get("edition"))) {
                    ciCitation.addElement("gmd:edition/gco:CharacterString").addText(objGeoKeycRows.get(i).get("edition"));
                }
	        }
        }

        // ---------- <idf:idfMdMetadata/gmd:contentInfo#uuidref> ----------
        rows = SQL.all("SELECT object_reference.obj_to_uuid FROM object_reference, t01_object WHERE object_reference.obj_to_uuid=t01_object.obj_uuid AND obj_from_id=? AND special_ref=? AND t01_object.work_state=?", [objId, 3535, "V"]);
        for (i=0; i<rows.size(); i++) {
            mdMetadata.addElement("gmd:contentInfo").addAttribute("uuidref", rows.get(i).get("obj_to_uuid"));
        }

// DATENSAMMLUNG/DATENBANK(5)
    } else if (objClass.equals("5")) {
        // ---------- <idf:idfMdMetadata/gmd:contentInfo/gmd:MD_FeatureCatalogueDescription> ----------
        var mdFeatureCatalogueDescription;
        var objDataParaRows = SQL.all("SELECT * FROM t011_obj_data_para WHERE obj_id=?", [objId]);
        for (i=0; i<objDataParaRows.size(); i++) {
            var featureType = objDataParaRows.get(i).get("parameter");
            if (hasValue(featureType)) {
                if (!mdFeatureCatalogueDescription) {
                    mdFeatureCatalogueDescription = mdMetadata.addElement("gmd:contentInfo/gmd:MD_FeatureCatalogueDescription");
                    // ---------- <gmd:MD_FeatureCatalogueDescription/gmd:includedWithDataset> ----------
                    mdFeatureCatalogueDescription.addElement("gmd:includedWithDataset/gco:Boolean").addText("false");
                }
                if (hasValue(objDataParaRows.get(i).get("unit"))) {
                    featureType = featureType.concat(" (").concat(objDataParaRows.get(i).get("unit")).concat(")");
                }
                mdFeatureCatalogueDescription.addElement("gmd:featureTypes/gco:LocalName").addText(featureType);
            }
        }
        if (mdFeatureCatalogueDescription) {
            // ---------- <gmd:MD_FeatureCatalogueDescription/gmd:featureCatalogueCitation/gmd:CI_Citation> ----------
            var ciCitation = mdFeatureCatalogueDescription.addElement("gmd:featureCatalogueCitation/gmd:CI_Citation");
            ciCitation.addElement("gmd:title/gco:CharacterString").addText("unknown");
            var ciDate = ciCitation.addElement("gmd:date/gmd:CI_Date");
            ciDate.addElement("gmd:date/gco:Date").addText("2006-05-01");
            ciDate.addElement("gmd:dateType/gmd:CI_DateTypeCode")
                .addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#CI_DateTypeCode")
                .addAttribute("codeListValue", "publication");
        }

        // ---------- <idf:idfMdMetadata/gmd:contentInfo#uuidref> ----------
        rows = SQL.all("SELECT object_reference.obj_to_uuid FROM object_reference, t01_object WHERE object_reference.obj_to_uuid=t01_object.obj_uuid AND obj_from_id=? AND special_ref=? AND t01_object.work_state=?", [objId, 3535, "V"]);
        for (i=0; i<rows.size(); i++) {
            mdMetadata.addElement("gmd:contentInfo").addAttribute("uuidref", rows.get(i).get("obj_to_uuid"));
        }
    }

    addDistributionInfo(mdMetadata, objId);

    // ---------- <idf:idfMdMetadata/gmd:dataQualityInfo/gmd:DQ_DataQuality> ----------
    // ---------- <gmd:DQ_DataQuality/gmd:scope/gmd:DQ_Scope/gmd:level/gmd:MD_ScopeCode> ----------
    var dqDataQuality;
    var liLineage;

// GEO-INFORMATION/KARTE(1)
    if (objClass.equals("1")) {
        // ---------- <gmd:DQ_DataQuality/gmd:report/gmd:DQ_CompletenessOmission> ----------
        if (hasValue(objGeoRow.get("rec_grade"))) {
            dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            var completenessOmission = dqDataQuality.addElement("gmd:report/gmd:DQ_CompletenessOmission");
            // map now INSPIRE conform !
            completenessOmission.addElement("gmd:nameOfMeasure/gco:CharacterString").addText("Rate of missing items");
            completenessOmission.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("7");
            // ATTENTION: ! measureDescription "completeness omission (rec_grade)" is used in portal to differ from DQ_CompletenessOmission in DataQuality Table !
            completenessOmission.addElement("gmd:measureDescription/gco:CharacterString").addText("completeness omission (rec_grade)");
            var dqQuantitativeResult = completenessOmission.addElement("gmd:result/gmd:DQ_QuantitativeResult");
            var unitDefinition = dqQuantitativeResult.addElement("gmd:valueUnit/gml:UnitDefinition")
                .addAttribute("gml:id", "unitDefinition_ID_".concat(TRANSF.getRandomUUID()));
            unitDefinition.addElement("gml:identifier").addAttribute("codeSpace", "");
            unitDefinition.addElement("gml:name").addText("percent");
            unitDefinition.addElement("gml:quantityType").addText("completeness omission");
            unitDefinition.addElement("gml:catalogSymbol").addText("%");
            dqQuantitativeResult.addElement("gmd:value/gco:Record").addText(objGeoRow.get("rec_grade"));
        }

        // ---------- <gmd:DQ_DataQuality/gmd:report/gmd:DQ_RelativeInternalPositionalAccuracy> ----------
        if (hasValue(objGeoRow.get("pos_accuracy_vertical"))) {
            if (!dqDataQuality) {
	            dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            }
            var dqRelativeInternalPositionalAccuracy = dqDataQuality.addElement("gmd:report/gmd:DQ_RelativeInternalPositionalAccuracy");
            dqRelativeInternalPositionalAccuracy.addElement("gmd:measureDescription/gco:CharacterString").addText("vertical");
            var dqQuantitativeResult = dqRelativeInternalPositionalAccuracy.addElement("gmd:result/gmd:DQ_QuantitativeResult");
            var unitDefinition = dqQuantitativeResult.addElement("gmd:valueUnit/gml:UnitDefinition")
                .addAttribute("gml:id", "unitDefinition_ID_".concat(TRANSF.getRandomUUID()));
            unitDefinition.addElement("gml:identifier").addAttribute("codeSpace", "");
            unitDefinition.addElement("gml:name").addText("meter");
            unitDefinition.addElement("gml:quantityType").addText("vertical accuracy");
            unitDefinition.addElement("gml:catalogSymbol").addText("m");
            dqQuantitativeResult.addElement("gmd:value/gco:Record").addText(objGeoRow.get("pos_accuracy_vertical"));
        }

        // ---------- <gmd:DQ_DataQuality/gmd:report/gmd:DQ_RelativeInternalPositionalAccuracy> ----------
        if (hasValue(objGeoRow.get("rec_exact"))) {
            if (!dqDataQuality) {
                dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            }
            var dqRelativeInternalPositionalAccuracy = dqDataQuality.addElement("gmd:report/gmd:DQ_RelativeInternalPositionalAccuracy");
            dqRelativeInternalPositionalAccuracy.addElement("gmd:measureDescription/gco:CharacterString").addText("geographic");
            var dqQuantitativeResult = dqRelativeInternalPositionalAccuracy.addElement("gmd:result/gmd:DQ_QuantitativeResult");
            var unitDefinition = dqQuantitativeResult.addElement("gmd:valueUnit/gml:UnitDefinition")
                .addAttribute("gml:id", "unitDefinition_ID_".concat(TRANSF.getRandomUUID()));
            unitDefinition.addElement("gml:identifier").addAttribute("codeSpace", "");
            unitDefinition.addElement("gml:name").addText("meter");
            unitDefinition.addElement("gml:quantityType").addText("geographic accuracy");
            unitDefinition.addElement("gml:catalogSymbol").addText("m");
            dqQuantitativeResult.addElement("gmd:value/gco:Record").addText(objGeoRow.get("rec_exact"));
        }

        // ---------- <gmd:DQ_DataQuality/gmd:report/gmd:DQ_DomainConsistency/gmd:result/gmd:DQ_ConformanceResult> ----------
	    rows = SQL.all("SELECT * FROM object_conformity WHERE obj_id=?", [objId]);
	    for (i=0; i<rows.size(); i++) {
            var dqConformanceResult = getDqConformanceResultElement(rows.get(i));
    		// only write report if evaluated, see https://dev.wemove.com/jira/browse/INGRID23-165
            if (hasValue(dqConformanceResult)) {
                if (!dqDataQuality) {
                    dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
                }
                dqDataQuality.addElement("gmd:report/gmd:DQ_DomainConsistency/gmd:result")
                    .addElement(dqConformanceResult);
            }
	    }

        addObjectDataQualityTable(objRow, dqDataQuality);

        // ---------- <gmd:DQ_DataQuality/gmd:lineage/gmd:LI_Lineage/gmd:statement> ----------
        if (hasValue(objGeoRow.get("special_base"))) {
            if (!dqDataQuality) {
                dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            }
            liLineage = dqDataQuality.addElement("gmd:lineage/gmd:LI_Lineage");
            liLineage.addElement("gmd:statement/gco:CharacterString").addText(objGeoRow.get("special_base"));
        }

        // ---------- <gmd:DQ_DataQuality/gmd:lineage/gmd:LI_Lineage/gmd:processStep/gmd:LI_ProcessStep/gmd:description> ----------
        if (hasValue(objGeoRow.get("method"))) {
            if (!dqDataQuality) {
                dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            }
            if (!liLineage) {
                liLineage = dqDataQuality.addElement("gmd:lineage/gmd:LI_Lineage");
            }
            liLineage.addElement("gmd:processStep/gmd:LI_ProcessStep/gmd:description/gco:CharacterString").addText(objGeoRow.get("method"));
        }

        // ---------- <gmd:DQ_DataQuality/gmd:lineage/gmd:LI_Lineage/gmd:source/gmd:LI_Source/gmd:description> ----------
        if (hasValue(objGeoRow.get("data_base"))) {
            if (!dqDataQuality) {
                dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            }
            if (!liLineage) {
                liLineage = dqDataQuality.addElement("gmd:lineage/gmd:LI_Lineage");
            }
            liLineage.addElement("gmd:source/gmd:LI_Source/gmd:description/gco:CharacterString").addText(objGeoRow.get("data_base"));
        }

        // ---------- <idf:idfMdMetadata/gmd:portrayalCatalogueInfo/gmd:MD_PortrayalCatalogueReference/gmd:portrayalCatalogueCitation/gmd:CI_Citation> ----------
        rows = SQL.all("SELECT * FROM t011_obj_geo_symc WHERE obj_geo_id=?", [objGeoId]);
        for (i=0; i<rows.size(); i++) {
            var portrayalCICitation = mdMetadata.addElement("gmd:portrayalCatalogueInfo/gmd:MD_PortrayalCatalogueReference/gmd:portrayalCatalogueCitation/gmd:CI_Citation");
            portrayalCICitation.addElement("gmd:title/gco:CharacterString").addText(rows.get(i).get("symbol_cat_value"));

            // ---------- <gmd:CI_Citation/gmd:date/gmd:CI_Date> ----------
            var ciDate = portrayalCICitation.addElement("gmd:date/gmd:CI_Date");
            if (hasValue(rows.get(i).get("symbol_date"))) {
                ciDate.addElement("gmd:date").addElement(getDateOrDateTime(TRANSF.getISODateFromIGCDate(rows.get(i).get("symbol_date"))));
            } else {
                ciDate.addElement("gmd:date").addAttribute("gco:nilReason", "missing");
                    // add empty gco:Date because of Validators !
                    // NO EMPTY VALUE NOT ALLOWED BY SCHEMA !
//                    .addElement("gco:Date");
            }
            ciDate.addElement("gmd:dateType/gmd:CI_DateTypeCode")
                .addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#CI_DateTypeCode")
                .addAttribute("codeListValue", "creation");

            // ---------- <gmd:CI_Citation/gmd:edition> ----------
            if (hasValue(rows.get(i).get("edition"))) {
                portrayalCICitation.addElement("gmd:edition/gco:CharacterString").addText(rows.get(i).get("edition"));
            }
        }
        // ---------- <idf:idfMdMetadata/gmd:portrayalCatalogueInfo#uuidref> ----------
        rows = SQL.all("SELECT object_reference.obj_to_uuid FROM object_reference, t01_object WHERE object_reference.obj_to_uuid=t01_object.obj_uuid AND obj_from_id=? AND special_ref=? AND t01_object.work_state=?", [objId, 3555, "V"]);
        for (i=0; i<rows.size(); i++) {
            mdMetadata.addElement("gmd:portrayalCatalogueInfo").addAttribute("uuidref", rows.get(i).get("obj_to_uuid"));
        }

// GEODATENDIENST(3) + INFORMATIONSSYSTEM/DIENST/ANWENDUNG(6)
    } else if (objClass.equals("3") || objClass.equals("6")) {

        // "object_conformity" ONLY CLASS 3, but we do not distinguish, class 6 should have no rows here !

        // ---------- <gmd:DQ_DataQuality/gmd:report/gmd:DQ_DomainConsistency/gmd:result/gmd:DQ_ConformanceResult> ----------
        rows = SQL.all("SELECT * FROM object_conformity WHERE obj_id=?", [objId]);
        for (i=0; i<rows.size(); i++) {
            var dqConformanceResult = getDqConformanceResultElement(rows.get(i));
    		// only write report if evaluated, see https://dev.wemove.com/jira/browse/INGRID23-165
            if (hasValue(dqConformanceResult)) {
            	if (!dqDataQuality) {
                    dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
                }
                dqDataQuality.addElement("gmd:report/gmd:DQ_DomainConsistency/gmd:result")
                    .addElement(dqConformanceResult);
            }
        }

        // class 3 and class 6

        // ---------- <gmd:DQ_DataQuality/gmd:lineage/gmd:LI_Lineage/gmd:processStep/gmd:LI_ProcessStep/gmd:description> ----------
        if (hasValue(objServRow.get("history"))) {
            dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            liLineage = dqDataQuality.addElement("gmd:lineage/gmd:LI_Lineage");
            liLineage.addElement("gmd:processStep/gmd:LI_ProcessStep/gmd:description/gco:CharacterString").addText(objServRow.get("history"));
        }

        // ---------- <gmd:DQ_DataQuality/gmd:lineage/gmd:LI_Lineage/gmd:source/gmd:LI_Source/gmd:description> ----------
        if (hasValue(objServRow.get("base"))) {
            if (!dqDataQuality) {
                dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            }
            if (!liLineage) {
                liLineage = dqDataQuality.addElement("gmd:lineage/gmd:LI_Lineage");
            }
            liLineage.addElement("gmd:source/gmd:LI_Source/gmd:description/gco:CharacterString").addText(objServRow.get("base"));
        }

// DATENSAMMLUNG/DATENBANK(5)
    } else if (objClass.equals("5")) {
        // ---------- <gmd:DQ_DataQuality/gmd:lineage/gmd:LI_Lineage/gmd:source/gmd:LI_Source/gmd:description> ----------
        var rs = SQL.first("SELECT base FROM t011_obj_data WHERE obj_id=?", [objId]);
    	if (hasValue(rs)) {
    		value = rs.get("base");
            if (hasValue(value)) {
                dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
                liLineage = dqDataQuality.addElement("gmd:lineage/gmd:LI_Lineage");
                liLineage.addElement("gmd:source/gmd:LI_Source/gmd:description/gco:CharacterString").addText(value);
            }
    	}

// DOKUMENT/BERICHT/LITERATUR(2)
    } else if (objClass.equals("2")) {
        // ---------- <gmd:DQ_DataQuality/gmd:lineage/gmd:LI_Lineage/gmd:source/gmd:LI_Source/gmd:description> ----------
        var rs = SQL.first("SELECT base FROM t011_obj_literature WHERE obj_id=?", [objId]);
    	if (hasValue(rs)) {
    		value = rs.get("base");
	        if (hasValue(value)) {
	            dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
	            liLineage = dqDataQuality.addElement("gmd:lineage/gmd:LI_Lineage");
	            liLineage.addElement("gmd:source/gmd:LI_Source/gmd:description/gco:CharacterString").addText(value);
	        }
    	}
    }

    // ---------- <idf:idfMdMetadata/idf:superiorReference> ----------
    rows = SQL.all("SELECT t01_object.* FROM object_node, t01_object WHERE object_node.obj_uuid=? AND object_node.fk_obj_uuid=t01_object.obj_uuid AND t01_object.work_state=?", [objUuid, 'V']);
    for (i=0; i<rows.size(); i++) {
        mdMetadata.addElement(getIdfObjectReference(rows.get(i), "idf:superiorReference"));
    }

    // ---------- <idf:idfMdMetadata/idf:subordinatedReference> ----------
    rows = SQL.all("SELECT t01_object.* FROM object_node, t01_object WHERE object_node.fk_obj_uuid=? AND object_node.obj_id_published=t01_object.id", [objUuid]);
    for (i=0; i<rows.size(); i++) {
        mdMetadata.addElement(getIdfObjectReference(rows.get(i), "idf:subordinatedReference"));
    }

    // ---------- <idf:idfMdMetadata/idf:crossReference> ----------
    rows = SQL.all("SELECT t01_object.* FROM object_reference, t01_object WHERE object_reference.obj_from_id=? AND object_reference.obj_to_uuid=t01_object.obj_uuid AND t01_object.work_state=?", [objId, 'V']);
    for (i=0; i<rows.size(); i++) {
        mdMetadata.addElement(getIdfObjectReference(rows.get(i), "idf:crossReference"));
    }

// GEODATENDIENST(3)
    if (objClass.equals("3")) {
	    // ---------- <idf:idfMdMetadata/idf:hasAccessConstraint> ----------
        var hasConstraint = false; 
        if (hasValue(objServRow.get("has_access_constraint"))) {
            hasConstraint = objServRow.get("has_access_constraint").equals("Y");
        }
        mdMetadata.addElement("idf:hasAccessConstraint").addText(hasConstraint);
    }

    // ---------- <idf:idfMdMetadata/idf:exportCriteria> ----------
    rows = SQL.all("SELECT * FROM t014_info_impart WHERE obj_id=?", [objId]);
    for (i=0; i<rows.size(); i++) {
        value = rows.get(i).get("impart_value");
        if (hasValue(value)) {
            mdMetadata.addElement("idf:exportCriteria").addText(value);
        }
    }
}


// Return gco:Date element containing only the date section, ignore the time part of the date
function getDate(dateValue) {
    var gcoElement = DOM.createElement("gco:Date");
    if (dateValue.indexOf("T") > -1) {
        dateValue = dateValue.substring(0, dateValue.indexOf("T"));
    }
    gcoElement.addText(dateValue);
    return gcoElement;
}

// Return gco:Date OR gco:DateTime element dependent from passed date format.
function getDateOrDateTime(dateValue) {
    var gcoElement;
    if (dateValue.indexOf("T") > -1) {
        gcoElement = DOM.createElement("gco:DateTime");
    } else {
        gcoElement = DOM.createElement("gco:Date");
    }
    gcoElement.addText(dateValue);
    return gcoElement;
}


// "nicht evaluiert"(3) leads to nilReason "unknown"
function getDqConformanceResultElement(conformityRow) {
	if (!hasValue(conformityRow.get("degree_key")) || conformityRow.get("degree_key").equals("3")) {
        // "not evaluated", we retuen null element indicating no "gmd:report" should be written
		// see https://dev.wemove.com/jira/browse/INGRID23-165
		if (log.isDebugEnabled()) {
			log.debug("Object_conformity degree_key = " + conformityRow.get("degree_key") + " (3=not evaluated), we skip this one, no gmd:report !");
		}
		return null;
    }

	var dqConformanceResult = DOM.createElement("gmd:DQ_ConformanceResult");
    var ciCitation = dqConformanceResult.addElement("gmd:specification/gmd:CI_Citation");
	if (hasValue(conformityRow.get("specification"))) {
		ciCitation.addElement("gmd:title/gco:CharacterString").addText(conformityRow.get("specification"));
	} else {
		ciCitation.addElement("gmd:title").addAttribute("gco:nilReason", "missing");
	}
    var ciDate = ciCitation.addElement("gmd:date/gmd:CI_Date");
    if (hasValue(conformityRow.get("publication_date"))) {
	    ciDate.addElement("gmd:date").addElement(getDateOrDateTime(TRANSF.getISODateFromIGCDate(conformityRow.get("publication_date"))));
    } else {
    	ciDate.addElement("gmd:date").addAttribute("gco:nilReason", "missing");
    }
    ciDate.addElement("gmd:dateType/gmd:CI_DateTypeCode")
        .addAttribute("codeList", "http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/Codelist/ML_gmxCodelists.xml#CI_DateTypeCode")
        .addAttribute("codeListValue", "publication")
        .addText("publication");
    dqConformanceResult.addElement("gmd:explanation/gco:CharacterString").addText("");
    dqConformanceResult.addElement("gmd:pass/gco:Boolean").addText(conformityRow.get("degree_key").equals("1"));
    return dqConformanceResult;
}

function getDqDataQualityElement(objClass) {
    var dqDataQuality = DOM.createElement("gmd:DQ_DataQuality");
    dqDataQuality.addElement("gmd:scope/gmd:DQ_Scope/gmd:level/gmd:MD_ScopeCode")
        .addAttribute("codeListValue", getHierarchLevel(objClass))
        .addAttribute("codeList", "http://www.isotc211.org/2005/resources/codeList.xml#MD_ScopeCode");
    return dqDataQuality;
}

/**
 * Get the fileIdentifier. Try to use DB column "org_obj_id". If not found use column "obj_uuid".
 * 
 * @param objRow DB row representing a t01_object row.
 * @return
 */
function getFileIdentifier(objRow) {
	var fileIdentifier = objRow.get("org_obj_id");
	if (!hasValue(fileIdentifier)) {
		fileIdentifier = objRow.get("obj_uuid");
	}
	return fileIdentifier;
}

/**
 * Create a citation identifier. Try to obtain the identifier from datasource uuid in IGC. 
 * If this fails generate a new UUID based on the fileIdentifier, because the citation Identifier
 * must not be the same as the fileIdentifier. 
 * 
 * @param hit
 * @return
 */
function getCitationIdentifier(objRow) {
	var id;
	var objGeoRow = SQL.first("SELECT * FROM t011_obj_geo WHERE obj_id=?", [objId]);
	if (hasValue(objGeoRow)) {
		id = objGeoRow.get("datasource_uuid");
	}
    if (!hasValue(id)) {
    	id = getFileIdentifier(objRow);
    	id = java.util.UUID.nameUUIDFromBytes(id.getBytes()).toString();
    } else {
    	id = id.replaceAll(":", "#");
    }
    return id;
}

/**
 * Creates an ISO CI_ResponsibleParty element based on a address row and a role. 
 * 
 * @param addressRow
 * @param role
 * @return
 */
function getIdfResponsibleParty(addressRow, role, specialElementName) {
	var parentAddressRowPathArray = getAddressRowPathArray(addressRow);
	var myElementName = "idf:idfResponsibleParty";
	if (hasValue(specialElementName)) {
	   myElementName = specialElementName;
	}
	var idfResponsibleParty = DOM.createElement(myElementName)
        .addAttribute("uuid", addressRow.get("adr_uuid"))
        .addAttribute("type", addressRow.get("adr_type"));
    if (hasValue(addressRow.get("org_adr_id"))) {
        idfResponsibleParty.addAttribute("orig-uuid", addressRow.get("org_adr_id"));
    }   
	var individualName = getIndividualNameFromAddressRow(addressRow);
	if (hasValue(individualName)) {
    	idfResponsibleParty.addElement("gmd:individualName").addElement("gco:CharacterString").addText(individualName);
	}
	var institution = getInstitution(parentAddressRowPathArray);
	if (hasValue(institution)) {
		idfResponsibleParty.addElement("gmd:organisationName").addElement("gco:CharacterString").addText(institution);
	}
	if (hasValue(addressRow.get("job"))) {
		idfResponsibleParty.addElement("gmd:positionName").addElement("gco:CharacterString").addText(addressRow.get("job"));
	}
	var ciContact = idfResponsibleParty.addElement("gmd:contactInfo").addElement("gmd:CI_Contact");
    var communicationsRows = SQL.all("SELECT t021_communication.* FROM t021_communication WHERE t021_communication.adr_id=? order by line", [addressRow.get("id")]);
	var ciTelephone;
	var emailAddresses = new Array();
	var urls = new Array();
    for (var j=0; j< communicationsRows.size(); j++) {
    	if (!ciTelephone) ciTelephone = ciContact.addElement("gmd:phone").addElement("gmd:CI_Telephone");
    	var communicationsRow = communicationsRows.get(j);
    	if (communicationsRow.get("commtype_key") == 1) {
    		// phone
    		ciTelephone.addElement("gmd:voice/gco:CharacterString").addText(communicationsRow.get("comm_value"));
    	} else if (communicationsRow.get("commtype_key") == 2) {
    		// fax
    		ciTelephone.addElement("gmd:facsimile/gco:CharacterString").addText(communicationsRow.get("comm_value"));
    	} else if (communicationsRow.get("commtype_key") == 3) {
    		emailAddresses.push(communicationsRow.get("comm_value"));
    	} else if (communicationsRow.get("commtype_key") == 4) {
    		urls.push(communicationsRow.get("comm_value"));
    	}
    }
    var ciAddress;
    if (hasValue(addressRow.get("postbox")) || hasValue(addressRow.get("postbox_pc")) ||
    		hasValue(addressRow.get("city")) || hasValue(addressRow.get("street"))) {
    	if (!ciAddress) ciAddress = ciContact.addElement("gmd:address").addElement("gmd:CI_Address");
		if (hasValue(addressRow.get("postbox"))) {
			if(hasValue(addressRow.get("postbox_pc"))){
				ciAddress.addElement("gmd:deliveryPoint").addElement("gco:CharacterString").addText("Postbox " + addressRow.get("postbox") + "," + addressRow.get("postbox_pc") + " " + addressRow.get("city"));
			}else if(hasValue(addressRow.get("postcode"))){
				ciAddress.addElement("gmd:deliveryPoint").addElement("gco:CharacterString").addText("Postbox " + addressRow.get("postbox") + "," + addressRow.get("postcode") + " " + addressRow.get("city"));
			}else{
				ciAddress.addElement("gmd:deliveryPoint").addElement("gco:CharacterString").addText("Postbox " + addressRow.get("postbox"));
			}
		}
		ciAddress.addElement("gmd:deliveryPoint").addElement("gco:CharacterString").addText(addressRow.get("street"));
		ciAddress.addElement("gmd:city").addElement("gco:CharacterString").addText(addressRow.get("city"));
		ciAddress.addElement("gmd:postalCode").addElement("gco:CharacterString").addText(addressRow.get("postcode"));
	}
    if (hasValue(addressRow.get("country_key"))) {
    	if (!ciAddress) ciAddress = ciContact.addElement("gmd:address/gmd:CI_Address");
    	ciAddress.addElement("gmd:country/gco:CharacterString").addText(TRANSF.getISO3166_1_Alpha_3FromNumericLanguageCode(addressRow.get("country_key")));
    }
    for (var j=0; j<emailAddresses.length; j++) {
    	if (!ciAddress) ciAddress = ciContact.addElement("gmd:address/gmd:CI_Address");
    	ciAddress.addElement("gmd:electronicMailAddress/gco:CharacterString").addText(emailAddresses[j]);
    }
    // ISO only supports ONE url per contact
    if (urls.length > 0) {
    	ciContact.addElement("gmd:onlineResource/gmd:CI_OnlineResource/gmd:linkage/gmd:URL").addText(urls[0]);
    }

    if (hasValue(role)) {
	    idfResponsibleParty.addElement("gmd:role/gmd:CI_RoleCode")
	        .addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#CI_RoleCode")
	        .addAttribute("codeListValue", role);   
    } else {
        idfResponsibleParty.addElement("gmd:role").addAttribute("gco:nilReason", "inapplicable");
    }

    // -------------- IDF ----------------------

    // First URL already mapped ISO conform, now add all other ones IDF like (skip first one)
    if (urls.length > 1) {
	    for (var j=1; j<urls.length; j++) {
	        idfResponsibleParty.addElement("idf:additionalOnlineResource/gmd:linkage/gmd:URL").addText(urls[j]);
	    }
    }

    // flatten parent hierarchy, add every parent (including myself) separately
    for (var j=0; j<parentAddressRowPathArray.length; j++) {
        idfResponsibleParty.addElement(getIdfAddressReference(parentAddressRowPathArray[j], "idf:hierarchyParty"));
    }

    return idfResponsibleParty;
}

/**
 * Returns the institution based on all parents of an address.
 * 
 * @param parentAdressRowPathArray
 * @return
 */
function getInstitution(parentAdressRowPathArray) {
	var institution = "";
	for(var i=0; i<parentAdressRowPathArray.length; i++) {
	    var newInstitution = getOrganisationNameFromAddressRow(parentAdressRowPathArray[i]);
		if (hasValue(newInstitution)) {
			if (hasValue(institution)) {
				institution = ", " + institution;
			}
			institution = newInstitution + institution;
		}
	}
    if (log.isDebugEnabled()) {
    	log.debug("Got institution '" + institution + "' from address path array:" + parentAdressRowPathArray);
    }
    return institution;
}

/**
 * Get the individual name from a address record.
 * 
 * @param addressRow
 * @return The individual name.
 */
function getIndividualNameFromAddressRow(addressRow) {
    var individualName = "";
    var addressing = addressRow.get("address_value");
    var title = addressRow.get("title_value");
    var firstName = addressRow.get("firstname");
    var lastName = addressRow.get("lastname");

    if (hasValue(lastName)) {
    	individualName = lastName;
    }
    
    if (hasValue(firstName)) {
    	individualName = hasValue(individualName) ? individualName += ", " + firstName : firstName;
    }
    
    if (hasValue(title) && !hasValue(addressing)) {
    	individualName = IngridQueryHelper.hasValue(individualName) ? individualName += ", " + title : title;
    } else if (!hasValue(title) && hasValue(addressing)) {
    	individualName = hasValue(individualName) ? individualName += ", " + addressing : addressing;
    } else if (hasValue(title) && hasValue(addressing)) {
    	individualName = hasValue(individualName) ? individualName += ", " + addressing + " " + title : addressing + " " + title;
    }
    
    if (log.isDebugEnabled()) {
    	log.debug("Got individualName '" + individualName + "' from address record:" + addressRow);
    }
    
    return individualName;
}

function getOrganisationNameFromAddressRow(addressRow) {
    var organisationName = "";

    if (hasValue(addressRow.get("institution"))) {
        organisationName = addressRow.get("institution");
    }

    return organisationName;
}

/**
 * Returns an array of address rows representing the complete path from 
 * the given address (first entry in array) to the farthest parent 
 * (last entry in array).
 * 
 * @param addressRow The database address ro to start from.
 * @return The array with all parent address rows.
 */
function getAddressRowPathArray(addressRow) {
	var results = new Array();
    if (log.isDebugEnabled()) {
    	log.debug("Add address with uuid '" + addressRow.get("adr_uuid") + "' to address path:" + parentAdressRow);
    }
    results.push(addressRow);
    var addrId = addressRow.get("id");
    var parentAdressRow = SQL.first("SELECT t02_address.* FROM t02_address, address_node WHERE address_node.addr_id_published=? AND address_node.fk_addr_uuid=t02_address.adr_uuid AND t02_address.work_state=?", [addrId, "V"]);
    while (hasValue(parentAdressRow)) {
        if (log.isDebugEnabled()) {
        	log.debug("Add address with uuid '"+parentAdressRow.get("adr_uuid")+"' to address path:" + parentAdressRow);
        }
    	results.push(parentAdressRow);
    	addrId = parentAdressRow.get("id");
    	parentAdressRow = SQL.first("SELECT t02_address.* FROM t02_address, address_node WHERE address_node.addr_id_published=? AND address_node.fk_addr_uuid=t02_address.adr_uuid AND t02_address.work_state=?", [addrId, "V"]);
    }
    return results;
}

function getHierarchLevel(objClass) {
    var hierarchyLevel = null;
    if (objClass == "0") {
        hierarchyLevel = "nonGeographicDataset";
    } else if (objClass == "1") {
        var rows = SQL.all("SELECT hierarchy_level FROM t011_obj_geo WHERE obj_id=?", [objId]);
        // Should be only one row !
        for (j=0; j<rows.size(); j++) {
            hierarchyLevel = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(525, rows.get(j).get("hierarchy_level"));
        }
    } else if (objClass == "2") {
        hierarchyLevel = "nonGeographicDataset";
    } else if (objClass == "3") {
        hierarchyLevel = "service";
    } else if (objClass == "4") {
        hierarchyLevel = "nonGeographicDataset";
    } else if (objClass == "5") {
        hierarchyLevel = "nonGeographicDataset";
    } else if (objClass == "6") {
        hierarchyLevel = "application";
    } else {
        log.error("Unsupported UDK class '" + objClass
	            + "'. Only class 0 to 6 are supported by the CSW interface.");
    }
    
    return hierarchyLevel;
}

function map(needle, haystack) {
    for( var key in haystack ) {
    	if (key == needle) {
    		return haystack[key];
    	}
    }
    log.error("Could not find needle '" + needle + "' in haystack: " + haystack);
    
    return needle; 
}

function getPurpose(objRow) {
    var purpose = objRow.get("info_note");
    if (!hasValue(purpose)) {
        purpose = "";
    }
    return purpose;
}

/**
 * Creates an ISO MD_Keywords element based on the rows passed.
 * NOTICE: All passed rows (keywords) have to be of same type (UMTHES || GEMET || INSPIRE || FREE || SERVICE classifications || ...).
 * Only first row is analyzed.
 * Returns null if no keywords added (no rows found or type of keywords cannot be determined ...) !
 */
function getMdKeywords(rows) {
    if (rows == null || rows.size() == 0) {
        return null;
    }

    var mdKeywords = DOM.createElement("gmd:MD_Keywords");
    var keywordsAdded = false;
    for (i=0; i<rows.size(); i++) {
        var row = rows.get(i);
        var keywordValue = null;

        // "searchterm_value" table
        if (hasValue(row.get("term"))) {
            keywordValue = row.get("term");

            // INSPIRE always has to be in ENGLISH for correct mapping in IGE CSW Import
            var type = row.get("type");
            if (type.equals("I")) {
                keywordValue = TRANSF.getIGCSyslistEntryName(6100, row.get("entry_id"), "en");
            }

        // "t011_obj_serv_type" table
        } else if (hasValue(row.get("serv_type_key"))) {
            keywordValue = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(5200, row.get("serv_type_key"));

        // "t0114_env_category" table
        } else if (hasValue(row.get("cat_key"))) {
            keywordValue = TRANSF.getIGCSyslistEntryName(1400, row.get("cat_key"), "en");

        // "t0114_env_topic" table
        } else if (hasValue(row.get("topic_key"))) {
            keywordValue = TRANSF.getIGCSyslistEntryName(1410, row.get("topic_key"), "en");
        }

        if (hasValue(keywordValue)) {
            mdKeywords.addElement("gmd:keyword/gco:CharacterString").addText(keywordValue);
            keywordsAdded = true;
        }
    }

    if (!keywordsAdded) {
        return null;
    }
   
    var keywTitle;
    var keywDate;
    
    // "searchterm_value" table
    if (rows.get(0).get("type")) {
	    var type = rows.get(0).get("type");
	    if (type.equals("F")) {
	        return mdKeywords;

	    } else if (type.equals("2") || type.equals("T")) {
	        keywTitle = "UMTHES Thesaurus";
	        keywDate = "2009-01-15";
	    } else if (type.equals("1") || type.equals("G")) {
	        keywTitle = "GEMET - Concepts, version 2.1";
	        keywDate = "2008-06-13";
	    } else if (type.equals("I")) {
	        keywTitle = "GEMET - INSPIRE themes, version 1.0";
	        keywDate = "2008-06-01";
	    } else {
	        return null;
	    }

    // "t011_obj_serv_type" table
    } else if (rows.get(0).get("serv_type_key")) {
        keywTitle = "Service Classification, version 1.0";
        keywDate = "2008-06-01";

    // "t0114_env_category" table
    } else if (rows.get(0).get("cat_key")) {
        keywTitle = "German Environmental Classification - Category, version 1.0";
        keywDate = "2006-05-01";

    // "t0114_env_topic" table
    } else if (rows.get(0).get("topic_key")) {
        keywTitle = "German Environmental Classification - Topic, version 1.0";
        keywDate = "2006-05-01";
    }

    mdKeywords.addElement("gmd:type/gmd:MD_KeywordTypeCode")
        .addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#MD_KeywordTypeCode")
        .addAttribute("codeListValue", "theme");
    var thesCit = mdKeywords.addElement("gmd:thesaurusName/gmd:CI_Citation");
    thesCit.addElement("gmd:title/gco:CharacterString").addText(keywTitle);
    var thesCitDate = thesCit.addElement("gmd:date/gmd:CI_Date");
    thesCitDate.addElement("gmd:date/gco:Date").addText(keywDate);
    thesCitDate.addElement("gmd:dateType/gmd:CI_DateTypeCode")
        .addAttribute("codeListValue", "publication")
        .addAttribute("codeList", "http://www.isotc211.org/2005/resources/codeList.xml#CI_DateTypeCode");

    return mdKeywords;
}

function getSecurityConstraint(objRow) {
    var retValue = null;

    var publishId = objRow.get("publish_id");
    if (hasValue(publishId)) {
        if (publishId.equals("1")) {
            retValue = "unclassified";
        } else if (publishId.equals("2")) {
            retValue = "restricted";
        } else if (publishId.equals("3")) {
            retValue = "confidential";
        }
    }
    return retValue;
}

function getServiceType(objClass, objServRow) {
    var retValue = objServRow.get("type_value");

    var serviceTypeKey = objServRow.get("type_key");
    if (serviceTypeKey != null) {
        if (objClass.equals("3")) {
            if (serviceTypeKey.equals("1")) {
	            retValue = "discovery";
	        } else if (serviceTypeKey.equals("2")) {
	            retValue = "view";
	        } else if (serviceTypeKey.equals("3")) {
	            retValue = "download";
	        } else if (serviceTypeKey.equals("4")) {
                retValue = "transformation";
            } else if (serviceTypeKey.equals("5")) {
                retValue = "invoke";
            } else  {
                retValue = "other";
            }
        } else if (objClass.equals("6")) {
            if (serviceTypeKey.equals("1")) {
                retValue = "information system";
            } else if (serviceTypeKey.equals("2")) {
                retValue = "non geographic service";
	        } else if (serviceTypeKey.equals("3")) {
	           retValue = "application";
	        } else  {
	           retValue = "other";
	        }
        }
    }
    return retValue;
}


function addResourceConstraints(identificationInfo, objId) {
    rows = SQL.all("SELECT terms_of_use FROM object_use WHERE obj_id=?", [objId]);
    for (var i=0; i<rows.size(); i++) {
        var termsOfUse = rows.get(i).get("terms_of_use");
        if (hasValue(termsOfUse)) {
            identificationInfo.addElement("gmd:resourceConstraints/gmd:MD_LegalConstraints/gmd:useLimitation/gco:CharacterString").addText(termsOfUse);
        }
    }

    rows = SQL.all("SELECT * FROM object_access WHERE obj_id=?", [objId]);
    if (rows.size() > 0) {
        // iterate all access constraint and build separate lists to be mapped to different ISO elements !
        var accessConstraints = [];
        var otherConstraints = [];

        for (var i=0; i<rows.size(); i++) {
            row = rows.get(i);

            // IGC syslist entry or free entry ?
            value = TRANSF.getIGCSyslistEntryName(6010, row.get("restriction_key"), "en");
            if (hasValue(value)) {
                // value from IGC syslist, map as gmd:otherConstraints
                otherConstraints.push(value);
            } else {
                // free entry, check whether ISO entry
                value = row.get("restriction_value");
                if (hasValue(TRANSF.getISOCodeListEntryId(524, value))) {
                    // we have entry from ISO restriction code list, map as gmd:accessConstraints
                    accessConstraints.push(value);
                } else if (hasValue(value)) {
	                // no entry from ISO codelist, map as gmd:otherConstraints
	                otherConstraints.push(value);
                }
            }            
        }

        // ---------- <gmd:MD_LegalConstraints/gmd:accessConstraints> ----------
        // first map gmd:accessConstraints
		for (var i=0; i<accessConstraints.length; i++) {
            // we do NOT check whether we have "otherRestrictions" as access constraint (entered as free entry) !
            identificationInfo.addElement("gmd:resourceConstraints/gmd:MD_LegalConstraints/gmd:accessConstraints/gmd:MD_RestrictionCode")
                    .addAttribute("codeListValue", accessConstraints[i])
                    .addAttribute("codeList", "http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/Codelist/gmxCodelists.xml#MD_RestrictionCode")
                    .addText(accessConstraints[i]);
		}

        // ---------- <gmd:MD_LegalConstraints/gmd:otherConstraints> ----------
        // then map gmd:otherConstraints
        for (var i=0; i<otherConstraints.length; i++) {
            var mdLegalConstraints = identificationInfo.addElement("gmd:resourceConstraints/gmd:MD_LegalConstraints");
            mdLegalConstraints.addElement("gmd:accessConstraints/gmd:MD_RestrictionCode")
                .addAttribute("codeListValue", "otherRestrictions")
                .addAttribute("codeList", "http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/Codelist/gmxCodelists.xml#MD_RestrictionCode")
                .addText("otherRestrictions");
            mdLegalConstraints.addElement("gmd:otherConstraints/gco:CharacterString").addText(otherConstraints[i]);
        }
    }

    rows = SQL.all("SELECT legist_value from t015_legist WHERE obj_id=?", [objId]);
    for (var i=0; i<rows.size(); i++) {
        var mdLegalConstraints = identificationInfo.addElement("gmd:resourceConstraints/idf:idfLegalBasisConstraints");
        mdLegalConstraints.addElement("gmd:accessConstraints/gmd:MD_RestrictionCode")
            .addAttribute("codeListValue", "otherRestrictions")
            .addAttribute("codeList", "http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/Codelist/gmxCodelists.xml#MD_RestrictionCode")
            .addText("otherRestrictions");
        mdLegalConstraints.addElement("gmd:otherConstraints/gco:CharacterString").addText(rows.get(i).get("legist_value"));
    }	
}


function addExtent(identificationInfo, objRow) {
// ---------- <gmd:identificationInfo/srv:extent/gmd:EX_Extent> ----------
// ---------- <gmd:identificationInfo/gmd:extent/gmd:EX_Extent> ----------

    var extentElemName = "gmd:extent"; 
    if (objClass.equals("3") || objClass.equals("6")) {
        extentElemName = "srv:extent";
    }

    // ---------- <gmd:EX_Extent/gmd:description> ----------
    var exExtent;
    if (hasValue(objRow.get("loc_descr"))) {
        exExtent = identificationInfo.addElement(extentElemName).addElement("gmd:EX_Extent");
        exExtent.addElement("gmd:description/gco:CharacterString").addText(objRow.get("loc_descr"));
    }

    // ---------- <gmd:EX_Extent/gmd:geographicElement> ----------
    rows = SQL.all("SELECT spatial_ref_value.* FROM spatial_reference, spatial_ref_value WHERE spatial_reference.spatial_ref_id=spatial_ref_value.id AND spatial_reference.obj_id=?", [objId]);
    for (i=0; i<rows.size(); i++) {
        row = rows.get(i);
        if (!exExtent) {
            exExtent = identificationInfo.addElement(extentElemName).addElement("gmd:EX_Extent");
        }
        
        // ---------- <gmd:geographicElement/gmd:EX_GeographicDescription> ----------
        var geoIdentifier = getGeographicIdentifier(row);
        if (hasValue(geoIdentifier)) {
            // Spatial_ref_value.name_value + nativekey MD_Metadata/gmd:identificationInfo/srv:CSW_ServiceIdentification/srv:extent/gmd:EX_Extent/gmd:geographicElement/gmd:EX_GeographicDescription/gmd:geographicIdentifier/gmd:MD_Identifier/code/gco:CharacterString
            var exGeographicDescription = exExtent.addElement("gmd:geographicElement/gmd:EX_GeographicDescription");
            exGeographicDescription.addElement("gmd:extentTypeCode/gco:Boolean").addText("true");
            exGeographicDescription.addElement("gmd:geographicIdentifier/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText(geoIdentifier);
        }
        // ---------- <gmd:geographicElement/gmd:EX_GeographicBoundingBox> ----------
        if (hasValue(row.get("x1")) && hasValue(row.get("x2")) && hasValue(row.get("y1")) && hasValue(row.get("y2"))) {
            // Spatial_ref_value.x1 MD_Metadata/identificationInfo/MD_DataIdentification/extent/EX_Extent/geographicElement/EX_GeographicBoundingBox.westBoundLongitude/gmd:approximateLongitude
            var exGeographicBoundingBox = exExtent.addElement("gmd:geographicElement/gmd:EX_GeographicBoundingBox");
            exGeographicBoundingBox.addElement("gmd:extentTypeCode/gco:Boolean").addText("true");
            exGeographicBoundingBox.addElement("gmd:westBoundLongitude/gco:Decimal").addText(TRANSF.getISODecimalFromIGCNumber(row.get("x1")));
            exGeographicBoundingBox.addElement("gmd:eastBoundLongitude/gco:Decimal").addText(TRANSF.getISODecimalFromIGCNumber(row.get("x2")));
            exGeographicBoundingBox.addElement("gmd:southBoundLatitude/gco:Decimal").addText(TRANSF.getISODecimalFromIGCNumber(row.get("y1")));
            exGeographicBoundingBox.addElement("gmd:northBoundLatitude/gco:Decimal").addText(TRANSF.getISODecimalFromIGCNumber(row.get("y2")));
        }
    }

    // ---------- <gmd:EX_Extent/gmd:temporalElement/gmd:EX_TemporalExtent> ----------
    var timeRange = getTimeRange(objRow);
    if (hasValue(timeRange.beginDate) || hasValue(timeRange.endDate)) {
        if (!exExtent) {
            exExtent = identificationInfo.addElement(extentElemName).addElement("gmd:EX_Extent");
        }
        // T01_object.time_from MD_Metadata/identificationInfo/MD_DataIdentification/extent/EX_Extent/temporalElement/EX_TemporalExtent/extent/gml:TimePeriod/
        var timePeriod = exExtent.addElement("gmd:temporalElement/gmd:EX_TemporalExtent/gmd:extent/gml:TimePeriod")
            .addAttribute("gml:id", "timePeriod_ID_".concat(TRANSF.getRandomUUID()));
        if (hasValue(timeRange.beginDate)) {
            timePeriod.addElement("gml:beginPosition").addText(TRANSF.getISODateFromIGCDate(timeRange.beginDate));
        } else {
            timePeriod.addElement("gml:beginPosition").addText("");
        }
        if (hasValue(timeRange.endDate)) {
            timePeriod.addElement("gml:endPosition").addText(TRANSF.getISODateFromIGCDate(timeRange.endDate));
        } else {
            timePeriod.addElement("gml:endPosition").addText("");
        }
    }        

    // ---------- <gmd:EX_Extent/gmd:verticalElement/gmd:EX_VerticalExtent> ----------
    var verticalExtentMin = objRow.get("vertical_extent_minimum"); 
    var verticalExtentMax = objRow.get("vertical_extent_maximum");
    if (hasValue(verticalExtentMin) && hasValue(verticalExtentMax)) {
        if (!exExtent) {
            exExtent = identificationInfo.addElement(extentElemName).addElement("gmd:EX_Extent");
        }
        var exVerticalExtent = exExtent.addElement("gmd:verticalElement/gmd:EX_VerticalExtent");
        // T01_object.vertical_extent_minimum MD_Metadata/identificationInfo/MD_DataIdentification/extent/EX_Extent/verticalElement/EX_VerticalExtent.minimumValue
        exVerticalExtent.addElement("gmd:minimumValue/gco:Real").addText(TRANSF.getISORealFromIGCNumber(verticalExtentMin));
        // T01_object.vertical_extent_maximum MD_Metadata/identificationInfo/MD_DataIdentification/extent/EX_Extent/verticalElement/EX_VerticalExtent.maximumValue
        exVerticalExtent.addElement("gmd:maximumValue/gco:Real").addText(TRANSF.getISORealFromIGCNumber(verticalExtentMax));

        // T01_object.vertical_extent_unit = Wert [Domain-ID Codelist 102] MD_Metadata/identificationInfo/MD_DataIdentification/extent/EX_Extent/verticalElement/EX_VerticalExtent/verticalCRS/gml:VerticalCRS/gml:verticalCS/gml:VerticalCS/gml:axis/gml:CoordinateSystemAxis@gml:uom
        var verticalExtentUnit = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(102, objRow.get("vertical_extent_unit"));
        var verticalCRS = exVerticalExtent.addElement("gmd:verticalCRS/gml:VerticalCRS")
            .addAttribute("gml:id", "verticalCRSN_ID_".concat(TRANSF.getRandomUUID()));
        verticalCRS.addElement("gml:identifier").addAttribute("codeSpace", "");
        verticalCRS.addElement("gml:scope");
        var verticalCS = verticalCRS.addElement("gml:verticalCS/gml:VerticalCS")
            .addAttribute("gml:id", "verticalCS_ID_".concat(TRANSF.getRandomUUID()));
        verticalCS.addElement("gml:identifier").addAttribute("codeSpace", "");
        var coordinateSystemAxis = verticalCS.addElement("gml:axis/gml:CoordinateSystemAxis")
            .addAttribute("gml:uom", verticalExtentUnit)
            .addAttribute("gml:id", "coordinateSystemAxis_ID_".concat(TRANSF.getRandomUUID()));
        coordinateSystemAxis.addElement("gml:identifier").addAttribute("codeSpace", "");
        coordinateSystemAxis.addElement("gml:axisAbbrev");
        coordinateSystemAxis.addElement("gml:axisDirection").addAttribute("codeSpace", "");

        // T01_object.vertical_extent_vdatum = Wert [Domain-Id Codelist 101] MD_Metadata/identificationInfo/MD_DataIdentification/extent/EX_Extent/verticalElement/EX_VerticalExtent/verticalCRS/gml:VerticalCRS/gml:verticalDatum/gml:VerticalDatum/gml:name
        var verticalExtentVDatum = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(101, objRow.get("vertical_extent_vdatum_key"));
        if (!hasValue(verticalExtentVDatum)) {
            verticalExtentVDatum = objRow.get("vertical_extent_vdatum_value");
        }
        var verticalDatum = verticalCRS.addElement("gml:verticalDatum/gml:VerticalDatum")
            .addAttribute("gml:id", "verticalDatum_ID_".concat(TRANSF.getRandomUUID()));
        verticalDatum.addElement("gml:identifier").addAttribute("codeSpace", "");
        verticalDatum.addElement("gml:name").addText(verticalExtentVDatum);
        verticalDatum.addElement("gml:scope");
    }
}

function getGeographicIdentifier(spatialRefValueRow) {
    var retValue = spatialRefValueRow.get("name_value");
    var concatNativeKey = " (";
    if (!hasValue(retValue)) {
        retValue = "";
        concatNativeKey = "(";
    }
    if (hasValue(spatialRefValueRow.get("nativekey"))) {
        retValue = retValue.concat(concatNativeKey).concat(spatialRefValueRow.get("nativekey")).concat(")");
    }
    return retValue;
}

function getTimeRange(objRow) {
    var retValue = {}; 

    var timeMap = TRANSF.transformIGCTimeFields(objRow.get("time_from"), objRow.get("time_to"), objRow.get("time_type"));

    var myDateType = objRow.get("time_type");
    if (hasValue(myDateType)) {
        if (myDateType.equals("von")) {
            retValue.beginDate = timeMap.get("t1");
            retValue.endDate = timeMap.get("t2");
        } else if (myDateType.equals("seit")) {
            retValue.beginDate = timeMap.get("t1");
        } else if (myDateType.equals("bis")) {
            retValue.endDate = timeMap.get("t2");
        } else if (myDateType.equals("am")) {
            retValue.beginDate = timeMap.get("t0");
            retValue.endDate = timeMap.get("t0");
        }
    }

    return retValue;
}


function addDistributionInfo(mdMetadata, objId) {
	// GEO-INFORMATION/KARTE(1)
    var mdDistribution;
    if (objClass.equals("1")) {
    	rows = SQL.all("SELECT * FROM object_format_inspire WHERE obj_id=?", [objId]);
        for (i=0; i<rows.size(); i++) {
            if (!mdDistribution) {
                mdDistribution = mdMetadata.addElement("gmd:distributionInfo/gmd:MD_Distribution");
            }
            // ---------- <gmd:MD_Distributiongmd:distributionFormat/gmd:MD_Format> ----------
            var mdFormat = mdDistribution.addElement("gmd:distributionFormat/gmd:MD_Format");
                // ---------- <gmd:MD_Format/gmd:name> ----------
            mdFormat.addElement("gmd:name/gco:CharacterString").addText(rows.get(i).get("format_value"));
            mdFormat.addElement("gmd:version/gco:CharacterString").addText("unknown");
        }
    }
    
    
// ALLE KLASSEN

    // distributionInfo

    // ---------- <idf:idfMdMetadata/gmd:distributionInfo/gmd:MD_Distribution> ----------
    var mdDistribution;
    rows = SQL.all("SELECT * FROM t0110_avail_format WHERE obj_id=?", [objId]);
    for (i=0; i<rows.size(); i++) {
        if (!mdDistribution) {
            mdDistribution = mdMetadata.addElement("gmd:distributionInfo/gmd:MD_Distribution");
        }
        // ---------- <gmd:MD_Distributiongmd:distributionFormat/gmd:MD_Format> ----------
        var mdFormat = mdDistribution.addElement("gmd:distributionFormat/gmd:MD_Format");
            // ---------- <gmd:MD_Format/gmd:name> ----------
        mdFormat.addElement("gmd:name/gco:CharacterString").addText(rows.get(i).get("format_value"));
            // ---------- <gmd:MD_Format/gmd:version> ----------
        if (hasValue(rows.get(i).get("ver"))) {
            mdFormat.addElement("gmd:version/gco:CharacterString").addText(rows.get(i).get("ver"));
        } else {
            mdFormat.addElement("gmd:version").addAttribute("gco:nilReason", "missing");
                // add empty gco:CharacterString because of Validators !
                // NO EMPTY VALUE NOT ALLOWED BY SCHEMA !
//                .addElement("gco:CharacterString");
        }
            // ---------- <gmd:MD_Format/gmd:specification> ----------
        if (hasValue(rows.get(i).get("specification"))) {
            mdFormat.addElement("gmd:specification/gco:CharacterString").addText(rows.get(i).get("specification"));
        }
            // ---------- <gmd:MD_Format/gmd:fileDecompressionTechnique> ----------
        if (hasValue(rows.get(i).get("file_decompression_technique"))) {
            mdFormat.addElement("gmd:fileDecompressionTechnique/gco:CharacterString").addText(rows.get(i).get("file_decompression_technique"));
        }
    }

    // ---------- <gmd:MD_Distribution/gmd:distributor/gmd:MD_Distributor> ----------
    var distributorContact;
    if (hasValue(objRow.get("ordering_instructions"))) {
        if (!mdDistribution) {
            mdDistribution = mdMetadata.addElement("gmd:distributionInfo/gmd:MD_Distribution");
        }
        var mdDistributor = mdDistribution.addElement("gmd:distributor/gmd:MD_Distributor");
        // MD_Distributor needs a distributorContact, will be set below !
        distributorContact = mdDistributor.addElement("gmd:distributorContact");
        mdDistributor.addElement("gmd:distributionOrderProcess/gmd:MD_StandardOrderProcess/gmd:orderingInstructions/gco:CharacterString")
            .addText(objRow.get("ordering_instructions"));
    }

    // ---------- <gmd:MD_Distributor/gmd:distributorContact/gmd:CI_ResponsibleParty> ----------
    if (distributorContact) {
        // select only adresses associated with syslist 505 entry 5 ("Vertrieb") 
        var addressRow = SQL.first("SELECT t02_address.*, t012_obj_adr.type, t012_obj_adr.special_name FROM t012_obj_adr, t02_address WHERE t012_obj_adr.adr_uuid=t02_address.adr_uuid AND t02_address.work_state=? AND t012_obj_adr.obj_id=? AND t012_obj_adr.type=? AND t012_obj_adr.special_ref=? ORDER BY line", ['V', objId, 5, 505]);
	    if (hasValue(addressRow)) {
            distributorContact.addElement(getIdfResponsibleParty(addressRow, "distributor"));
	    } else {
            // add dummy distributor role, because no distributor was found
            distributorContact.addElement("gmd:CI_ResponsibleParty/gmd:role/gmd:CI_RoleCode")
                .addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#CI_RoleCode")
                .addAttribute("codeListValue", "distributor");
        }
    }

    // ---------- <gmd:MD_Distribution/gmd:transferOptions/gmd:MD_DigitalTransferOptions/gmd:onLine/gmd:CI_OnlineResource> ----------
    rows = SQL.all("SELECT * FROM T017_url_ref WHERE obj_id=?", [objId]);
    for (i=0; i<rows.size(); i++) {
        if (hasValue(rows.get(i).get("url_link"))) {
	        if (!mdDistribution) {
	            mdDistribution = mdMetadata.addElement("gmd:distributionInfo/gmd:MD_Distribution");
	        }
            var digitalTransferOptions = mdDistribution.addElement("gmd:transferOptions/gmd:MD_DigitalTransferOptions");
	        var transferSize = rows.get(i).get("volume");
            if (hasValue(transferSize)) {
            	transferSize = transferSize.toLowerCase();
            	var mult = 1;
            	if (transferSize.indexOf("kb") != -1) {
	        		mult = 1/1024;
	        	} else if (transferSize.indexOf("gb") != -1) {
	        		mult = 1024;
	        	}
            	transferSize = transferSize.replaceAll(",", ".");
            	transferSize = transferSize.replaceAll("[^0-9\.]", "");
            	if (transferSize >=0 || transferSize < 0) {
            		transferSize = transferSize * mult;
            	}
            	digitalTransferOptions.addElement("gmd:transferSize/gco:Real").addText(transferSize);
	        }
            var idfOnlineResource = digitalTransferOptions.addElement("gmd:onLine/idf:idfOnlineResource");
            idfOnlineResource.addElement("gmd:linkage/gmd:URL").addText(rows.get(i).get("url_link"));
            if (hasValue(rows.get(i).get("content"))) {
                idfOnlineResource.addElement("gmd:name/gco:CharacterString").addText(rows.get(i).get("content"));
            }
            if (hasValue(rows.get(i).get("descr"))) {
                idfOnlineResource.addElement("gmd:description/gco:CharacterString").addText(rows.get(i).get("descr"));
            }
            if (hasValue(rows.get(i).get("datatype_value"))) {
                var datatypeKey = rows.get(i).get("datatype_key");
                if (!hasValue(datatypeKey)) {
                    datatypeKey = "-1";
                }
                idfOnlineResource.addElement("idf:datatype").addText(rows.get(i).get("datatype_value"))
                    .addAttribute("list-id", "2240")
                    .addAttribute("entry-id", datatypeKey);
            }
        }
    }

    // ---------- <gmd:MD_Distribution/gmd:transferOptions/gmd:MD_DigitalTransferOptions> ----------
    rows = SQL.all("SELECT * FROM T0112_media_option WHERE obj_id=?", [objId]);
    for (i=0; i<rows.size(); i++) {
        if (!mdDistribution) {
            mdDistribution = mdMetadata.addElement("gmd:distributionInfo/gmd:MD_Distribution");
        }
        var mdDigitalTransferOptions = mdDistribution.addElement("gmd:transferOptions/gmd:MD_DigitalTransferOptions");
        // ---------- <gmd:MD_DigitalTransferOptions/gmd:transferSize> ----------
        if (hasValue(rows.get(i).get("transfer_size"))) {
            mdDigitalTransferOptions.addElement("gmd:transferSize/gco:Real")
                .addText(TRANSF.getISORealFromIGCNumber(rows.get(i).get("transfer_size")));
        }
        // ---------- <gmd:MD_DigitalTransferOptions/gmd:offLine/gmd:MD_Medium> ----------
        var mdMedium;
        // ---------- <gmd:MD_Medium/gmd:name/gmd:MD_MediumNameCode> ----------
        var mediumName = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(520, rows.get(i).get("medium_name"));
        if (hasValue(mediumName)) {
            mdMedium = mdDigitalTransferOptions.addElement("gmd:offLine/gmd:MD_Medium");
            mdMedium.addElement("gmd:name/gmd:MD_MediumNameCode")
                .addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#MD_MediumNameCode")
                .addAttribute("codeListValue", mediumName);
        }
        // ---------- <gmd:MD_Medium/gmd:mediumNote> ----------
        if (hasValue(rows.get(i).get("medium_note"))) {
            if (!mdMedium) {
                mdMedium = mdDigitalTransferOptions.addElement("gmd:offLine/gmd:MD_Medium");
            }
            mdMedium.addElement("gmd:mediumNote/gco:CharacterString").addText(rows.get(i).get("medium_note"));
        }
    }	
}

function addServiceOperations(identificationInfo, objServId) {
        var svContainsOperations;
// GEODATENDIENST(3)
    // ---------- <srv:containsOperations/srv:SV_OperationMetadata> ----------
        if (objClass.equals("3")) {
            svOpRows = SQL.all("SELECT * FROM t011_obj_serv_operation WHERE obj_serv_id=?", [objServId]);
            for (i=0; i<svOpRows.size(); i++) {
                var svOpRow = svOpRows.get(i);
                // add srv:containsOperations WITH EVERY OPERATION (strange schema !)
                svContainsOperations = identificationInfo.addElement("srv:containsOperations");
                var svOperationMetadata = svContainsOperations.addElement("srv:SV_OperationMetadata");

        // ---------- <srv:SV_OperationMetadata/srv:operationName> ----------
                svOperationMetadata.addElement("srv:operationName/gco:CharacterString").addText(svOpRow.get("name_value"));

        // ---------- <srv:SV_OperationMetadata/srv:DCP/srv:DCPList> ----------
                var platfRows = SQL.all("SELECT * FROM t011_obj_serv_op_platform WHERE obj_serv_op_id=?", [svOpRow.get("id")]);
                for (j=0; j<platfRows.size(); j++) {
                    svOperationMetadata.addElement("srv:DCP/srv:DCPList")
                        .addAttribute("codeList", "http://opengis.org/codelistRegistry?CSW_DCPCodeType")
                        .addAttribute("codeListValue", platfRows.get(j).get("platform"));
                }

        // ---------- <srv:SV_OperationMetadata/srv:operationDescription> ----------
                if (hasValue(svOpRow.get("descr"))) {
                    svOperationMetadata.addElement("srv:operationDescription/gco:CharacterString").addText(svOpRow.get("descr"));
                }

        // ---------- <srv:SV_OperationMetadata/srv:invocationName> ----------
                if (hasValue(svOpRow.get("invocation_name"))) {
                    svOperationMetadata.addElement("srv:invocationName/gco:CharacterString").addText(svOpRow.get("invocation_name"));
                }

        // ---------- <srv:SV_OperationMetadata/srv:parameters/srv:SV_Parameter> ----------
                var paramRows = SQL.all("SELECT * FROM t011_obj_serv_op_para WHERE obj_serv_op_id=?", [svOpRow.get("id")]);
                for (j=0; j<paramRows.size(); j++) {
                    var paramRow = paramRows.get(j);
                    var srvParameter = svOperationMetadata.addElement("srv:parameters/srv:SV_Parameter");
            // ---------- <srv:SV_Parameter/srv:name/gco:aName> ----------
                    var srvName = srvParameter.addElement("srv:name");
                    srvName.addElement("gco:aName/gco:CharacterString").addText(paramRow.get("name"));
                    srvName.addElement("gco:attributeType"); 
            // ---------- <srv:SV_Parameter/srv:direction/srv:SV_ParameterDirection> ----------
                    if (hasValue(paramRow.get("direction"))) {
                        var isoDirection = null;
                        if (paramRow.get("direction").equalsIgnoreCase("eingabe")) {
                            isoDirection = "in";
                        } else if (paramRow.get("direction").equalsIgnoreCase("ausgabe")) {
                            isoDirection = "out";
                        } else {
                            isoDirection = "in/out";
                        }
                        srvParameter.addElement("srv:direction/srv:SV_ParameterDirection").addText(isoDirection);
                    }
            // ---------- <srv:SV_Parameter/srv:description ----------
                    srvParameter.addElement("srv:description/gco:CharacterString").addText(paramRow.get("descr"));
            // ---------- <srv:SV_Parameter/srv:optionality ----------
                    srvParameter.addElement("srv:optionality/gco:CharacterString").addText(paramRow.get("optional"));
            // ---------- <srv:SV_Parameter/srv:repeatability ----------
                    srvParameter.addElement("srv:repeatability/gco:Boolean").addText(hasValue(paramRow.get("repeatability")) && paramRow.get("repeatability").equals("1"));
            // ---------- <srv:SV_Parameter/srv:valueType ----------
                    srvParameter.addElement("srv:valueType/gco:TypeName/gco:aName/gco:CharacterString").addText("");                    
                }

        // ---------- <srv:SV_OperationMetadata/srv:connectPoint> ----------
                var connRows = SQL.all("SELECT * FROM t011_obj_serv_op_connpoint WHERE obj_serv_op_id=?", [svOpRow.get("id")]);
                for (j=0; j<connRows.size(); j++) {
                    if (hasValue(connRows.get(j).get("connect_point"))) {
                        svOperationMetadata.addElement("srv:connectPoint/gmd:CI_OnlineResource/gmd:linkage/gmd:URL").addText(connRows.get(j).get("connect_point"));
                    }
                }
            }

// INFORMATIONSSYSTEM/DIENST/ANWENDUNG(6)
    // ---------- <srv:containsOperations/srv:SV_OperationMetadata> ----------
        } else if (objClass.equals("6")) {
            rows = SQL.all("SELECT * FROM t011_obj_serv_url WHERE obj_serv_id=?", [objServId]);
            for (i=0; i<rows.size(); i++) {
                row = rows.get(i);
                // add srv:containsOperations WITH EVERY OPERATION (strange schema !)
                svContainsOperations = identificationInfo.addElement("srv:containsOperations");
                var svOperationMetadata = svContainsOperations.addElement("srv:SV_OperationMetadata");

        // ---------- <srv:SV_OperationMetadata/srv:operationName> ----------
                svOperationMetadata.addElement("srv:operationName/gco:CharacterString").addText(row.get("name"));

        // ---------- <srv:SV_OperationMetadata/srv:DCP/srv:DCPList> ----------
                svOperationMetadata.addElement("srv:DCP/srv:DCPList")
                    .addAttribute("codeList", "http://opengis.org/codelistRegistry?CSW_DCPCodeType")
                    .addAttribute("codeListValue", "WebService");

        // ---------- <srv:SV_OperationMetadata/srv:operationDescription> ----------
                if (hasValue(row.get("description"))) {
                    svOperationMetadata.addElement("srv:operationDescription/gco:CharacterString").addText(row.get("description"));
                }
                
        // ---------- <srv:SV_OperationMetadata/srv:connectPoint> ----------
                svOperationMetadata.addElement("srv:connectPoint/gmd:CI_OnlineResource/gmd:linkage/gmd:URL").addText(row.get("url"));
            }
        }

    // operations needed, add dummy if no operations !
    if (!svContainsOperations) {
        identificationInfo.addElement("srv:containsOperations").addAttribute("gco:nilReason", "missing");
    }
}

// add second identification info for all information that cannot be mapped into a SV_ServiceIdentification element
function addServiceAdditionalIdentification(mdMetadata, objServRow, objServId) {
        var svScaleRows = SQL.all("SELECT * FROM t011_obj_serv_scale WHERE obj_serv_id=?", [objServId]);
        if (svScaleRows.size() > 0 || hasValue(objServRow.get("environment")) || hasValue(objServRow.get("description"))) {
    // ---------- <gmd:identificationInfo/gmd:MD_DataIdentification> ----------
            var mdDataIdentification = mdMetadata.addElement("gmd:identificationInfo/gmd:MD_DataIdentification");
            mdDataIdentification.addAttribute("uuid", getFileIdentifier(objRow));
    
            // add necessary elements for schema validation
            // ---------- <gmd:citation> ----------
            var ciCitation = mdDataIdentification.addElement("gmd:citation/gmd:CI_Citation");
            ciCitation.addElement("gmd:title")
                .addAttribute("gco:nilReason", "other:providedInPreviousIdentificationInfo");
                // add empty gco:CharacterString because of Validators !
                // NO EMPTY VALUE NOT ALLOWED BY SCHEMA !
//                .addElement("gco:CharacterString");
            var ciDate = ciCitation.addElement("gmd:date/gmd:CI_Date");
            ciDate.addElement("gmd:date")
                .addAttribute("gco:nilReason", "other:providedInPreviousIdentification");
                // add empty gco:Date because of Validators !
                // NO EMPTY VALUE NOT ALLOWED BY SCHEMA !
//                .addElement("gco:Date");
            ciDate.addElement("gmd:dateType").addAttribute("gco:nilReason", "other:providedInPreviousIdentificationInfo");

            // add necessary elements for schema validation
            // ---------- <gmd:abstract> ----------
            mdDataIdentification.addElement("gmd:abstract")
                .addAttribute("gco:nilReason", "other:providedInPreviousIdentificationInfo");
                // add empty gco:CharacterString because of Validators !
                // NO EMPTY VALUE NOT ALLOWED BY SCHEMA !
//                .addElement("gco:CharacterString");

            // ---------- <gmd:spatialResolution/gmd:MD_Resolution/gmd:equivalentScale> ----------
            for (i=0; i<svScaleRows.size(); i++) {
                if (hasValue(svScaleRows.get(i).get("scale"))) {
                    mdDataIdentification.addElement("gmd:spatialResolution/gmd:MD_Resolution/gmd:equivalentScale/gmd:MD_RepresentativeFraction/gmd:denominator/gco:Integer")
                    .addText(TRANSF.getISOIntegerFromIGCNumber(svScaleRows.get(i).get("scale")));
                }
            }
    
            // ---------- <gmd:spatialResolution/gmd:MD_Resolution/gmd:distance/gco:Distance> ----------
            for (i=0; i<svScaleRows.size(); i++) {
                if (hasValue(svScaleRows.get(i).get("resolution_ground"))) {
                    mdDataIdentification.addElement("gmd:spatialResolution/gmd:MD_Resolution/gmd:distance/gco:Distance")
                        .addAttribute("uom", "meter")
                        .addText(svScaleRows.get(i).get("resolution_ground"));
                }
            }
    
            // ---------- <gmd:spatialResolution/gmd:MD_Resolution/gmd:distance/gco:Distance> ----------
            for (i=0; i<svScaleRows.size(); i++) {
                if (hasValue(svScaleRows.get(i).get("resolution_scan"))) {
                    mdDataIdentification.addElement("gmd:spatialResolution/gmd:MD_Resolution/gmd:distance/gco:Distance")
                        .addAttribute("uom", "dpi")
                        .addText(svScaleRows.get(i).get("resolution_scan"));
                }
            }

            // add necessary elements for schema validation
            // ---------- <gmd:language> ----------
            mdDataIdentification.addElement("gmd:language")
                .addAttribute("gco:nilReason", "other:providedInPreviousIdentificationInfo");
                // add empty gco:CharacterString because of Validators !
                // NO EMPTY VALUE NOT ALLOWED BY SCHEMA !
//                .addElement("gco:CharacterString");
        
            // ---------- <gmd:environmentDescription> ----------
            if (hasValue(objServRow.get("environment"))) {
                mdDataIdentification.addElement("gmd:environmentDescription/gco:CharacterString").addText(objServRow.get("environment"));
            }
    
            // ---------- <gmd:supplementalInformation> ----------
            if (hasValue(objServRow.get("description"))) {
                mdDataIdentification.addElement("gmd:supplementalInformation/gco:CharacterString").addText(objServRow.get("description"));
            }
        }
}

function addObjectDataQualityTable(objRow, dqDataQuality) {
    var objId = objRow.get("id");
    var objClass = objRow.get("obj_class");

    var rows = SQL.all("SELECT * FROM object_data_quality WHERE obj_id=?", [objId]);
    for (i=0; i<rows.size(); i++) {
        var igcRow = rows.get(i);
        var igcDqElementId = igcRow.get("dq_element_id");
        var igcNameOfMeasureKey = igcRow.get("name_of_measure_key");
        var igcNameOfMeasureValue = igcRow.get("name_of_measure_value");
        var igcMeasureDescription = igcRow.get("measure_description");
        var igcResultValue = igcRow.get("result_value");
        
        if (igcDqElementId.equals("109")) {
            // ---------- <gmd:DQ_DataQuality/gmd:report/gmd:DQ_CompletenessCommission> ----------

            if (!dqDataQuality) {
                dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            }
            var dqElem = dqDataQuality.addElement("gmd:report/gmd:DQ_CompletenessCommission");
            dqElem.addElement("gmd:nameOfMeasure/gco:CharacterString").addText(igcNameOfMeasureValue);
            if (igcNameOfMeasureKey.equals("1")) {
                // Rate of excess items
                dqElem.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("3");
            } else if (igcNameOfMeasureKey.equals("2")) {
                // Number of duplicate feature instances
                dqElem.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("4");
            }
            if (hasValue(igcMeasureDescription)) {
                dqElem.addElement("gmd:measureDescription/gco:CharacterString").addText(igcMeasureDescription);
            }
            var dqQuantitativeResult = dqElem.addElement("gmd:result/gmd:DQ_QuantitativeResult");
            if (igcNameOfMeasureKey.equals("1")) {
	            var unitDefinition = dqQuantitativeResult.addElement("gmd:valueUnit/gml:UnitDefinition")
	                .addAttribute("gml:id", "unitDefinition_ID_".concat(TRANSF.getRandomUUID()));
	            unitDefinition.addElement("gml:identifier").addAttribute("codeSpace", "");
	            unitDefinition.addElement("gml:name").addText("percent");
	            unitDefinition.addElement("gml:quantityType").addText("completeness commission");
	            unitDefinition.addElement("gml:catalogSymbol").addText("%");
            } else if (igcNameOfMeasureKey.equals("2")) {
                dqQuantitativeResult.addElement("gmd:valueUnit").addAttribute("gco:nilReason", "inapplicable");
            } else {
                dqQuantitativeResult.addElement("gmd:valueUnit").addAttribute("gco:nilReason", "unknown");
            }
            dqQuantitativeResult.addElement("gmd:value/gco:Record").addText(igcResultValue);

        } else if (igcDqElementId.equals("110")) {
            // ---------- <gmd:DQ_DataQuality/gmd:report/gmd:DQ_CompletenessOmission> ----------

            if (!dqDataQuality) {
                dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            }
            var dqElem = dqDataQuality.addElement("gmd:report/gmd:DQ_CompletenessOmission");
            dqElem.addElement("gmd:nameOfMeasure/gco:CharacterString").addText(igcNameOfMeasureValue);
            if (igcNameOfMeasureKey.equals("1")) {
                // Rate of missing items
                dqElem.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("7");
            }
            if (hasValue(igcMeasureDescription)) {
                dqElem.addElement("gmd:measureDescription/gco:CharacterString").addText(igcMeasureDescription);
            }
            var dqQuantitativeResult = dqElem.addElement("gmd:result/gmd:DQ_QuantitativeResult");
            if (igcNameOfMeasureKey.equals("1")) {
                var unitDefinition = dqQuantitativeResult.addElement("gmd:valueUnit/gml:UnitDefinition")
                    .addAttribute("gml:id", "unitDefinition_ID_".concat(TRANSF.getRandomUUID()));
                unitDefinition.addElement("gml:identifier").addAttribute("codeSpace", "");
                unitDefinition.addElement("gml:name").addText("percent");
                unitDefinition.addElement("gml:quantityType").addText("completeness omission");
                unitDefinition.addElement("gml:catalogSymbol").addText("%");
            } else {
                dqQuantitativeResult.addElement("gmd:valueUnit").addAttribute("gco:nilReason", "unknown");
            }
            dqQuantitativeResult.addElement("gmd:value/gco:Record").addText(igcResultValue);

        } else if (igcDqElementId.equals("112")) {
            // ---------- <gmd:DQ_DataQuality/gmd:report/gmd:DQ_ConceptualConsistency> ----------

            if (!dqDataQuality) {
                dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            }
            var dqElem = dqDataQuality.addElement("gmd:report/gmd:DQ_ConceptualConsistency");
            dqElem.addElement("gmd:nameOfMeasure/gco:CharacterString").addText(igcNameOfMeasureValue);
            if (igcNameOfMeasureKey.equals("1")) {
                // Number of invalid overlaps of surfaces
                dqElem.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("11");
            } else if (igcNameOfMeasureKey.equals("2")) {
                // Conceptual Schema compliance = (Compliance rate with the rules of the conceptual schema)
                dqElem.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("13");
            }
            if (hasValue(igcMeasureDescription)) {
                dqElem.addElement("gmd:measureDescription/gco:CharacterString").addText(igcMeasureDescription);
            }
            var dqQuantitativeResult = dqElem.addElement("gmd:result/gmd:DQ_QuantitativeResult");
            if (igcNameOfMeasureKey.equals("1")) {
                dqQuantitativeResult.addElement("gmd:valueUnit").addAttribute("gco:nilReason", "inapplicable");
            } else if (igcNameOfMeasureKey.equals("2")) {
                var unitDefinition = dqQuantitativeResult.addElement("gmd:valueUnit/gml:UnitDefinition")
                    .addAttribute("gml:id", "unitDefinition_ID_".concat(TRANSF.getRandomUUID()));
                unitDefinition.addElement("gml:identifier").addAttribute("codeSpace", "");
                unitDefinition.addElement("gml:name").addText("percent");
                unitDefinition.addElement("gml:quantityType").addText("conceptual consistency");
                unitDefinition.addElement("gml:catalogSymbol").addText("%");
            } else {
                dqQuantitativeResult.addElement("gmd:valueUnit").addAttribute("gco:nilReason", "unknown");
            }
            dqQuantitativeResult.addElement("gmd:value/gco:Record").addText(igcResultValue);

        } else if (igcDqElementId.equals("113")) {
            // ---------- <gmd:DQ_DataQuality/gmd:report/gmd:DQ_DomainConsistency> ----------

            if (!dqDataQuality) {
                dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            }
            var dqElem = dqDataQuality.addElement("gmd:report/gmd:DQ_DomainConsistency");
            dqElem.addElement("gmd:nameOfMeasure/gco:CharacterString").addText(igcNameOfMeasureValue);
            if (igcNameOfMeasureKey.equals("1")) {
                // Value domain conformance rate
                dqElem.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("17");
            }
            if (hasValue(igcMeasureDescription)) {
                dqElem.addElement("gmd:measureDescription/gco:CharacterString").addText(igcMeasureDescription);
            }
            var dqQuantitativeResult = dqElem.addElement("gmd:result/gmd:DQ_QuantitativeResult");
            if (igcNameOfMeasureKey.equals("1")) {
                var unitDefinition = dqQuantitativeResult.addElement("gmd:valueUnit/gml:UnitDefinition")
                    .addAttribute("gml:id", "unitDefinition_ID_".concat(TRANSF.getRandomUUID()));
                unitDefinition.addElement("gml:identifier").addAttribute("codeSpace", "");
                unitDefinition.addElement("gml:name").addText("percent");
                unitDefinition.addElement("gml:quantityType").addText("domain consistency");
                unitDefinition.addElement("gml:catalogSymbol").addText("%");
            } else {
                dqQuantitativeResult.addElement("gmd:valueUnit").addAttribute("gco:nilReason", "unknown");
            }
            dqQuantitativeResult.addElement("gmd:value/gco:Record").addText(igcResultValue);

        } else if (igcDqElementId.equals("114")) {
            // ---------- <gmd:DQ_DataQuality/gmd:report/gmd:DQ_FormatConsistency> ----------

            if (!dqDataQuality) {
                dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            }
            var dqElem = dqDataQuality.addElement("gmd:report/gmd:DQ_FormatConsistency");
            dqElem.addElement("gmd:nameOfMeasure/gco:CharacterString").addText(igcNameOfMeasureValue);
            if (igcNameOfMeasureKey.equals("1")) {
                // Physical structure conflict rate
                dqElem.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("20");
            }
            if (hasValue(igcMeasureDescription)) {
                dqElem.addElement("gmd:measureDescription/gco:CharacterString").addText(igcMeasureDescription);
            }
            var dqQuantitativeResult = dqElem.addElement("gmd:result/gmd:DQ_QuantitativeResult");
            if (igcNameOfMeasureKey.equals("1")) {
                var unitDefinition = dqQuantitativeResult.addElement("gmd:valueUnit/gml:UnitDefinition")
                    .addAttribute("gml:id", "unitDefinition_ID_".concat(TRANSF.getRandomUUID()));
                unitDefinition.addElement("gml:identifier").addAttribute("codeSpace", "");
                unitDefinition.addElement("gml:name").addText("percent");
                unitDefinition.addElement("gml:quantityType").addText("format consistency");
                unitDefinition.addElement("gml:catalogSymbol").addText("%");
            } else {
                dqQuantitativeResult.addElement("gmd:valueUnit").addAttribute("gco:nilReason", "unknown");
            }
            dqQuantitativeResult.addElement("gmd:value/gco:Record").addText(igcResultValue);

        } else if (igcDqElementId.equals("115")) {
            // ---------- <gmd:DQ_DataQuality/gmd:report/gmd:DQ_TopologicalConsistency> ----------

            if (!dqDataQuality) {
                dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            }
            var dqElem = dqDataQuality.addElement("gmd:report/gmd:DQ_TopologicalConsistency");
            dqElem.addElement("gmd:nameOfMeasure/gco:CharacterString").addText(igcNameOfMeasureValue);
            if (igcNameOfMeasureKey.equals("1")) {
                // Number of invalid overlaps of surfaces
                dqElem.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("11");
            } else if (igcNameOfMeasureKey.equals("2")) {
                // Number of missing connections due to undershoots
                dqElem.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("23");
            } else if (igcNameOfMeasureKey.equals("3")) {
                // Number of missing connections due to overshoots
                dqElem.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("24");
            } else if (igcNameOfMeasureKey.equals("4")) {
                // Number of invalid slivers
                dqElem.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("25");
            } else if (igcNameOfMeasureKey.equals("5")) {
                // Number of invalid self-intersect errors
                dqElem.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("26");
            } else if (igcNameOfMeasureKey.equals("6")) {
                // Number of invalid self-overlap errors
                dqElem.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("27");
            } else if (igcNameOfMeasureKey.equals("7")) {
                // Number of faulty point-curve connections
                dqElem.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("21");
            } else if (igcNameOfMeasureKey.equals("8")) {
                // Number of missing connections due to crossing of bridge/road
                dqElem.addElement("gmd:measureIdentification").addAttribute("gco:nilReason", "missing");
            } else if (igcNameOfMeasureKey.equals("9")) {
                // Number of watercourse links below threshold length
                dqElem.addElement("gmd:measureIdentification").addAttribute("gco:nilReason", "missing");
            } else if (igcNameOfMeasureKey.equals("10")) {
                // Number of closed watercourse links
                dqElem.addElement("gmd:measureIdentification").addAttribute("gco:nilReason", "missing");
            } else if (igcNameOfMeasureKey.equals("11")) {
                // Number of multi-part watercourse links
                dqElem.addElement("gmd:measureIdentification").addAttribute("gco:nilReason", "missing");
            }
            if (hasValue(igcMeasureDescription)) {
                dqElem.addElement("gmd:measureDescription/gco:CharacterString").addText(igcMeasureDescription);
            }
            var dqQuantitativeResult = dqElem.addElement("gmd:result/gmd:DQ_QuantitativeResult");
            if (igcNameOfMeasureKey.equals("-1")) {
                dqQuantitativeResult.addElement("gmd:valueUnit").addAttribute("gco:nilReason", "unknown");
            } else {
                dqQuantitativeResult.addElement("gmd:valueUnit").addAttribute("gco:nilReason", "inapplicable");
            }
            dqQuantitativeResult.addElement("gmd:value/gco:Record").addText(igcResultValue);

        } else if (igcDqElementId.equals("117")) {
            // ---------- <gmd:DQ_DataQuality/gmd:report/gmd:DQ_AbsoluteExternalPositionalAccuracy> ----------

            if (!dqDataQuality) {
                dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            }
            var dqElem = dqDataQuality.addElement("gmd:report/gmd:DQ_AbsoluteExternalPositionalAccuracy");
            dqElem.addElement("gmd:nameOfMeasure/gco:CharacterString").addText(igcNameOfMeasureValue);
            if (igcNameOfMeasureKey.equals("1") || igcNameOfMeasureKey.equals("2") || igcNameOfMeasureKey.equals("3")) {
                // mean value of positional uncertainties (1D, 2D and 3D)
                dqElem.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("28");
            }
            if (hasValue(igcMeasureDescription)) {
                dqElem.addElement("gmd:measureDescription/gco:CharacterString").addText(igcMeasureDescription);
            }
            var dqQuantitativeResult = dqElem.addElement("gmd:result/gmd:DQ_QuantitativeResult");
            if (igcNameOfMeasureKey.equals("1") || igcNameOfMeasureKey.equals("2") || igcNameOfMeasureKey.equals("3")) {
                var unitDefinition = dqQuantitativeResult.addElement("gmd:valueUnit/gml:UnitDefinition")
                    .addAttribute("gml:id", "unitDefinition_ID_".concat(TRANSF.getRandomUUID()));
                unitDefinition.addElement("gml:identifier").addAttribute("codeSpace", "");
                unitDefinition.addElement("gml:name").addText("meter");
                unitDefinition.addElement("gml:quantityType").addText("absolute external positional accuracy");
                unitDefinition.addElement("gml:catalogSymbol").addText("m");
            } else {
                dqQuantitativeResult.addElement("gmd:valueUnit").addAttribute("gco:nilReason", "unknown");
            }
            dqQuantitativeResult.addElement("gmd:value/gco:Record").addText(igcResultValue);

        } else if (igcDqElementId.equals("120")) {
            // ---------- <gmd:DQ_DataQuality/gmd:report/gmd:DQ_TemporalConsistency> ----------

            if (!dqDataQuality) {
                dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            }
            var dqElem = dqDataQuality.addElement("gmd:report/gmd:DQ_TemporalConsistency");
            dqElem.addElement("gmd:nameOfMeasure/gco:CharacterString").addText(igcNameOfMeasureValue);
            if (igcNameOfMeasureKey.equals("1")) {
                // Percentage of items that are correctly events ordered
                // -> INSPIRE: Measure identifier: There is no measure for temporal accuracy in ISO 19138
                dqElem.addElement("gmd:measureIdentification").addAttribute("gco:nilReason", "missing");
            }
            if (hasValue(igcMeasureDescription)) {
                dqElem.addElement("gmd:measureDescription/gco:CharacterString").addText(igcMeasureDescription);
            }
            var dqQuantitativeResult = dqElem.addElement("gmd:result/gmd:DQ_QuantitativeResult");
            if (igcNameOfMeasureKey.equals("1")) {
                var unitDefinition = dqQuantitativeResult.addElement("gmd:valueUnit/gml:UnitDefinition")
                    .addAttribute("gml:id", "unitDefinition_ID_".concat(TRANSF.getRandomUUID()));
                unitDefinition.addElement("gml:identifier").addAttribute("codeSpace", "");
                unitDefinition.addElement("gml:name").addText("percent");
                unitDefinition.addElement("gml:quantityType").addText("temporal consistency");
                unitDefinition.addElement("gml:catalogSymbol").addText("%");
            } else {
                dqQuantitativeResult.addElement("gmd:valueUnit").addAttribute("gco:nilReason", "unknown");
            }
            dqQuantitativeResult.addElement("gmd:value/gco:Record").addText(igcResultValue);

        } else if (igcDqElementId.equals("125")) {
            // ---------- <gmd:DQ_DataQuality/gmd:report/gmd:DQ_ThematicClassificationCorrectness> ----------

            if (!dqDataQuality) {
                dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            }
            var dqElem = dqDataQuality.addElement("gmd:report/gmd:DQ_ThematicClassificationCorrectness");
            dqElem.addElement("gmd:nameOfMeasure/gco:CharacterString").addText(igcNameOfMeasureValue);
            if (igcNameOfMeasureKey.equals("1")) {
                // Misclassification rate
                dqElem.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("61");
            }
            if (hasValue(igcMeasureDescription)) {
                dqElem.addElement("gmd:measureDescription/gco:CharacterString").addText(igcMeasureDescription);
            }
            var dqQuantitativeResult = dqElem.addElement("gmd:result/gmd:DQ_QuantitativeResult");
            if (igcNameOfMeasureKey.equals("1")) {
                var unitDefinition = dqQuantitativeResult.addElement("gmd:valueUnit/gml:UnitDefinition")
                    .addAttribute("gml:id", "unitDefinition_ID_".concat(TRANSF.getRandomUUID()));
                unitDefinition.addElement("gml:identifier").addAttribute("codeSpace", "");
                unitDefinition.addElement("gml:name").addText("percent");
                unitDefinition.addElement("gml:quantityType").addText("thematic classification correctness");
                unitDefinition.addElement("gml:catalogSymbol").addText("%");
            } else {
                dqQuantitativeResult.addElement("gmd:valueUnit").addAttribute("gco:nilReason", "unknown");
            }
            dqQuantitativeResult.addElement("gmd:value/gco:Record").addText(igcResultValue);

        } else if (igcDqElementId.equals("126")) {
            // ---------- <gmd:DQ_DataQuality/gmd:report/gmd:DQ_NonQuantitativeAttributeAccuracy> ----------

            if (!dqDataQuality) {
                dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            }
            var dqElem = dqDataQuality.addElement("gmd:report/gmd:DQ_NonQuantitativeAttributeAccuracy");
            dqElem.addElement("gmd:nameOfMeasure/gco:CharacterString").addText(igcNameOfMeasureValue);
            if (igcNameOfMeasureKey.equals("1")) {
                // Rate of incorrect attributes names values
                dqElem.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("67");
            }
            if (hasValue(igcMeasureDescription)) {
                dqElem.addElement("gmd:measureDescription/gco:CharacterString").addText(igcMeasureDescription);
            }
            var dqQuantitativeResult = dqElem.addElement("gmd:result/gmd:DQ_QuantitativeResult");
            if (igcNameOfMeasureKey.equals("1")) {
                var unitDefinition = dqQuantitativeResult.addElement("gmd:valueUnit/gml:UnitDefinition")
                    .addAttribute("gml:id", "unitDefinition_ID_".concat(TRANSF.getRandomUUID()));
                unitDefinition.addElement("gml:identifier").addAttribute("codeSpace", "");
                unitDefinition.addElement("gml:name").addText("percent");
                unitDefinition.addElement("gml:quantityType").addText("non quantitative attribute accuracy");
                unitDefinition.addElement("gml:catalogSymbol").addText("%");
            } else {
                dqQuantitativeResult.addElement("gmd:valueUnit").addAttribute("gco:nilReason", "unknown");
            }
            dqQuantitativeResult.addElement("gmd:value/gco:Record").addText(igcResultValue);

        } else if (igcDqElementId.equals("127")) {
            // ---------- <gmd:DQ_DataQuality/gmd:report/gmd:DQ_QuantitativeAttributeAccuracy> ----------

            if (!dqDataQuality) {
                dqDataQuality = mdMetadata.addElement("gmd:dataQualityInfo").addElement(getDqDataQualityElement(objClass));
            }
            var dqElem = dqDataQuality.addElement("gmd:report/gmd:DQ_QuantitativeAttributeAccuracy");
            dqElem.addElement("gmd:nameOfMeasure/gco:CharacterString").addText(igcNameOfMeasureValue);
            if (igcNameOfMeasureKey.equals("1")) {
                // Attribute value uncertainty at 95 % significance level
                dqElem.addElement("gmd:measureIdentification/gmd:MD_Identifier/gmd:code/gco:CharacterString").addText("71");
            }
            if (hasValue(igcMeasureDescription)) {
                dqElem.addElement("gmd:measureDescription/gco:CharacterString").addText(igcMeasureDescription);
            }
            var dqQuantitativeResult = dqElem.addElement("gmd:result/gmd:DQ_QuantitativeResult");
            if (igcNameOfMeasureKey.equals("1")) {
                dqQuantitativeResult.addElement("gmd:valueUnit").addAttribute("gco:nilReason", "inapplicable");
            } else {
                dqQuantitativeResult.addElement("gmd:valueUnit").addAttribute("gco:nilReason", "unknown");
            }
            dqQuantitativeResult.addElement("gmd:value/gco:Record").addText(igcResultValue);
        }
    }
}

function getIdfObjectReference(objRow, elementName) {
    var idfObjectReference = DOM.createElement(elementName);
    idfObjectReference.addAttribute("uuid", objRow.get("obj_uuid"));
    if (hasValue(objRow.get("org_obj_id"))) {
        idfObjectReference.addAttribute("orig-uuid", objRow.get("org_obj_id"));
    }
    idfObjectReference.addElement("idf:objectName").addText(objRow.get("obj_name"));
    idfObjectReference.addElement("idf:objectType").addText(objRow.get("obj_class"));

    return idfObjectReference;
}

function getIdfAddressReference(addrRow, elementName) {
    var idfAddressReference = DOM.createElement(elementName);
    idfAddressReference.addAttribute("uuid", addrRow.get("adr_uuid"));
    if (hasValue(addrRow.get("org_adr_id"))) {
        idfAddressReference.addAttribute("orig-uuid", addrRow.get("org_adr_id"));
    }
    var person = getIndividualNameFromAddressRow(addrRow);
    if (hasValue(person)) {
        idfAddressReference.addElement("idf:addressIndividualName").addText(person);
    }
    var institution = getOrganisationNameFromAddressRow(addrRow);
    if (hasValue(institution)) {
        idfAddressReference.addElement("idf:addressOrganisationName").addText(institution);
    }
    idfAddressReference.addElement("idf:addressType").addText(addrRow.get("adr_type"));

    return idfAddressReference;
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
