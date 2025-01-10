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
package de.ingrid.iplug.dsc.record.producer;

import de.ingrid.iplug.dsc.index.DatabaseConnection;
import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.iplug.dsc.utils.DatabaseConnectionUtils;
import de.ingrid.utils.ElasticDocument;
import de.ingrid.utils.IConfigurable;
import de.ingrid.utils.PlugDescription;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import java.sql.Connection;

/**
 * This class retrieves a record from a database data source. It retrieves an
 * database id from a lucene document (getRecord) and creates a
 * {@link DatabaseSourceRecord} containing the database ID that identifies the
 * database record and the open connection to the database.
 * 
 * The database connection is configured via the {@link PlugDescription}.
 * 
 * 
 * @author joachim@wemove.com
 * 
 */
// Bean created depending on SpringConfiguration
//@Service
public class PlugDescriptionConfiguredDatabaseRecordProducer implements IRecordProducer, IConfigurable {

    private String indexFieldID;
    private String publication;

    DatabaseConnection internalDatabaseConnection = null;

    final private static Log log = LogFactory.getLog(PlugDescriptionConfiguredDatabaseRecordProducer.class);

    /*
     * (non-Javadoc)
     * 
     * @see
     * de.ingrid.iplug.dsc.record.IRecordProducer#getRecord(org.apache.lucene
     * .document.Document)
     */
    @Override
    public SourceRecord getRecord(ElasticDocument doc, Connection connection) {
        if (indexFieldID == null) {
            log.error("Name of ID-Field in Lucene Doc is not set!");
            throw new IllegalArgumentException("Name of ID-Field in Lucene Doc is not set!");
        }

        Object field = doc.get(indexFieldID);

        // TODO: what if field is a list?
        try {
            return new DatabaseSourceRecord(field.toString(), getPublication(), connection, doc);
            
        } catch (Exception e) {
            log.error( "Value of " + indexFieldID + " in doc: " + field );
            log.error( "Error during record generation:", e );
            return null;
        }
    }

    /*
     * (non-Javadoc)
     * 
     * @see
     * de.ingrid.iplug.dsc.record.IRecordProducer#getRecord(org.apache.lucene
     * .document.Document)
     */
    @Override
    public void configure(PlugDescription plugDescription) {
        this.internalDatabaseConnection = (DatabaseConnection) plugDescription.getConnection();
    }

    /*
     * (non-Javadoc)
     * 
     * @see de.ingrid.iplug.dsc.record.IRecordProducer#openDatasource()
     */
    @Override
    public Connection openDatasource() {
        try {
            return DatabaseConnectionUtils.getInstance().openConnection(internalDatabaseConnection);
        } catch (Exception e) {
            log.error("Error opening connection!", e);
        }
        return null;
    }

    public String getIndexFieldID() {
        return indexFieldID;
    }

    public void setIndexFieldID(String indexFieldID) {
        this.indexFieldID = indexFieldID;
    }

    public String getPublication() {
        return publication;
    }

    public void setPublication(String publication) {
        this.publication = publication;
    }
}
