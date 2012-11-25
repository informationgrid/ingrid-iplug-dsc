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
