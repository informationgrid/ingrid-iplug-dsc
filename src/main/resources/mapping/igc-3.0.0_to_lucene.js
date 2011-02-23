/**
 * SourceRecord to Lucene Document mapping
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 *
 * The following global variable are passed from the application:
 *
 * @param sourceRecord A SourceRecord instance, that defines the input
 * @param luceneDoc A lucene Document instance, that defines the output
 * @param log A Log instance
 *
 */
importPackage(Packages.java.sql);
importPackage(Packages.org.apache.lucene.document);
importPackage(Packages.de.ingrid.iplug.dsc.om);

if (log.isDebugEnabled()) {
	log.debug("Mapping source record to lucene document: " + sourceRecord.toString());
}


if (!(sourceRecord instanceof DatabaseSourceRecord)) {
    throw new IllegalArgumentException("Record is no DatabaseRecord!");
}

var id = sourceRecord.get(DatabaseSourceRecord.ID);

var rows = SQL.all("SELECT * FROM t01_object WHERE id=?", [id]);
for (i=0; i<rows.size(); i++ ) {
    var row = rows.get(i);

    var colNames = row.keySet().toArray();
    for (var i in colNames) {
        var colName = colNames[i];
        var colValue = row.get(colName);
        if (!hasValue(colValue)) {
            colValue = "";
        }
        log.debug("Add field '" + colName + "' with value '" + colValue + "' to lucene document.");
        luceneDoc.add(new Field(colName, colValue, Field.Store.YES,
                Field.Index.ANALYZED));
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
