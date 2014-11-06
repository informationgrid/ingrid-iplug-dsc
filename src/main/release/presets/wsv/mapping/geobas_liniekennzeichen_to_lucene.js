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

// ---------- liniekennzeichen ----------
var liniekennzeichenId = sourceRecord.get(DatabaseSourceRecord.ID);
var liniekennzeichenRows = SQL.all("SELECT * FROM liniekennzeichen WHERE id=?", [liniekennzeichenId]);
for (i=0; i<liniekennzeichenRows.size(); i++) {
    var liniekennzeichenRow = liniekennzeichenRows.get(i);
    var title = "Linie LINIEKENNZEICHEN: ";
    var summary = "";

    IDX.add("liniekennzeichen.id", liniekennzeichenRow.get("id"));
    IDX.add("liniekennzeichen.bundeswasserstr", liniekennzeichenRow.get("bundeswasserstr"));
    IDX.add("liniekennzeichen.linienart", liniekennzeichenRow.get("linienart"));
    IDX.add("liniekennzeichen.liniennummer", liniekennzeichenRow.get("liniennummer"));

    // ---------- bundeswasserstr ----------
    var rows = SQL.all("SELECT * FROM bundeswasserstr WHERE id=?", [liniekennzeichenRow.get("bundeswasserstr")]);
    for (j=0; j<rows.size(); j++) {
        var row = rows.get(j);
        IDX.add("bundeswasserstr.id", row.get("id"));
        IDX.add("bundeswasserstr.kurzbezeichnung", row.get("kurzbezeichnung"));
        IDX.add("bundeswasserstr.name", row.get("name"));

        title = title + row.get("kurzbezeichnung");
    	summary = summary + row.get("kurzbezeichnung") + " " + row.get("name");
   }

    // ---------- linienart ----------
    var rows = SQL.all("SELECT * FROM linienart WHERE id=?", [liniekennzeichenRow.get("linienart")]);
    for (j=0; j<rows.size(); j++) {
        var row = rows.get(j);
        IDX.add("linienart.id", row.get("id"));
        IDX.add("linienart.kurzbezeichnung", row.get("kurzbezeichnung"));
        IDX.add("linienart.name", row.get("name"));

        title = title + ", " + row.get("kurzbezeichnung");
        summary = summary + ", " + row.get("kurzbezeichnung") + " " + row.get("name");
    }

    title = title + ", " + liniekennzeichenRow.get("liniennummer");
    summary = summary + ", " + liniekennzeichenRow.get("liniennummer");

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
