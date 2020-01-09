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
