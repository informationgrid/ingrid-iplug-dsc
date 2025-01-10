/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2025 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.2 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * https://joinup.ec.europa.eu/software/page/eupl
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

import de.ingrid.utils.ElasticDocument;

/**
 * Represents a record set from a sql database.
 * 
 * @author joachim@wemove.com
 * 
 */
public class DatabaseSourceRecord extends SourceRecord {

    private static final long serialVersionUID = 5660303708840795055L;

    public static final String CONNECTION = "connection";

    public static final String PUBLICATION = "publication";

    public static final String INDEX_DOCUMENT = "idxDoc";

    /**
     * Creates a DatabaseRecord. It holds the source record id and the
     * connection for further usage.
     * 
     * @param id
     * @param connection
     */
    public DatabaseSourceRecord(String id, String publication, Connection connection) {
        super( id );
        this.put( PUBLICATION, publication );
        this.put( CONNECTION, connection );
    }

    /**
     * Creates a DatabaseRecord. It holds the source record id and the
     * connection and an Elastic Index Document for further usage.
     * 
     * @param id
     * @param connection
     */
    public DatabaseSourceRecord(String id, String publication, Connection connection, ElasticDocument idxDoc) {
        super( id );
        this.put( PUBLICATION, publication );
        this.put( CONNECTION, connection );
        this.put( INDEX_DOCUMENT, idxDoc );
    }

    @Override
    public void close() throws Exception {
        if (this.get(CONNECTION) !=null ) {
            Connection connection = (Connection) this.get(CONNECTION);
            if (!connection.isClosed()) {
                connection.close();
            }
        }
    }
}
