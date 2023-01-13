/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2023 wemove digital solutions GmbH
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
package de.ingrid.iplug.dsc.record;

import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.springframework.core.io.ClassPathResource;

import de.ingrid.iplug.dsc.record.mapper.CreateIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.IIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.ScriptedIdfMapper;
import de.ingrid.iplug.dsc.record.producer.PlugDescriptionConfiguredDatabaseRecordProducer;
import de.ingrid.iplug.dsc.utils.IgcDbUnitEnabledTestCase;
import de.ingrid.utils.ElasticDocument;
import de.ingrid.utils.PlugDescription;
import de.ingrid.utils.dsc.Record;
import de.ingrid.utils.xml.PlugdescriptionSerializer;

public class ThreadedScriptedDatabaseDscRecordCreatorTest extends IgcDbUnitEnabledTestCase {

    public ThreadedScriptedDatabaseDscRecordCreatorTest(String name) {
        super(name);
        setDatasourceFileName("src/test/resources/dataset.xml");
    }

    public void testDscRecordCreator() throws Exception {
        this.setDatasourceFileName("src/test/resources/dataset.xml");

        File plugDescriptionFile = new File(
                "src/test/resources/plugdescription_db_test.xml");
        PlugDescription pd = new PlugdescriptionSerializer()
                .deSerialize(plugDescriptionFile);

        PlugDescriptionConfiguredDatabaseRecordProducer p = new PlugDescriptionConfiguredDatabaseRecordProducer();
        p.setIndexFieldID("ID");
        p.configure(pd);

        CreateIdfMapper m1 = new CreateIdfMapper();
        ScriptedIdfMapper m2 = new ScriptedIdfMapper();
        ClassPathResource[] mappingScripts = {
        	new ClassPathResource("scripts/record2idf_database_test.js")
        };
        m2.setMappingScripts(mappingScripts);

        List<IIdfMapper> mList = new ArrayList<IIdfMapper>();
        mList.add(m1);
        mList.add(m2);
        
        DscRecordCreator dc = new DscRecordCreator();
        dc.setRecordProducer(p);
        dc.setRecord2IdfMapperList(mList);

        ElasticDocument idxDoc = new ElasticDocument();
        idxDoc.put("ID", "1");
        

        int threadCount = 5;
        List<CallableRecordCreator> tasks = Collections.nCopies(threadCount, new CallableRecordCreator(dc, idxDoc));
        ExecutorService executorService = Executors.newFixedThreadPool(threadCount);
        List<Future<Record>> futures = executorService.invokeAll(tasks);
        List<Record> resultList = new ArrayList<Record>(futures.size());
        // Check for exceptions
        for (Future<Record> future : futures) {
            // Throws an exception if an exception was thrown by the task.
            resultList.add(future.get());
        }
        
        for (Record result : resultList) {
            assertNotNull(result.get("data"));
        }
        
    }
    
    private class CallableRecordCreator implements Callable<Record> {
        
        private DscRecordCreator drc;
        private ElasticDocument doc;
        
        
        public CallableRecordCreator(DscRecordCreator drc, ElasticDocument doc) {
            this.drc = drc;
            this.doc = doc;
        }

        @Override
        public Record call() throws Exception {
            return drc.getRecord(doc);
        }
    };

    

}
