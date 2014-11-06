/*
 * Copyright (c) 2014 wemove GmbH
 * Licensed under the EUPL V.1.1
 *
 * This Software is provided to You under the terms of the European
 * Union Public License (the "EUPL") version 1.1 as published by the
 * European Union. Any use of this Software, other than as authorized
 * under this License is strictly prohibited (to the extent such use
 * is covered by a right of the copyright holder of this Software).
 *
 * This Software is provided under the License on an "AS IS" basis and
 * without warranties of any kind concerning the Software, including
 * without limitation merchantability, fitness for a particular purpose,
 * absence of defects or errors, accuracy, and non-infringement of
 * intellectual property rights other than copyright. This disclaimer
 * of warranty is an essential part of the License and a condition for
 * the grant of any rights to this Software.
 *
 * For more  details, see <http://joinup.ec.europa.eu/software/page/eupl>
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

// ---------- punktart ----------
var punktartId = sourceRecord.get(DatabaseSourceRecord.ID);
var punktartRows = SQL.all("SELECT * FROM punktart WHERE id=?", [punktartId]);
for (i=0; i<punktartRows.size(); i++) {
    var punktartRow = punktartRows.get(i);
    var title = "Stammdaten PUNKTART: ";
    var summary = "";

    IDX.add("punktart.id", punktartRow.get("id"));
    IDX.add("punktart.kurzbezeichnung", punktartRow.get("kurzbezeichnung"));
    IDX.add("punktart.name", punktartRow.get("name"));

    title = title + punktartRow.get("kurzbezeichnung") + ", " + punktartRow.get("name");
    summary = summary + punktartRow.get("kurzbezeichnung") + ", " + punktartRow.get("name");

    IDX.add("title", title);
    IDX.add("summary", summary);
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
