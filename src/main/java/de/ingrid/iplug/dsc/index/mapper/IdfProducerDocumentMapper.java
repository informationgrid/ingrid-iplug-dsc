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

import org.apache.log4j.Logger;

import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.iplug.dsc.record.DscRecordCreator;
import de.ingrid.utils.ElasticDocument;
import de.ingrid.utils.dsc.Record;
import de.ingrid.utils.idf.IdfTool;

/**
 * Maps a {@link DatabaseSourceRecord} to an IDF records and place it into a
 * {@link ElasticDocument} document in the field 'idf'.
 * 
 * 
 * @author joachim@wemove.com
 * 
 */
public class IdfProducerDocumentMapper implements IRecordMapper {

    public static final String DOCUMENT_FIELD_IDF = "idf";

    protected static final Logger log = Logger.getLogger( IdfProducerDocumentMapper.class );

    private DscRecordCreator dscRecordCreator = null;

    @Override
    public void map(SourceRecord record, ElasticDocument doc) throws Exception {
        if (!(record instanceof DatabaseSourceRecord)) {
            throw new IllegalArgumentException( "Record is no DatabaseRecord!" );
        }

        Record rec = dscRecordCreator.getRecord( doc );
        doc.put( DOCUMENT_FIELD_IDF, IdfTool.getIdfDataFromRecord( rec ) );

    }


    public DscRecordCreator getDscRecordCreator() {
        return dscRecordCreator;
    }

    public void setDscRecordCreator(DscRecordCreator dscRecordCreator) {
        this.dscRecordCreator = dscRecordCreator;
    }

}
