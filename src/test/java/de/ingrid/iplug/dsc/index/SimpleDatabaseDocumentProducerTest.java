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
package de.ingrid.iplug.dsc.index;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import de.ingrid.admin.Config;
import de.ingrid.admin.JettyStarter;
import de.ingrid.utils.statusprovider.StatusProviderService;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import de.ingrid.iplug.dsc.index.mapper.IRecordMapper;
import de.ingrid.iplug.dsc.index.mapper.SimpleDatabaseRecord2DocumentMapper;
import de.ingrid.iplug.dsc.index.producer.PlugDescriptionConfiguredDatabaseRecordSetProducer;
import de.ingrid.iplug.dsc.utils.IgcDbUnitEnabledTestCase;
import de.ingrid.utils.PlugDescription;
import de.ingrid.utils.xml.PlugdescriptionSerializer;

public class SimpleDatabaseDocumentProducerTest extends IgcDbUnitEnabledTestCase {
    
    StatusProviderService statusProviderService;

    public SimpleDatabaseDocumentProducerTest(String name) throws Exception {
        super( name );
        statusProviderService = new StatusProviderService();
        setDatasourceFileName( "src/test/resources/dataset.xml" );
        new JettyStarter(false);
    }

    public void testDscDocumentProducer() throws Exception {
        this.setDatasourceFileName( "src/test/resources/dataset.xml" );

        File plugDescriptionFile = new File( "src/test/resources/plugdescription_db_test.xml" );
        PlugDescription pd = new PlugdescriptionSerializer().deSerialize( plugDescriptionFile );

        PlugDescriptionConfiguredDatabaseRecordSetProducer p = new PlugDescriptionConfiguredDatabaseRecordSetProducer();
        p.setStatusProviderService( statusProviderService );
        p.setRecordSql( "SELECT * FROM TEST_TABLE" );
        p.configure( pd );

        SimpleDatabaseRecord2DocumentMapper m = new SimpleDatabaseRecord2DocumentMapper();
        m.setSql( "SELECT * FROM TEST_TABLE WHERE id=?" );

        List<IRecordMapper> mList = new ArrayList<IRecordMapper>();
        mList.add( m );

        DscDocumentProducer dp = new DscDocumentProducer();
        dp.setConfig(new Config());
        dp.setRecordSetProducer( p );
        dp.setRecordMapperList( mList );

        if (dp.hasNext()) {
            while (dp.hasNext()) {
                Map<String, Object> doc = dp.next();
                assertNotNull( doc );
                
                Collection<String> keys = Arrays.asList( "ID", "COL1", "COL2" );
                assertTrue( doc.keySet().containsAll( keys ) );
            }
        } else {
            fail( "No document produced" );
        }
    }

}
