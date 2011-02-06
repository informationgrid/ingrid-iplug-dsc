/**
 * 
 */
package de.ingrid.iplug.dsc.index.mapper;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;

import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.SourceRecord;

/**
 * @author joachim
 * 
 */
public class SimpleDatabaseRecord2DocumentMapper implements
        IRecordMapper {

    /*
     * (non-Javadoc)
     * 
     * @see
     * de.ingrid.iplug.dsc.index.IRecord2DocumentMapper#map(de.ingrid.iplug.
     * dsc.index.IRecord)
     */
    @Override
    public Document map(SourceRecord record, Document doc) {
        if (!(record instanceof DatabaseSourceRecord)) {
            throw new IllegalArgumentException("Record is no DatabaseRecord!");
        }
        
        String id = (String)record.get(DatabaseSourceRecord.ID);
        Connection connection = (Connection)record.get(DatabaseSourceRecord.CONNECTION);
        try {
            PreparedStatement ps = connection.prepareStatement("SELECT * FROM t01_object WHERE id='"+id+"'");
            ResultSet rs = ps.getResultSet();
            rs.next();
            
            for (int i=0; i< rs.getMetaData().getColumnCount(); i++) {
                String colName = rs.getMetaData().getColumnName(i);
                String colValue = rs.getString(i);
                doc.add(new Field(colName, colValue, Field.Store.YES, Field.Index.ANALYZED));
            }
        } catch (SQLException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        return doc;
    }

}
