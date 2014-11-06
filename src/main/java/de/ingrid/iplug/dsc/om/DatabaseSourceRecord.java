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
package de.ingrid.iplug.dsc.om;

import java.sql.Connection;

/**
 * Represents a record set from a sql database.
 * 
 * @author joachim@wemove.com
 * 
 */
public class DatabaseSourceRecord extends SourceRecord {

    private static final long serialVersionUID = 5660303708840795055L;

    public static final String CONNECTION = "connection";

    /**
     * Creates a DatabaseRecord. It holds the source record id and the
     * connection for further usage.
     * 
     * @param id
     * @param connection
     */
    public DatabaseSourceRecord(String id, Connection connection) {
        super(id);
        this.put(CONNECTION, connection);
    }

}
