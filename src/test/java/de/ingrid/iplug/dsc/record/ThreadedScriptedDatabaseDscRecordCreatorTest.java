package de.ingrid.iplug.dsc.record;

import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.springframework.core.io.ClassPathResource;

import de.ingrid.iplug.dsc.record.mapper.CreateIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.IIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.ScriptedIdfMapper;
import de.ingrid.iplug.dsc.record.producer.PlugDescriptionConfiguredDatabaseRecordProducer;
import de.ingrid.iplug.dsc.utils.IgcDbUnitEnabledTestCase;
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

        Document idxDoc = new Document();
        idxDoc.add(new Field("ID", "1", Field.Store.YES,
                        Field.Index.ANALYZED));
        

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
        private Document doc;
        
        
        public CallableRecordCreator(DscRecordCreator drc, Document doc) {
            this.drc = drc;
            this.doc = doc;
        }

        @Override
        public Record call() throws Exception {
            return drc.getRecord(doc);
        }
    };

    

}
