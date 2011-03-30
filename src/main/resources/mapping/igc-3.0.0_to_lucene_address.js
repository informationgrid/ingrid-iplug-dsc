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

// ---------- t02_address ----------
var addrId = sourceRecord.get(DatabaseSourceRecord.ID);
var addrRows = SQL.all("SELECT * FROM t02_address WHERE id=?", [addrId]);
for (i=0; i<addrRows.size(); i++) {
    addT02Address(addrRows.get(i));
    var addrUuid = addrRows.get(i).get("adr_uuid");

    // ---------- t021_communication ----------
    var rows = SQL.all("SELECT * FROM t021_communication WHERE adr_id=?", [addrId]);
    for (j=0; j<rows.size(); j++) {
        addT021Communication(rows.get(j));
    }
    // ---------- address_node CHILDREN ----------
    // only published ones !
    var rows = SQL.all("SELECT * FROM address_node WHERE fk_addr_uuid=? AND addr_id_published IS NOT NULL", [addrUuid]);
    for (j=0; j<rows.size(); j++) {
        addAddressNodeChildren(rows.get(j));
    }
    // ---------- add all PARENTS ----------
    var row = SQL.first("SELECT fk_addr_uuid FROM address_node WHERE addr_uuid=?", [addrUuid]);
    var parentUuid = row.get("fk_addr_uuid");
    var level = 1;
    while (hasValue(parentUuid)) {
        // NOTICE: Parents HAVE TO BE published if child is published !
	    var parentRow = SQL.first("SELECT * FROM address_node, t02_address WHERE address_node.addr_uuid=? AND address_node.addr_id_published=t02_address.id", [parentUuid]);
	    addAddressParent(level, parentRow);
	    parentUuid = parentRow.get("fk_addr_uuid");
	    level++;
    }
    // ---------- searchterm_adr ----------
    var rows = SQL.all("SELECT * FROM searchterm_adr WHERE adr_id=?", [addrId]);
    for (j=0; j<rows.size(); j++) {
        addSearchtermAdr(rows.get(j));
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
}

function addT02Address(row) {
    IDX.add("t02_address.id", row.get("id"));
    IDX.add("t02_address.adr_id", row.get("adr_uuid"));
    IDX.add("t02_address.org_adr_id", row.get("org_adr_id"));
    IDX.add("t02_address.typ", row.get("adr_type"));
    IDX.add("title ", row.get("institution"));
    IDX.add("t02_address.lastname", row.get("lastname"));
    IDX.add("t02_address.firstname", row.get("firstname"));
    IDX.add("t02_address.address_key", row.get("address_key"));
    IDX.add("t02_address.address_value", row.get("address_value"));
    IDX.add("t02_address.title_key", row.get("title_key"));
    IDX.add("t02_address.title", row.get("title_value"));
    IDX.add("street", row.get("street"));
    IDX.add("zip", row.get("postcode"));
    IDX.add("t02_address.postbox", row.get("postbox"));
    IDX.add("t02_address.postbox_pc", row.get("postbox_pc"));
    IDX.add("city", row.get("city"));
    IDX.add("t02_address.country_key", row.get("country_key"));
    IDX.add("t02_address.country_code", row.get("country_value"));
    IDX.add("summary", row.get("job"));
    IDX.add("t02_address.descr", row.get("descr"));
    IDX.add("t02_address.work_state", row.get("work_state"));
    IDX.add("t02_address.create_time", row.get("create_time"));
    IDX.add("t02_address.mod_time", row.get("mod_time"));
    IDX.add("t02_address.mod_uuid", row.get("mod_uuid"));
    IDX.add("t02_address.responsible_uuid", row.get("responsible_uuid"));
}
function addT021Communication(row) {
    IDX.add("t021_communication.line", row.get("line"));
    IDX.add("t021_communication.commtype_key", row.get("commtype_key"));
    IDX.add("t021_communication.commtype_value", row.get("commtype_value"));
    IDX.add("t021_communication.comm_value", row.get("comm_value"));
    IDX.add("t021_communication.descr", row.get("descr"));
}
function addAddressNodeChildren(row) {
    IDX.add("children.address_node.addr_uuid", row.get("addr_uuid"));
}
function addAddressParent(level, row) {
    if (level == 1) {
        IDX.add("parent.address_node.addr_uuid", row.get("adr_uuid"));
    } else {
        IDX.add("parent".concat(level).concat(".address_node.addr_uuid"), row.get("adr_uuid"));
    }
    IDX.add("t02_address".concat(level + 1).concat(".adr_id"), row.get("adr_uuid"));
    IDX.add("t02_address".concat(level + 1).concat(".typ"), row.get("adr_type"));
    IDX.add("title".concat(level + 1), row.get("institution"));
}
function addSearchtermAdr(row) {
    IDX.add("searchterm_adr.line", row.get("line"));
}
function addSearchtermValue(row) {
    IDX.add("t04_search.type", row.get("type"));
    IDX.add("t04_search.searchterm", row.get("term"));
}
function addSearchtermSns(row) {
    IDX.add("searchterm_sns.sns_id", row.get("sns_id"));
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
