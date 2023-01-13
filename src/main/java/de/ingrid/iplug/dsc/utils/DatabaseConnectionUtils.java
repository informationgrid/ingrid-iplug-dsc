/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2023 wemove digital solutions GmbH
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

import de.ingrid.utils.statusprovider.StatusProvider;
import org.apache.commons.dbcp2.BasicDataSource;
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

    private BasicDataSource dataSource;

	/** Get The Singleton. */
	public static synchronized DatabaseConnectionUtils getInstance() {
		if (myInstance == null) {
	        myInstance = new DatabaseConnectionUtils();
		}
		return myInstance;
	}

	private DatabaseConnectionUtils() {
	}

	private void openDataSource(DatabaseConnection internalDatabaseConnection) {
        try {
            if (dataSource != null) {
                try {
                    dataSource.close();
                } catch (SQLException e) {
                    log.error("Error closing database connection pool. Create a new one.");
                }
            }
            dataSource = new BasicDataSource();
            dataSource.setDriverClassName(internalDatabaseConnection.getDataBaseDriver());
            dataSource.setUrl(internalDatabaseConnection.getConnectionURL());
            dataSource.setUsername(internalDatabaseConnection.getUser());
            dataSource.setPassword(internalDatabaseConnection.getPassword());
            dataSource.setDefaultSchema(internalDatabaseConnection.getSchema());
            //dataSource.setMaxActive(5);
            dataSource.setMaxIdle(2);
            dataSource.setInitialSize(2);
            if (DatabaseConnectionUtils.isOracle(internalDatabaseConnection)) {
                dataSource.setValidationQuery("select 1 from dual");
            } else if (DatabaseConnectionUtils.isHSQLDB(internalDatabaseConnection)) {
                dataSource.setValidationQuery("SELECT 1 FROM INFORMATION_SCHEMA.SYSTEM_USERS");
            } else {
                dataSource.setValidationQuery("select 1");
            }
        } catch (Exception e) {
            log.error("Error opening connection!", e);
        }

    }

    public Connection openConnection(DatabaseConnection internalDatabaseConnection) throws SQLException {
        if (dataSource == null || dataSource.isClosed()) {
            openDataSource(internalDatabaseConnection);
        }
	    return dataSource.getConnection();
    }

    public void closeDataSource() throws SQLException {
	    if (dataSource != null) {
	        dataSource.close();
        }
    }

    public static boolean isOracle(DatabaseConnection dbConn) {
        if (dbConn.getDataBaseDriver().contains( "oracle" ))
            return true;
        return false;        
    }
    public static boolean isHSQLDB(DatabaseConnection dbConn) {
        if (dbConn.getDataBaseDriver().toLowerCase().contains( "hsqldb" ))
            return true;
        return false;
    }
    public static boolean isPostgres(DatabaseConnection dbConn) {
        if (dbConn.getDataBaseDriver().contains( "postgres" ))
            return true;
        return false;        
    }
    /** Returns "public" if postgres, username if oracle, else "" */
    public static String getDefaultSchema(DatabaseConnection dbConn) {
        if (isPostgres( dbConn )) {
            return "public";
        } else if (isOracle( dbConn )) {
            return dbConn.getUser();
        }

        return "";
    }
}
