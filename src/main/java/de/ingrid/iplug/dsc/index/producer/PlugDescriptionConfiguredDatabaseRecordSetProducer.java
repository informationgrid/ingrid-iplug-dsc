/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2025 wemove digital solutions GmbH
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
package de.ingrid.iplug.dsc.index.producer;

import de.ingrid.iplug.dsc.index.DatabaseConnection;
import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.iplug.dsc.utils.DatabaseConnectionUtils;
import de.ingrid.utils.IConfigurable;
import de.ingrid.utils.PlugDescription;
import de.ingrid.utils.statusprovider.StatusProviderService;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Takes care of selecting all source record Ids from a database. The SQL 
 * statement is configurable via Spring.
 * 
 * The database connection is configured via the PlugDescription.
 * 
 * 
 * @author joachim@wemove.com
 * 
 */
// Bean created depending on SpringConfiguration
//@Service
public class PlugDescriptionConfiguredDatabaseRecordSetProducer implements
        IRecordSetProducer, IConfigurable {

    @Autowired
    private StatusProviderService statusProviderService;

    DatabaseConnection internalDatabaseConnection = null;

    String recordSql = "";

    String recordByIdSql = "";
    
    String recordSqlValidateFolderChildren = "";

    String recordSqlValidateParentPublishDoc = "";

    String recordParentFolderByIdSql = "";

    String recordParentFolderByUuidSql = "";

    String recordPublication = "";

    Iterator<String> recordIdIterator = null;

    private int numRecords;

    final private static Log log = LogFactory
            .getLog(PlugDescriptionConfiguredDatabaseRecordSetProducer.class);

    public PlugDescriptionConfiguredDatabaseRecordSetProducer() {
        log.info("PlugDescriptionConfiguredDatabaseRecordProducer started.");
    }

    /*
     * (non-Javadoc)
     * 
     * @see de.ingrid.iplug.dsc.index.IRecordProducer#hasNext()
     */
    @Override
    public boolean hasNext() {
        if (recordIdIterator == null) {
            createRecordIdsFromDatabase();
        }
        if (recordIdIterator.hasNext()) {
            return true;
        } else {
            reset();
            return false;
        }
    }
    
    /**
     * Closes the connection to the database and resets the iterator for the records. 
     * After a reset, the hasNext() function will start from the beginning again.
     */
    @Override
    public void reset() {
        recordIdIterator =  null;
        closeDatasource();
    }

    /*
     * (non-Javadoc)
     * 
     * @see de.ingrid.iplug.dsc.index.IRecordProducer#next()
     */
    @Override
    public SourceRecord next() {
        Connection connection = null;
        try {
            // connection will be closed in autoclosable DatabaseSourceRecord
            connection = DatabaseConnectionUtils.getInstance().openConnection(internalDatabaseConnection);
            return new DatabaseSourceRecord(recordIdIterator.next(), recordPublication, connection);
        } catch (SQLException e) {
            log.error("Error getting connection from datasource.", e);
        }
        // make sure connnection is closed after failure
        if (connection != null) {
            try {
                connection.close();
            } catch (SQLException e) {
                log.error("Error closing connection after failure.", e);
            }
        }
        return null;
    }

    @Override
    public void configure(PlugDescription plugDescription) {
        this.internalDatabaseConnection = (DatabaseConnection) plugDescription
                .getConnection();
    }

    public String getRecordSql() {
        return recordSql;
    }

    public void setRecordSql(String recordSql) {
        this.recordSql = recordSql;
    }

    public String getRecordByIdSql() {
        return recordByIdSql;
    }

    public void setRecordByIdSql(String recordByIdSql) {
        this.recordByIdSql = recordByIdSql;
    }

    public String getRecordSqlValidateFolderChildren() {
        return recordSqlValidateFolderChildren;
    }

    public void setRecordSqlValidateFolderChildren(String recordSqlValidateFolderChildren) {
        this.recordSqlValidateFolderChildren = recordSqlValidateFolderChildren;
    }

    public String getRecordSqlValidateParentPublishDoc() {
        return recordSqlValidateParentPublishDoc;
    }

    public void setRecordSqlValidateParentPublishDoc(String recordSqlValidateParentPublishDoc) {
        this.recordSqlValidateParentPublishDoc = recordSqlValidateParentPublishDoc;
    }

    public String getRecordParentFolderByIdSql() {
        return recordParentFolderByIdSql;
    }

    public void setRecordParentFolderByIdSql(String recordParentFolderByIdSql) {
        this.recordParentFolderByIdSql = recordParentFolderByIdSql;
    }

    public String getRecordParentFolderByUuidSql() {
        return recordParentFolderByUuidSql;
    }

    public void setRecordParentFolderByUuidSql(String recordParentFolderByUuidSql) {
        this.recordParentFolderByUuidSql = recordParentFolderByUuidSql;
    }

    public String getRecordPublication() {
        return recordPublication;
    }

    public void setRecordPublication(String recordPublication) {
        this.recordPublication = recordPublication;
    }

    private void closeDatasource() {
        try {
            DatabaseConnectionUtils.getInstance().closeDataSource();
        } catch (SQLException e) {
            log.error("Error closing datasource.", e);
        }
    }

    private void createRecordIdsFromDatabase() {
        try {
            List<String> recordIds = new ArrayList<String>();
            if (log.isDebugEnabled()) {
                log.debug("SQL: " + recordSql);
            }
            try (Connection conn = DatabaseConnectionUtils.getInstance().openConnection(internalDatabaseConnection)) {
                try (PreparedStatement ps = conn.prepareStatement(recordSql)) {
                    try (ResultSet rs = ps.executeQuery()) {
                        while (rs.next()) {
                            String id = rs.getString(1);
                            String uuid = rs.getString(2);
                            String udkClass = rs.getString(3);
                            boolean addValue = false;
                            if(uuid != null && udkClass != null) {
                                if(udkClass.equals("1000")) {
                                    // Check if folder has published children documents
                                    if(isFolderWithPublishDoc(uuid, conn)) {
                                        if (log.isDebugEnabled()) {
                                            log.debug("Index folder with UUID: " + uuid);
                                        }
                                        addValue = true;
                                    }
                                } else {
                                    addValue = true;
                                }
                                if(addValue) { 
                                    addValue = isParentPublishDoc(uuid, addValue, conn);
                                }
                            }
                            if(addValue) {
                                recordIds.add(id);
                            }
                        }
                        recordIdIterator = recordIds.listIterator();
                        numRecords = recordIds.size();
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error creating record ids.", e);
        }
    }

    @Override
    public boolean isParentPublishDoc(String uuid, boolean addValue, Connection conn) {
        boolean hasPublishDoc = false;
        try {
            if (log.isDebugEnabled()) {
                log.debug("SQL: " + recordSqlValidateParentPublishDoc);
            }
            if(!recordSqlValidateParentPublishDoc.isEmpty()) {
                try (PreparedStatement ps = conn.prepareStatement(recordSqlValidateParentPublishDoc)) {
                    ps.setString(1, uuid);
                    try (ResultSet rs = ps.executeQuery()) {
                        while (rs.next()) {
                            String fkUuidParent = rs.getString(1);
                            hasPublishDoc = true;
                            if(fkUuidParent != null) {
                                hasPublishDoc = this.isParentPublishDoc(fkUuidParent, addValue, conn);
                            }
                        }
                    }
                }
            } else {
                return addValue;
            }
        } catch (Exception e) {
            log.error("Error creating record ids.", e);
        }
        return hasPublishDoc;
    }

    @Override
    public boolean isFolderWithPublishDoc(String uuid) {
        try {
            try (Connection conn = DatabaseConnectionUtils.getInstance().openConnection(internalDatabaseConnection)) {
                return this.isFolderWithPublishDoc(uuid, conn);
            }
        } catch (Exception e) {
            log.error("Error creating record ids.", e);
        }
        return false;
    }

    @Override
    public boolean isFolderWithPublishDoc(String uuid, Connection conn) {
        boolean hasPublishDoc = false;
        try {
            if (log.isDebugEnabled()) {
                log.debug("SQL: " + recordSqlValidateFolderChildren);
            }
            try (PreparedStatement ps = conn.prepareStatement(recordSqlValidateFolderChildren)) {
                ps.setString(1, uuid);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        String uuidChild = rs.getString(1);
                        String publishedId = rs.getString(2);
                        if(publishedId != null) {
                            hasPublishDoc = true;
                        } else {
                            hasPublishDoc = this.isFolderWithPublishDoc(uuidChild, conn);
                        }
                        if(hasPublishDoc) {
                            break;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error creating record ids.", e);
        }
        return hasPublishDoc;
    }

    @Override
    public int getDocCount() {
        return numRecords;
    }

    /**
     * Returns a DatabaseSourceRecord based on the database ID of the record.
     * Note that the result can be null if the publication conditions are not
     * met based on the SQL provided in property recordByIdSql, even if the
     * database ID exists.
     *
     * @param id The id of the record.
     * @return
     * @throws Exception
     */
    @Override
    public SourceRecord getRecordById(String id) throws Exception {
        if (recordByIdSql == null || recordByIdSql.length() == 0) {
            throw new RuntimeException("Property recordByIdSql not set.");
        }

        Connection conn = null;
        try {
            // connection will be closed in autoclosable DatabaseSourceRecord
            conn = DatabaseConnectionUtils.getInstance().openConnection(internalDatabaseConnection);
            try (PreparedStatement ps = conn.prepareStatement(recordByIdSql)) {
                ps.setLong(1, Long.parseLong( id ));
                try (ResultSet rs = ps.executeQuery()) {
                    String recordId = null;
                    if (rs.next()) {
                        if (log.isDebugEnabled()) {
                            log.debug("Record with ID '" + id + "' found by SQL: '" + recordByIdSql + "'");
                        }
                        return new DatabaseSourceRecord(rs.getString(1), recordPublication, conn);
                    } else {
                        // no record found
                        // this can happen if the publication conditions based on
                        // SQL in recordByIdSql are not met
                        if (log.isDebugEnabled()) {
                            log.debug("Record with ID '" + id + "' could be found by SQL: '" + recordByIdSql + "'");
                        }
                        // close connection explicit if no record could be obtained.
                        if (conn != null) {
                            conn.close();
                        }
                        return null;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error obtaining record with ID '" + id + "' by SQL: '" + recordByIdSql + "'", e);
            if (conn != null) {
                conn.close();
            }
        }
        return null;
    }

    public SourceRecord getRecordParentFolderById(String id, boolean isUuid) throws Exception {
        String sql = null;

        if(isUuid) {
            sql = recordParentFolderByUuidSql;
            if (recordParentFolderByUuidSql == null || recordParentFolderByUuidSql.length() == 0) {
                throw new RuntimeException("Property recordParentFolderByUuidSql not set.");
            }
        } else {
            sql = recordParentFolderByIdSql;
            if (recordParentFolderByIdSql == null || recordParentFolderByIdSql.length() == 0) {
                throw new RuntimeException("Property recordParentFolderByIdSql not set.");
            }
        }

        Connection conn = null;
        try {
            // connection will be closed in autoclosable DatabaseSourceRecord
            conn = DatabaseConnectionUtils.getInstance().openConnection(internalDatabaseConnection);
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                if(!isUuid) {
                    ps.setLong(1, Long.parseLong( id ));
                } else {
                    ps.setString(1, id);
                }
                
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        if (log.isDebugEnabled()) {
                            log.debug("Record with ID '" + id + "' found by SQL: '" + sql + "'");
                        }
                        return new DatabaseSourceRecord(rs.getString(1), recordPublication, conn);
                    } else {
                        // no record found
                        // this can happen if the publication conditions based on
                        // SQL in recordByIdSql are not met
                        if (log.isDebugEnabled()) {
                            log.debug("Record with ID '" + id + "' could be found by SQL: '" + sql + "'");
                        }
                        // close connection explicit if no record could be obtained.
                        if (conn != null) {
                            conn.close();
                        }
                        return null;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error obtaining record with ID '" + id + "' by SQL: '" + sql + "'", e);
            if (conn != null) {
                conn.close();
            }
        }
        return null;
    }

    public void setStatusProviderService(StatusProviderService statusProviderService) {
        this.statusProviderService = statusProviderService;
    }

}
