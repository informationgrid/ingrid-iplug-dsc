/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2026 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.2 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * https://joinup.ec.europa.eu/software/page/eupl
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * **************************************************#
 */

let DatabaseSourceRecord = Java.type("de.ingrid.iplug.dsc.om.DatabaseSourceRecord");

log.debug("Mapping source record to lucene document: " + sourceRecord.toString());

if (!(sourceRecord instanceof DatabaseSourceRecord)) {
  throw new IllegalArgumentException("Record is no DatabaseRecord!");
}

// ---------- MAP RECORD INTO INDEX ----------

// extract id of the record and read record(s) from database
var objId = sourceRecord.get("id");

// select via id, convert id to number to be used in PreparedStatement as Integer to avoid postgres error !
var objRows = SQL.all("SELECT * FROM t01_object WHERE id=?", [+objId]);
for (i=0; i<objRows.size(); i++) {
    var row = objRows.get(i);
    var title = "";
    var summary = "";

    // Map id and data from record(s) into index
    IDX.add("id", row.get("id"));
    IDX.add("t01_object.obj_class", "1");
    IDX.add("kurzbeschreibung", row.get("kurzbeschreibung"));
    IDX.add("daten", row.get("daten"));
    IDX.add("organisation", row.get("behoerde"));
    // ...

    // these fields are shown in result list !
    title = title + row.get("daten");
    summary = summary + row.get("kurzbeschreibung");
    IDX.add("title", title);
    IDX.add("summary", summary);

    // add various HTML into special index field which is rendered in result list !
    var addHtml = "";
    var sourceTypes = ["WMS", "Dateidownload", "FTP", "AtomFeed", "Portal", "SOS", "WFS", "WMTS", "JSON", "WSDL"];
    for (var i = 0; i < sourceTypes.length; i++) {
        var key = sourceTypes[i].toLowerCase();
        if( hasValue(row.get(key))){
            addHtml += "<div><a href="+row.get(key)+">"+sourceTypes[i]+"</></div>";
        }
    }
    IDX.add("additional_html_1", addHtml);

    // deliver url or NOT !?
    // changes display in result list !
    // with URL the url is displayed below summary and title links to URL
    // without url title links to detail view !
    //IDX.add("url", "[YOUR URL]");
}
