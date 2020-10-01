/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2020 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.1 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * http://ec.europa.eu/idabc/eupl5
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

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import de.ingrid.utils.statusprovider.StatusProvider;
import de.ingrid.utils.statusprovider.StatusProviderService;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;

import de.ingrid.iplug.dsc.index.DatabaseConnection;
import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.iplug.dsc.utils.DatabaseConnectionUtils;
import de.ingrid.utils.IConfigurable;
import de.ingrid.utils.PlugDescription;

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
    Connection connection = null;
    String recordSql = "";

    String recordSqlValidateFolderChildren = "";

    String recordSqlValidateParentPublishDoc = "";

    String recordParentFolderByIdSql = "";

    String recordParentFolderByUuidSql = "";

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
            openConnection();
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
        closeConnection();
    }

    /*
     * (non-Javadoc)
     * 
     * @see de.ingrid.iplug.dsc.index.IRecordProducer#next()
     */
    @Override
    public SourceRecord next() {
        return new DatabaseSourceRecord(recordIdIterator.next(), connection);
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

    private void openConnection() {
        try {
            if (connection == null || connection.isClosed()) {
            	connection = DatabaseConnectionUtils.getInstance().openConnection(internalDatabaseConnection);
            }
        } catch (Exception e) {
            log.error("Error opening connection!", e);
            statusProviderService.getDefaultStatusProvider().addState("error", "Error opening connection: " + e.getMessage(), StatusProvider.Classification.ERROR);
        }
    }

    private void closeConnection() {
        if (connection != null) {
            try {
            	DatabaseConnectionUtils.getInstance().closeConnection(connection);
            } catch (SQLException e) {
                log.error("Error closing connection.", e);
            }
        }
    }

    private void createRecordIdsFromDatabase() {
        try {
            List<String> recordIds = new ArrayList<String>();
            if (log.isDebugEnabled()) {
                log.debug("SQL: " + recordSql);
            }
            PreparedStatement ps = connection.prepareStatement(recordSql);
            try {
                ResultSet rs = ps.executeQuery();
                try {
                    while (rs.next()) {
                        String id = rs.getString(1);
                        String uuid = rs.getString(2);
                        String udkClass = rs.getString(3);
                        boolean addValue = false;
                        if(uuid != null && udkClass != null) {
                            if(udkClass.equals("1000")) {
                                // Check if folder has published children documents
                                if(isFolderWithPublishDoc(uuid, connection)) {
                                    if (log.isDebugEnabled()) {
                                        log.debug("Index folder with UUID: " + uuid);
                                    }
                                    addValue = true;
                                }
                            } else {
                                addValue = true;
                            }
                            if(addValue) { 
                                addValue = isParentPublishDoc(uuid, addValue, connection);
                            }
                        }
                        if(addValue) {
                            recordIds.add(id);
                        }
                    }
                    recordIdIterator = recordIds.listIterator();
                    numRecords = recordIds.size();
                } catch (Exception e) {
                    throw e;
                } finally {
                    rs.close();
                }
            } catch (Exception e) {
                throw e;
            } finally {
                ps.close();
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
                        return new DatabaseSourceRecord(rs.getString(1), conn);
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
