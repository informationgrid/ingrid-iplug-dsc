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
/**
 * 
 */
package de.ingrid.iplug.dsc.index.mapper;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.apache.log4j.Logger;

import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.utils.ElasticDocument;

/**
 * Maps a {@link DatabaseSourceRecord} to a lucene document. The source database
 * record is retrieved from the database via the connection and the record id
 * specified in the {@link DatabaseSourceRecord}.
 * 
 * A SQL string can be defined to be executed to retrieve the database record.
 * 
 * 
 * @author joachim@wemove.com
 * 
 */
public class SimpleDatabaseRecord2DocumentMapper implements IRecordMapper {

    protected static final Logger log = Logger.getLogger( SimpleDatabaseRecord2DocumentMapper.class );

    private String sql;

    @Override
    public void map(SourceRecord record, ElasticDocument doc) throws Exception {
        if (!(record instanceof DatabaseSourceRecord)) {
            throw new IllegalArgumentException( "Record is no DatabaseRecord!" );
        }

        String id = (String) record.get( DatabaseSourceRecord.ID );
        Connection connection = (Connection) record.get( DatabaseSourceRecord.CONNECTION );
        try {
            PreparedStatement ps = connection.prepareStatement( sql );
            ps.setString( 1, id );
            ResultSet rs = ps.executeQuery();
            rs.next();

            for (int i = 1; i <= rs.getMetaData().getColumnCount(); i++) {
                String colName = rs.getMetaData().getColumnName( i );
                String colValue = rs.getString( i );
                doc.put( colName, colValue );
            }
        } catch (SQLException e) {
            log.error( "Error mapping Record.", e );
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
