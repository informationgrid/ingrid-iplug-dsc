/**
 * 
 */
package de.ingrid.iplug.dsc.record.producer;

import java.sql.Connection;
import java.sql.SQLException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;

import de.ingrid.iplug.dsc.index.DatabaseConnection;
import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.iplug.dsc.utils.DatabaseConnectionUtils;
import de.ingrid.utils.IConfigurable;
import de.ingrid.utils.PlugDescription;

/**
 * This class retrieves a record from a database data source. It retrieves an
 * database id from a lucene document ({@link getRecord}) and creates a
 * {@link DatabaseSourceRecord} containing the database ID that identifies the
 * database record and the open connection to the database.
 * 
 * The database connection is configured via the {@link PlugDescription}.
 * 
 * 
 * @author joachim@wemove.com
 * 
 */
public class PlugDescriptionConfiguredDatabaseRecordProducer implements
        IRecordProducer, IConfigurable {

    private String indexFieldID;

    DatabaseConnection internalDatabaseConnection = null;
    Connection connection = null;

    final private static Log log = LogFactory
            .getLog(PlugDescriptionConfiguredDatabaseRecordProducer.class);

    /*
     * (non-Javadoc)
     * 
     * @see
     * de.ingrid.iplug.dsc.record.IRecordProducer#getRecord(org.apache.lucene
     * .document.Document)
     */
    @Override
    public SourceRecord getRecord(Document doc) {
        if (indexFieldID == null) {
            log.error("Name of ID-Field in Lucene Doc is not set!");
            throw new IllegalArgumentException("Name of ID-Field in Lucene Doc is not set!");
        }

        openConnection();
        Field field = doc.getField(indexFieldID);
        return new DatabaseSourceRecord(field.stringValue(), connection);
    }

    /*
     * (non-Javadoc)
     * 
     * @see
     * de.ingrid.iplug.dsc.record.IRecordProducer#getRecord(org.apache.lucene
     * .document.Document)
     */
    @Override
    public void configure(PlugDescription plugDescription) {
        this.internalDatabaseConnection = (DatabaseConnection) plugDescription
                .getConnection();
    }

    /* (non-Javadoc)
     * @see de.ingrid.iplug.dsc.record.IRecordProducer#closeDatasource()
     */
    @Override
    public void closeDatasource() {
        closeConnection();
    }

    /* (non-Javadoc)
     * @see de.ingrid.iplug.dsc.record.IRecordProducer#openDatasource()
     */
    @Override
    public void openDatasource() {
        openConnection();

    }

    private void openConnection() {
        try {
            if (connection == null || connection.isClosed()) {
            	connection = DatabaseConnectionUtils.getInstance().openConnection(internalDatabaseConnection);
            }
        } catch (Exception e) {
            log.error("Error opening connection!", e);
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

	public String getIndexFieldID() {
		return indexFieldID;
	}

	public void setIndexFieldID(String indexFieldID) {
		this.indexFieldID = indexFieldID;
	}
}
