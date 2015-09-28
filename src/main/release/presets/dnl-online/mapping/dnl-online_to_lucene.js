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
if (javaVersion.indexOf( "1.8" ) === 0) {
    load("nashorn:mozilla_compat.js");
}

importPackage(Packages.org.apache.lucene.document);
importPackage(Packages.de.ingrid.iplug.dsc.om);
importPackage(Packages.de.ingrid.geo.utils.transformation);

if (log.isDebugEnabled()) {
	log.debug("Mapping source record to lucene document: " + sourceRecord.toString());
}

if (!(sourceRecord instanceof DatabaseSourceRecord)) {
    throw new IllegalArgumentException("Record is no DatabaseRecord!");
}

// ---------- dnl_dokumente ----------
var objId = sourceRecord.get("id");
var objRows = SQL.all("SELECT * FROM dnl_dokumente WHERE id=?", [objId]);
for (i=0; i<objRows.size(); i++) {
    var row = objRows.get(i);

    // database ID seems to start at 0 !
    var databaseID = row.get("id");
    IDX.add("id", databaseID);
    // ID in URL starts at 1, so we have to add 1 to database ID !
    var idInURL = parseInt(databaseID) + 1;
    IDX.add("url", "http://www.dnl-online.de/1905.html?portalu=1&id=" + idInURL);

    IDX.add("title", row.get("titel"));
    IDX.add("t011_obj_data.description", row.get("titelzus"));
    IDX.add("t011_obj_literatur.publishing", row.get("verlag"));
    IDX.add("t011_obj_literatur.isbn", row.get("isbn"));
    IDX.add("t011_obj_literatur.publish_year", row.get("erschjahr"));
    IDX.add("t011_obj_literatur.publish_in", row.get("zeitschrift"));
    IDX.add("signatur", row.get("signatur"));
    IDX.add("t011_obj_literatur.description", row.get("fussnote"));
    IDX.add("t011_obj_literatur.doc_info", row.get("bezug"));
    IDX.add("summary", row.get("abstract"));
    IDX.add("fs_keywords", row.get("schlagworte"));
    IDX.add("t011_obj_literatur.autor", row.get("autoren"));
    IDX.add("autoreninstitution", row.get("autoreninst"));
    IDX.add("t011_obj_literatur.publisher", row.get("hrsg"));
    IDX.add("herausgeberinstitution", row.get("hrsginst"));
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
