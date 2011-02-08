/**
 * 
 */
package de.ingrid.iplug.dsc.index.mapper;

import java.io.StringReader;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import javax.xml.parsers.DocumentBuilderFactory;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.utils.xml.XPathUtils;

/**
 * Specialized class to add IGC profile defined values to a lucene document. It
 * looks up the profile, retrieves the additional field definitions. It then
 * retrieves the actual data of the fields related to the current source record.
 * Finally it adds fields to the lucene document.
 * 
 * The name of the lucene index fields are retrieved from the profile. All
 * lucene fields are stored and indexed.
 * 
 * @author joachim@wemove.com
 * 
 */
public class DatabaseProfileMapper implements IRecordMapper {

    final private static Log log = LogFactory
            .getLog(DatabaseProfileMapper.class);

    /*
     * (non-Javadoc)
     * 
     * @see
     * de.ingrid.iplug.dsc.index.IRecord2DocumentMapper#map(de.ingrid.iplug.
     * dsc.index.IRecord)
     */
    @Override
    public void map(SourceRecord record, Document doc) {
        if (!(record instanceof DatabaseSourceRecord)) {
            throw new IllegalArgumentException("Record is no DatabaseRecord!");
        }

        Connection connection = (Connection) record
                .get(DatabaseSourceRecord.CONNECTION);
        try {
            String docId = (String) record.get(DatabaseSourceRecord.ID);
            ResultSet rs = connection
                    .prepareStatement(
                            "SELECT value_string FROM sys_generic_key WHERE key_name='PROFILE'")
                    .getResultSet();
            DocumentBuilderFactory factory = DocumentBuilderFactory
                    .newInstance();
            InputSource source = new InputSource(new StringReader(rs
                    .getString(0)));
            org.w3c.dom.Document document = factory.newDocumentBuilder().parse(
                    source);
            rs.close();
            NodeList nl = XPathUtils.getNodeList(document,
                    "/PATH_TO_ADDITIONAL_FIELDS");
            for (int i = 0; i < nl.getLength(); i++) {
                Node n = nl.item(i);
                String dbName = XPathUtils.getString(n,
                        "/XPATH_TO_DB_FIELD_NAME");
                String idxName = XPathUtils.getString(n,
                        "/XPATH_TO_INDEX_FIELD_NAME");
                PreparedStatement ps = connection
                        .prepareStatement("SELECT value FROM additional_fields WHERE key_name='"
                                + dbName + "' AND WHERE doc_id='" + docId + "'");
                rs = ps.getResultSet();
                String value = rs.getString(0);
                rs.close();
                ps.close();
                doc.add(new Field(idxName, value, Field.Store.YES,
                        Field.Index.ANALYZED));
            }
        } catch (Exception e) {
            log.error("Error mapping profile data.", e);
        }
    }

}
