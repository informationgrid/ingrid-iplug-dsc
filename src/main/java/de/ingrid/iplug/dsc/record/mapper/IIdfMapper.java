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
package de.ingrid.iplug.dsc.record.mapper;

import org.w3c.dom.Document;

import de.ingrid.iplug.dsc.om.SourceRecord;

/**
 * Must be implemented by all mapper classes that map a {@link SourceRecord} to
 * an InGrid Detail data Format (IDF).
 * 
 * 
 * @author joachim@wemove.com
 * 
 */
public interface IIdfMapper {

    /**
     * Map a {@link SourceRecord} to an InGrid Detail data Format (IDF). The
     * implementing class must take care that all required parameters are
     * present in the {@link SourceRecord}.
     * 
     * @param record
     * @param doc
     * @throws Exception
     */
    public void map(SourceRecord record, Document doc) throws Exception;

}
