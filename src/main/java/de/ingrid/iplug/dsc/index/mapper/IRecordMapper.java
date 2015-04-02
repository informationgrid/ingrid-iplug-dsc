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
package de.ingrid.iplug.dsc.index.mapper;

import java.util.Map;

import de.ingrid.iplug.dsc.om.SourceRecord;

/**
 * Interface for all "source record to lucene document mapper" classes.
 * Document mapper have knowledge of the underlying datasource and how to
 * retrieve a dataset from the datasource based on a record from a
 * IRecordSetProducer and map the dataset to a LuceneDocument.
 * 
 * @author joachim@wemove.com
 * 
 */
public interface IRecordMapper {

    /**
     * Maps a source record into a lucene document. The content of the source
     * record may vary. It is up to the implementing class to interpret the
     * source record and throw exceptions, if the record does not comply with
     * the needs of the mapper.
     * 
     * @param record
     * @param doc
     * @return
     */
    void map(SourceRecord record, Map<String, Object> doc) throws Exception;

}
