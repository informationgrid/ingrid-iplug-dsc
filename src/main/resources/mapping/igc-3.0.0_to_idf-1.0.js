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
 */
importPackage(Packages.java.sql);
importPackage(Packages.org.w3c.dom);
importPackage(Packages.de.ingrid.utils.xml);
importPackage(Packages.de.ingrid.iplug.dsc.om);

if (log.isDebugEnabled()) {
	log.debug("Mapping source record to idf document: " + sourceRecord.toString());
}

if (!(sourceRecord instanceof DatabaseSourceRecord)) {
    throw new IllegalArgumentException("Record is no DatabaseRecord!");
}

// ---------- t01_object ----------
var objId = sourceRecord.get(DatabaseSourceRecord.ID);
var objRows = SQL.all("SELECT * FROM t01_object WHERE id=?", [objId]);
for (i=0; i<objRows.size(); i++) {

    // Example iterating all columns !
    var objRow = objRows.get(i);
    var colNames = objRow.keySet().toArray();
    for (var i in colNames) {
        var colName = colNames[i];
        var colValue = objRow.get(colName);
        if (colValue == null) {
            colValue = "";
        }
        XPathUtils.getXPathInstance().setNamespaceContext(new IdfNamespaceContext());
        var body = XPathUtils.getNode(idfDoc, "/idf:html/idf:body");
        var p = body.appendChild(idfDoc.createElementNS("http://www.portalu.de/IDF/1.0", "p"));
        var strong = p.appendChild(idfDoc.createElementNS("http://www.portalu.de/IDF/1.0", "strong"));
        strong.appendChild(idfDoc.createTextNode(colName+": "));
        p.appendChild(idfDoc.createTextNode(colValue));        
    }
}
