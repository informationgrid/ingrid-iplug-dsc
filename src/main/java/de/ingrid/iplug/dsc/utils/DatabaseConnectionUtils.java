/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2015 wemove digital solutions GmbH
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
