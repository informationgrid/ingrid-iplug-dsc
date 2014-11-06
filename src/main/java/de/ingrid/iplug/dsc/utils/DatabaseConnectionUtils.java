/**
 * Copyright (c) 2014 wemove GmbH
 * Licensed under the EUPL V.1.1
 *
 * This Software is provided to You under the terms of the European
 * Union Public License (the "EUPL") version 1.1 as published by the
 * European Union. Any use of this Software, other than as authorized
 * under this License is strictly prohibited (to the extent such use
 * is covered by a right of the copyright holder of this Software).
 *
 * This Software is provided under the License on an "AS IS" basis and
 * without warranties of any kind concerning the Software, including
 * without limitation merchantability, fitness for a particular purpose,
 * absence of defects or errors, accuracy, and non-infringement of
 * intellectual property rights other than copyright. This disclaimer
 * of warranty is an essential part of the License and a condition for
 * the grant of any rights to this Software.
 *
 * For more  details, see <http://joinup.ec.europa.eu/software/page/eupl>
 */
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

        log.debug("Opening database connection: " + url);
        Connection conn = DriverManager.getConnection(url, user, password); 

        String schema = internalDatabaseConnection.getSchema();
        if (schema != null && schema.length() > 0) {
            log.debug("database, set schema '" + schema + "'");
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
