/**
 * 
 */
package de.ingrid.iplug.dsc.index.producer;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import de.ingrid.iplug.dsc.index.DatabaseConnection;
import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.SourceRecord;
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
public class PlugDescriptionConfiguredDatabaseRecordSetProducer implements
        IRecordSetProducer, IConfigurable {

    DatabaseConnection internalDatabaseConnection = null;
    Connection connection = null;
    String recordSql = "";
    Iterator<String> recordIdIterator = null;

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
            recordIdIterator =  null;
            closeConnection();
            return false;
        }
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

    private void openConnection() {
        try {
            if (connection == null || connection.isClosed()) {
                Class.forName(internalDatabaseConnection.getDataBaseDriver());
                String url = internalDatabaseConnection.getConnectionURL();
                String user = internalDatabaseConnection.getUser();
                String password = internalDatabaseConnection.getPassword();
                log.info("Opening database connection.");
                connection = DriverManager.getConnection(url, user, password);
            }
        } catch (Exception e) {
            log.error("Error opening connection!", e);
        }
    }

    private void closeConnection() {
        if (connection != null) {
            try {
                log.info("Closing database connection.");
                connection.close();
            } catch (SQLException e) {
                log.error("Error closing connection.", e);
            }
        }
    }

    private void createRecordIdsFromDatabase() {
        try {
            List<String> recordIds = new ArrayList<String>();
            PreparedStatement ps = connection.prepareStatement(recordSql);
            try {
                ResultSet rs = ps.executeQuery();
                try {
                    while (rs.next()) {
                        recordIds.add(rs.getString(1));
                    }
                    recordIdIterator = recordIds.listIterator();
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



}
