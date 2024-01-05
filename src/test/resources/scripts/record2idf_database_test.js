/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2024 wemove digital solutions GmbH
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

if (log.isDebugEnabled()) {
	log.debug("Mapping source record to idf document: " + sourceRecord.toString());
}


if (!(sourceRecord instanceof DatabaseSourceRecord)) {
    throw new IllegalArgumentException("Record is no DatabaseRecord!");
}

var id = sourceRecord.get("id");
var connection = sourceRecord.get(DatabaseSourceRecord.CONNECTION);
try {
    var ps = connection.prepareStatement("SELECT * FROM TEST_TABLE WHERE id=?");
    ps.setString(1, id);
    var rs = ps.executeQuery();
    rs.next();

    for (var i = 1; i <= rs.getMetaData().getColumnCount(); i++) {
        var colName = rs.getMetaData().getColumnName(i);
        var colValue = rs.getString(i);
        var body = XPATH.getNode(idfDoc, "/idf:html/idf:body");
        var p = body.appendChild(idfDoc.createElementNS("http://www.portalu.de/IDF/1.0", "p"));
        var strong = p.appendChild(idfDoc.createElementNS("http://www.portalu.de/IDF/1.0", "strong"));
        strong.appendChild(idfDoc.createTextNode(colName+": "));
        p.appendChild(idfDoc.createTextNode(colValue));        
    }
} catch (e) {
    log.error("Error mapping Record." + e);
    throw e;
}
