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
// ---------- Constants ----------
// Namespaces URI
var gmdURI = "http://www.isotc211.org/2005/gmd";
var gcoURI = "http://www.isotc211.org/2005/gco";
var srvURI = "http://www.isotc211.org/2005/srv";
var gmlURI = "http://www.opengis.net/gml";
var gtsURI = "http://www.isotc211.org/2005/gts";
var xlinkURI = "http://www.w3.org/1999/xlink";

// ---------- <idf:body> ----------
var idfBody = XPATH.getNode(idfDoc, "/idf:html/idf:body");

// ---------- <gmd:MD_Metadata> ----------
var gmdMetadata = idfBody.appendChild(DOM.createElement(gmdURI, "gmd:MD_Metadata"));
// add known namespaces
gmdMetadata.setAttribute("xmlns:gmd", gmdURI);
gmdMetadata.setAttribute("xmlns:gco", gcoURI);
gmdMetadata.setAttribute("xmlns:srv", srvURI);
gmdMetadata.setAttribute("xmlns:gml", gmlURI);
gmdMetadata.setAttribute("xmlns:gts", gtsURI);
gmdMetadata.setAttribute("xmlns:xlink", xlinkURI);
// and schema references
gmdMetadata.setAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
gmdMetadata.setAttribute("xsi:schemaLocation", gmdURI + " http://schemas.opengis.net/iso/19139/20060504/gmd/gmd.xsd");

// ========== t01_object ==========
var objId = sourceRecord.get(DatabaseSourceRecord.ID);
var objRows = SQL.all("SELECT * FROM t01_object WHERE id=?", [objId]);
for (i=0; i<objRows.size(); i++) {
    var objRow = objRows.get(i);
    var objUuid = objRow.get("obj_uuid");
    var objClass = objRow.get("obj_class");
    var objParentUuid = null; // will be set below
    
    // local variables
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
    value = objRow.get("org_obj_id");
    if (!hasValue(value)) {
        value = objUuid;
    }
    if (hasValue(value)) {
        gmdMetadata.appendChild(DOM.createElement(gmdURI, "gmd:fileIdentifier"))
            .appendChild(DOM.createElementWithText(gcoURI, "gco:CharacterString", value));
    }

// ---------- <gmd:language> ----------
    value = TRANSF.getLanguageISO639_2FromIGCCode(objRow.get("metadata_language_key"));
    if (hasValue(value)) {
        elem = DOM.createElementWithText(gmdURI, "gmd:LanguageCode", value);
        elem.setAttribute("codeList", "http://www.loc.gov/standards/iso639-2/");
        elem.setAttribute("codeListValue", value);
        gmdMetadata.appendChild(DOM.createElement(gmdURI, "gmd:language"))
            .appendChild(elem);
    }
// ---------- <gmd:characterSet> ----------
    value = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(510, objRow.get("metadata_character_set"));
    if (hasValue(value)) {
        elem = DOM.createElement(gmdURI, "gmd:MD_CharacterSetCode");
        elem.setAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#MD_CharacterSetCode");
        elem.setAttribute("codeListValue", value);
        gmdMetadata.appendChild(DOM.createElement(gmdURI, "gmd:characterSet"))
            .appendChild(elem);
    }
// ---------- <gmd:parentIdentifier> ----------
    // NOTICE: Has to be published ! Guaranteed by select of passed sourceRecord ! 
    rows = SQL.all("SELECT fk_obj_uuid FROM object_node WHERE obj_uuid=?", [objUuid]);
    // Should be only one row !
    objParentUuid = rows.get(0).get("fk_obj_uuid");
    if (hasValue(objParentUuid)) {
        gmdMetadata.appendChild(DOM.createElement(gmdURI, "gmd:parentIdentifier"))
            .appendChild(DOM.createElementWithText(gcoURI, "gco:CharacterString", objParentUuid));
    }
// ---------- <gmd:hierarchyLevel> ----------
// ---------- <gmd:hierarchyLevelName> ----------
    var hierarchyLevel = "dataset";
    var hierarchyLevelName = null;
    if (objClass == "0") {
        hierarchyLevel = "nonGeographicDataset";
        hierarchyLevelName = "job";
    } else if (objClass == "1") {
        rows = SQL.all("SELECT hierarchy_level FROM t011_obj_geo WHERE obj_id=?", [objId]);
        // Should be only one row !
        for (j=0; j<rows.size(); j++) {
            hierarchyLevel = TRANSF.getISOCodeListEntryFromIGCSyslistEntry(525, rows.get(j).get("hierarchy_level"));
        }
    } else if (objClass == "2") {
        hierarchyLevel = "nonGeographicDataset";
        hierarchyLevelName = "document";
    } else if (objClass == "3") {
        hierarchyLevel = "service";
        hierarchyLevelName = "service";
    } else if (objClass == "4") {
        hierarchyLevel = "nonGeographicDataset";
        hierarchyLevelName = "project";
    } else if (objClass == "5") {
        hierarchyLevel = "nonGeographicDataset";
        hierarchyLevelName = "database";
    } else if (objClass == "6") {
        hierarchyLevel = "application";
        hierarchyLevelName = "application";
    } else {
		if (log.isInfoEnabled()) {
	        log.info("Unsupported UDK class '" + objClass
	            + "'. Only class 0 to 6 are supported by the CSW interface.");
		}
    }
    if (hasValue(hierarchyLevel)) {
        elem = DOM.createElementWithText(gmdURI, "gmd:MD_ScopeCode", hierarchyLevel);
        elem.setAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#MD_ScopeCode");
        elem.setAttribute("codeListValue", hierarchyLevel);
        gmdMetadata.appendChild(DOM.createElement(gmdURI, "gmd:hierarchyLevel"))
            .appendChild(elem);
    }
    if (hasValue(hierarchyLevelName)) {
        gmdMetadata.appendChild(DOM.createElement(gmdURI, "gmd:hierarchyLevelName"))
            .appendChild(DOM.createElementWithText(gcoURI, "gco:CharacterString", hierarchyLevelName));
    }
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
