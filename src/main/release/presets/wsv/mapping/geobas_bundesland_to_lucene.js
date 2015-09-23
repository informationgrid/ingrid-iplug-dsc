importPackage(Packages.org.apache.lucene.document);
importPackage(Packages.de.ingrid.iplug.dsc.om);
importPackage(Packages.de.ingrid.geo.utils.transformation);

if (log.isDebugEnabled()) {
	log.debug("Mapping source record to lucene document: " + sourceRecord.toString());
}

if (!(sourceRecord instanceof DatabaseSourceRecord)) {
    throw new IllegalArgumentException("Record is no DatabaseRecord!");
}

// ---------- bundesland ----------
var objId = sourceRecord.get(DatabaseSourceRecord.ID);
var objRows = SQL.all("SELECT * FROM bundesland WHERE id=?", [objId]);
for (i=0; i<objRows.size(); i++) {
    var row = objRows.get(i);
    var title = "Stammdaten BUNDESLAND: ";
    var summary = "";
	var geobasUrl = "http://10.140.105.57:8080/geobas_q1/main?cmd=view_details&id=";

    IDX.add("bundesland.id", row.get("id"));
    IDX.add("bundesland.kurzbezeichnung", row.get("kurzbezeichnung"));
    IDX.add("bundesland.name", row.get("name"));
    IDX.add("bundesland.organisation", row.get("organisation"));

	title = title + row.get("name") + ", " + row.get("kurzbezeichnung");
	summary = summary + row.get("name") + ", " + row.get("kurzbezeichnung");
	geobasUrl = geobasUrl + row.get("id") + "&table=bundesland";

    // ---------- organisation ----------
    var rows = SQL.all("SELECT * FROM organisation WHERE id=?", [row.get("organisation")]);
    for (j=0; j<rows.size(); j++) {
    	var row = rows.get(j);
        IDX.add("organisation.id", row.get("id"));
        IDX.add("organisation.name", row.get("name"));
    	summary = summary + ", " + row.get("name");
   }

	IDX.add("title", title);
    IDX.add("summary", summary);
    
    // deliver url or NOT !?
    // changes display in result list !
    // with URL the url is displayed below summary and title links to URL
    // without url title links to detail view !
    //IDX.add("url", geobasUrl);
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
