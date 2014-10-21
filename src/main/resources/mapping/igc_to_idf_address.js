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
load("nashorn:mozilla_compat.js");
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

// ---------- <idf:html> ----------
var idfHtml = XPATH.getNode(idfDoc, "/idf:html")
DOM.addAttribute(idfHtml, "idf-version", "3.0.0");

// ---------- <idf:body> ----------
var idfBody = DOM.convertToIdfElement(XPATH.getNode(idfDoc, "/idf:html/idf:body"));

// ========== t02_address ==========
var addrId = sourceRecord.get("id");
// only addresses where hide_address is not set !
var addrRow = SQL.first("SELECT * FROM t02_address WHERE id=? and (hide_address IS NULL OR hide_address != 'Y')", [addrId]);
if (hasValue(addrRow)) {
    var idfResponsibleParty = getIdfResponsibleParty(addrRow);
	// add needed "ISO" namespaces to top ISO node 
	idfResponsibleParty.addAttribute("xmlns:gmd", DOM.getNS("gmd"));
	idfResponsibleParty.addAttribute("xmlns:gco", DOM.getNS("gco"));
	idfResponsibleParty.addAttribute("xmlns:srv", DOM.getNS("srv"));
	idfResponsibleParty.addAttribute("xmlns:gml", DOM.getNS("gml"));
	idfResponsibleParty.addAttribute("xmlns:gts", DOM.getNS("gts"));
	idfResponsibleParty.addAttribute("xmlns:xlink", DOM.getNS("xlink"));
	// and ISO schema reference
	idfResponsibleParty.addAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
	idfResponsibleParty.addAttribute("xsi:schemaLocation", DOM.getNS("gmd") + " http://schemas.opengis.net/csw/2.0.2/profiles/apiso/1.0.0/apiso.xsd");

    idfBody.addElement(idfResponsibleParty);
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
        idfResponsibleParty.addElement("gmd:role").addElement("gmd:CI_RoleCode")
            .addAttribute("codeList", "http://www.tc211.org/ISO19139/resources/codeList.xml#CI_RoleCode")
            .addAttribute("codeListValue", role);   
    } else {
        idfResponsibleParty.addElement("gmd:role").addAttribute("gco:nilReason", "inapplicable");
    }

    // -------------- IDF ----------------------

    idfResponsibleParty.addElement("idf:last-modified").addElement("gco:DateTime")
        .addText(TRANSF.getISODateFromIGCDate(addressRow.get("mod_time")));

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

    // children
    // only children published and NOT hidden !
    var rows = SQL.all("SELECT t02_address.* FROM t02_address, address_node WHERE address_node.fk_addr_uuid=? AND address_node.addr_id_published=t02_address.id AND (t02_address.hide_address IS NULL OR t02_address.hide_address != 'Y')", [addressRow.get("adr_uuid")]);
    for (var j=0; j<rows.size(); j++) {
        idfResponsibleParty.addElement(getIdfAddressReference(rows.get(j), "idf:subordinatedParty"));
    }

    // responsible user may be hidden ! then get first visible parent in hierarchy !
    var row = getFirstVisibleAddress(addressRow.get("responsible_uuid"));
    if (row) {
        idfResponsibleParty.addElement(getIdfAddressReference(row, "idf:responsibleParty"));
    }

	// do NOT USE DISTINCT -> crashes on ORACLE !
    var rows = SQL.all("SELECT t01_object.* FROM t01_object, t012_obj_adr WHERE t012_obj_adr.adr_uuid=? AND t012_obj_adr.obj_id=t01_object.id AND t01_object.work_state=? AND t01_object.publish_id=?", [addressRow.get("adr_uuid"), 'V', '1']);
    for (var j=0; j<rows.size(); j++) {
        idfResponsibleParty.addElement(getIdfObjectReference(rows.get(j), "idf:objectReference"));
    }

    return idfResponsibleParty;
}

// Get published address with given uuid.
// If address is hidden then first visible parent in hierarchy is returned.
function getFirstVisibleAddress(addrUuid) {
	var resultAddrRow;

    // ---------- address_node ----------
    var addrNodeRows = SQL.all("SELECT * FROM address_node WHERE addr_uuid=? AND addr_id_published IS NOT NULL", [addrUuid]);
    for (k=0; k<addrNodeRows.size(); k++) {
        var parentAddrUuid = addrNodeRows.get(k).get("fk_addr_uuid");
        var addrIdPublished = addrNodeRows.get(k).get("addr_id_published");

        // ---------- t02_address ----------
        resultAddrRow = SQL.first("SELECT * FROM t02_address WHERE id=? and (hide_address IS NULL OR hide_address != 'Y')", [addrIdPublished]);
        if (!hasValue(resultAddrRow)) {
if (log.isDebugEnabled()) {
    log.debug("Hidden address !!! uuid=" + addrUuid + " -> instead map parent address uuid=" + parentAddrUuid);
}
            // address hidden, get parent !
            if (hasValue(parentAddrUuid)) {
                resultAddrRow = getFirstVisibleAddress(parentAddrUuid);
            }
        }
    }
    
    return resultAddrRow;
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

    if (log.isDebugEnabled()) {
        log.debug("Got organisationName '" + organisationName + "' from address record:" + addressRow);
    }
    
    return organisationName;
}

/**
 * Returns an array of address rows representing the complete path from 
 * the given address (first entry in array) to the farthest parent 
 * (last entry in array).
 * 
 * @param addressRow The database address row to start from.
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
    if (log.isDebugEnabled()) {
        log.debug("getIdfAddressReference from address record:" + addrRow);
    }

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
