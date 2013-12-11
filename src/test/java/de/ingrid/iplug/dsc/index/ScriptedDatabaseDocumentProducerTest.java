package de.ingrid.iplug.dsc.index;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import org.apache.lucene.document.Document;
import org.springframework.core.io.ClassPathResource;

import de.ingrid.iplug.dsc.index.mapper.IRecordMapper;
import de.ingrid.iplug.dsc.index.mapper.ScriptedDocumentMapper;
import de.ingrid.iplug.dsc.index.producer.PlugDescriptionConfiguredDatabaseRecordSetProducer;
import de.ingrid.iplug.dsc.utils.IgcDbUnitEnabledTestCase;
import de.ingrid.utils.PlugDescription;
import de.ingrid.utils.xml.PlugdescriptionSerializer;

public class ScriptedDatabaseDocumentProducerTest extends IgcDbUnitEnabledTestCase {

    public ScriptedDatabaseDocumentProducerTest(String name) {
        super(name);
        setDatasourceFileName("src/test/resources/dataset.xml");
    }

    public void testScriptedDatabaseDocumentProducer() throws Exception {
        this.setDatasourceFileName("src/test/resources/dataset.xml");

        File plugDescriptionFile = new File(
                "src/test/resources/plugdescription_db_test.xml");
        PlugDescription pd = new PlugdescriptionSerializer()
                .deSerialize(plugDescriptionFile);

        PlugDescriptionConfiguredDatabaseRecordSetProducer p = new PlugDescriptionConfiguredDatabaseRecordSetProducer();
        p.setRecordSql("SELECT * FROM TEST_TABLE");
        p.configure(pd);

        ScriptedDocumentMapper m = new ScriptedDocumentMapper();
        ClassPathResource[] mappingScripts = {
        	new ClassPathResource("scripts/record2index_database_test.js")
        };
        m.setMappingScripts(mappingScripts);
        m.setCompile(false);

        List<IRecordMapper> mList = new ArrayList<IRecordMapper>();
        mList.add(m);
        
        DscDocumentProducer dp = new DscDocumentProducer();
        dp.setRecordSetProducer(p);
        dp.setRecordMapperList(mList);

        if (dp.hasNext()) {
            while (dp.hasNext()) {
                Document doc = dp.next();
                assertNotNull(doc);
            }
        } else {
            fail("No documnet produced");
        }
    }
    
}
