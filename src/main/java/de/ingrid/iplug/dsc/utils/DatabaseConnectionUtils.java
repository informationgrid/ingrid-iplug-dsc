/**
 * 
 */
package de.ingrid.iplug.dsc.utils;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;

import org.apache.log4j.Logger;

import de.ingrid.iplug.dsc.index.DatabaseConnection;

/**
 * Singleton helper class encapsulating stuff for creating / closing database connection ...
 * To be utilized by record producers
 *  
 * @author Martin
 */
public class DatabaseConnectionUtils {

    private static final Logger log = Logger.getLogger(DatabaseConnectionUtils.class);
    
	private static DatabaseConnectionUtils myInstance;

	/** Get The Singleton. */
	public static synchronized DatabaseConnectionUtils getInstance() {
		if (myInstance == null) {
	        myInstance = new DatabaseConnectionUtils();
		}
		return myInstance;
	}

	private DatabaseConnectionUtils() {
	}


    public Connection openConnection(DatabaseConnection internalDatabaseConnection)
    		throws ClassNotFoundException, SQLException {

        Class.forName(internalDatabaseConnection.getDataBaseDriver());
        String url = internalDatabaseConnection.getConnectionURL();
        String user = internalDatabaseConnection.getUser();
        String password = internalDatabaseConnection.getPassword();

        log.info("Opening database connection.");
        Connection conn = DriverManager.getConnection(url, user, password); 

        String schema = internalDatabaseConnection.getSchema();
        if (schema != null && schema.length() > 0) {
            log.info("database, set schema '" + schema + "'");
// Throws Exception "AbstractMethod" seems to be not implemented in oracle driver !
//        	conn.setSchema(schema);
        	
            // So we switch schema for Oracle like this ! HACK !?
            String sql = "ALTER SESSION SET CURRENT_SCHEMA="+schema;
            if (log.isDebugEnabled()) {
            	log.debug("execute: " + sql);
            }
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.execute();
        }

        return conn;
    }

    public void closeConnection(Connection conn) throws SQLException {
        log.info("Closing database connection.");
        conn.close();
    }
}
