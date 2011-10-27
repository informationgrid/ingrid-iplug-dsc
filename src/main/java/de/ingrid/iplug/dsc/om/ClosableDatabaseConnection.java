/**
 * 
 */
package de.ingrid.iplug.dsc.om;

import java.sql.Connection;
import java.sql.SQLException;

import org.apache.log4j.Logger;

/**
 * @author joachim
 * 
 */
public class ClosableDatabaseConnection implements IClosableDataSource {

    private static final Logger log = Logger.getLogger(ClosableDatabaseConnection.class);

    private Connection connection = null;

    public ClosableDatabaseConnection(Connection connection) {
        this.connection = connection;
    }

    public Connection getConnection() {
        return this.connection;
    }

    /*
     * (non-Javadoc)
     * 
     * @see de.ingrid.iplug.dsc.om.IClosableDataSource#close()
     */
    @Override
    public void close() {
        try {
            if (connection != null && !connection.isClosed()) {
                connection.close();
            }
        } catch (SQLException e) {
            log.error("Error closing connection.");
        }
    }

}
