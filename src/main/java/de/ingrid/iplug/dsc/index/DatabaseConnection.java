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
package de.ingrid.iplug.dsc.index;

import de.ingrid.utils.IDataSourceConnection;

/**
 * Class for creating a database connection.
 */
public class DatabaseConnection implements IDataSourceConnection {

    private static final long serialVersionUID = DatabaseConnection.class
            .getName().hashCode();

    public static final String DRIVER_MYSQL = "com.mysql.jdbc.Driver";
    public static final String DRIVER_ORACLE = "oracle.jdbc.driver.OracleDriver";
    public static final String DRIVER_MS_2000 = "com.microsoft.jdbc.sqlserver.SQLServerDriver";
    public static final String DRIVER_MS_2005 = "com.microsoft.sqlserver.jdbc.SQLServerDriver";
    public static final String DRIVER_POSTGRE = "org.postgresql.Driver";
    public static final String DRIVER_ACCESS = "sun.jdbc.odbc.JdbcOdbcDriver";

    private String fDriver;

    private String fConnectionurl;

    private String fUser;

    private String fPassword;

    private String fSchema;

    public DatabaseConnection() {
        super();
    }

    /**
     * @param driver
     * @param connectionurl
     * @param user
     * @param password
     * @param schema
     */
    public DatabaseConnection(String driver, String connectionurl, String user,
            String password, String schema) {
        this.fDriver = driver;
        this.fConnectionurl = connectionurl;
        this.fUser = user;
        this.fPassword = password;
        this.fSchema = schema;
    }

    /**
     * Returns the database driver.
     * 
     * @return The driver.
     */
    public String getDataBaseDriver() {
        return this.fDriver;
    }

    public void setDataBaseDriver(String fDriver) {
        this.fDriver = fDriver;
    }

    /**
     * Returns the database connection url.
     * 
     * @return The connection URL.
     */
    public String getConnectionURL() {
        return this.fConnectionurl;
    }

    public void setConnectionURL(String fConnectionurl) {
        this.fConnectionurl = fConnectionurl;
    }

    /**
     * Returns the database user.
     * 
     * @return The user.
     */
    public String getUser() {
        return this.fUser;
    }

    public void setUser(String fUser) {
        this.fUser = fUser;
    }

    /**
     * Returns the database password for the given user.
     * 
     * @return The password.
     */
    public String getPassword() {
        return this.fPassword;
    }

    public void setPassword(String fPassword) {
        this.fPassword = fPassword;
    }

    /**
     * Returns the database schema.
     * 
     * @return The schema.
     */
    public String getSchema() {
        return this.fSchema;
    }

    public void setSchema(String fSchema) {
        this.fSchema = fSchema;
    }

}
