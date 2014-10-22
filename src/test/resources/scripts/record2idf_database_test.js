/**
 * SourceRecord to Lucene Document mapping
 * Copyright (c) 2008 wemove digital solutions. All rights reserved.
 *
 * The following global variable are passed from the application:
 *
 * @param sourceRecord A SourceRecord instance, that defines the input
 * @param idfDoc A lucene Document instance, that defines the output
 * @param log A Log instance
 *
 */
if (javaVersion.indexOf( "1.8" ) === 0) {
	load("nashorn:mozilla_compat.js");
}

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

var id = sourceRecord.get(DatabaseSourceRecord.ID);
var connection = sourceRecord.get(DatabaseSourceRecord.CONNECTION);
try {
    var ps = connection.prepareStatement("SELECT * FROM TEST_TABLE WHERE id=?");
    ps.setString(1, id);
    var rs = ps.executeQuery();
    rs.next();

    for (var i = 1; i <= rs.getMetaData().getColumnCount(); i++) {
        var colName = rs.getMetaData().getColumnName(i);
        var colValue = rs.getString(i);
        XPathUtils.getXPathInstance().setNamespaceContext(new IDFNamespaceContext());
        var body = XPathUtils.getNode(idfDoc, "/idf:html/idf:body");
        var p = body.appendChild(idfDoc.createElementNS("http://www.portalu.de/IDF/1.0", "p"));
        var strong = p.appendChild(idfDoc.createElementNS("http://www.portalu.de/IDF/1.0", "strong"));
        strong.appendChild(idfDoc.createTextNode(colName+": "));
        p.appendChild(idfDoc.createTextNode(colValue));        
    }
} catch (e) {
    log.error("Error mapping Record." + e);
    throw e;
}
