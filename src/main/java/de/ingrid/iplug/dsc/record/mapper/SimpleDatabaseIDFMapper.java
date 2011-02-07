/**
 * 
 */
package de.ingrid.iplug.dsc.record.mapper;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.apache.log4j.Logger;
import org.w3c.dom.Document;
import org.w3c.dom.Node;

import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.IdfNamespaceContext;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.utils.xml.XPathUtils;

/**
 * Maps a {@link DatabaseSourceRecord} into an InGrid Detail data Format (IDF).
 * <p />
 * A SQL string can be set to retrieve a record from the database, based in the
 * id and the connection supplied by the {@link DatabaseSourceRecord}.
 * <p/>
 * The mapper expects a base IDF format already present in {@link doc}.
 * 
 * 
 * 
 * @author joachim@wemove.com
 * 
 */
public class SimpleDatabaseIDFMapper implements IIdfMapper {

    protected static final Logger log = Logger
            .getLogger(SimpleDatabaseIDFMapper.class);

    private String sql;

    @Override
    public void map(SourceRecord record, Document doc) throws Exception {
        if (!(record instanceof DatabaseSourceRecord)) {
            throw new IllegalArgumentException("Record is no DatabaseRecord!");
        }
        String id = (String) record.get(DatabaseSourceRecord.ID);
        Connection connection = (Connection) record
                .get(DatabaseSourceRecord.CONNECTION);
        try {
            PreparedStatement ps = connection.prepareStatement(sql);
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            rs.next();

            for (int i = 1; i <= rs.getMetaData().getColumnCount(); i++) {
                String colName = rs.getMetaData().getColumnName(i);
                String colValue = rs.getString(i);
                XPathUtils.getXPathInstance().setNamespaceContext(new IdfNamespaceContext());
                Node body = XPathUtils.getNode(doc, "/html/body");
                Node p = body.appendChild(doc.createElementNS("http://www.portalu.de/IDF/1.0", "p"));
                p.appendChild(doc.createElementNS("http://www.portalu.de/IDF/1.0", "strong")
                            .appendChild(doc.createTextNode(colName+": ")));
                p.appendChild(doc.createTextNode(colValue));        
            }
        } catch (SQLException e) {
            log.error("Error mapping Record.", e);
            throw e;
        }

    }

    public String getSql() {
        return sql;
    }

    public void setSql(String sql) {
        this.sql = sql;
    }
    
}
