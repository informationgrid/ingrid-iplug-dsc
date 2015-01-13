/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2015 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.1 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * http://ec.europa.eu/idabc/eupl5
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * **************************************************#
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

// ---------- organisation ----------
var organisationId = sourceRecord.get(DatabaseSourceRecord.ID);
var organisationRows = SQL.all("SELECT * FROM organisation WHERE id=?", [organisationId]);
for (i=0; i<organisationRows.size(); i++) {
    var organisationRow = organisationRows.get(i);
    var row = organisationRow;
    var title = "Stammdaten ORGANISATION: ";
    var summary = "";
	var geobasUrl = "http://10.140.105.57:8080/geobas_q1/main?cmd=view_details&id=";

    IDX.add("organisation.id", row.get("id"));
    IDX.add("organisation.aktion", row.get("aktion"));
    IDX.add("organisation.historie", row.get("historie"));
    IDX.add("organisation.name", row.get("name"));
    IDX.add("organisation.dienststellenid", row.get("dienststellenid"));
    IDX.add("organisation.strasse", row.get("strasse"));
    IDX.add("organisation.plz", row.get("plz"));
    IDX.add("organisation.bundesland", row.get("bundesland"));
    IDX.add("organisation.ort", row.get("ort"));
    IDX.add("organisation.organisationparent", row.get("organisationparent"));
    IDX.add("organisation.original", row.get("original"));

	title = title + row.get("name") + ", " + row.get("dienststellenid");
	summary = summary + row.get("name") + ", " + row.get("dienststellenid") + ", " + row.get("strasse") + ", " + row.get("plz") + " " + row.get("ort");
	geobasUrl = geobasUrl + row.get("id") + "&table=organisation";

    // ---------- bundesland ----------
    var rows = SQL.all("SELECT * FROM bundesland WHERE id=?", [organisationRow.get("bundesland")]);
    for (j=0; j<rows.size(); j++) {
    	var row = rows.get(j);
        IDX.add("bundesland.id", row.get("id"));
        IDX.add("bundesland.name", row.get("name"));
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
