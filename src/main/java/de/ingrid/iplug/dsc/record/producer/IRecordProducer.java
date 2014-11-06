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
package de.ingrid.iplug.dsc.record.producer;

import org.apache.lucene.document.Document;

import de.ingrid.iplug.dsc.om.IClosableDataSource;
import de.ingrid.iplug.dsc.om.SourceRecord;

/**
 * Defines all aspects a record producer must implement. The record producer is
 * used to retrieve ONE record from the data source, based on a 
 * LuceneDocument for further processing.
 * 
 * @author joachim@wemove.com
 * 
 */
public interface IRecordProducer {

    /**
     * Open the data source. The functionality depends on the type of data
     * source. Returns a closable data source.
     * 
     * The parameters in {@link SourceRecord} returned by {@link getRecord} may
     * contain a reference to the data source, so that the following mapping
     * step can access the data source as well.
     * 
     */
    IClosableDataSource openDatasource();

    /**
     * Get a record from the data source. How the record must be derived from
     * the fields of the lucene document.
     * 
     * @param doc
     * @param ds
     * @return
     */
    SourceRecord getRecord(Document doc, IClosableDataSource ds);

}
