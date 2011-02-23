package de.ingrid.iplug.dsc.index;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import junit.framework.TestCase;

import org.apache.lucene.document.Document;
import org.springframework.core.io.FileSystemResource;

import de.ingrid.iplug.dsc.index.mapper.IRecordMapper;
import de.ingrid.iplug.dsc.index.mapper.ScriptedDocumentMapper;
import de.ingrid.iplug.dsc.index.producer.PlugDescriptionConfiguredDatabaseRecordSetProducer;
import de.ingrid.utils.PlugDescription;
import de.ingrid.utils.xml.PlugdescriptionSerializer;

public class ScriptedDatabaseDocumentProducerTestLocal extends TestCase {

    public void testScriptedDatabaseDocumentProducer() throws Exception {
        File plugDescriptionFile = new File(
                "src/test/resources/plugdescription_db_test_local.xml");
        PlugDescription pd = new PlugdescriptionSerializer()
                .deSerialize(plugDescriptionFile);

        PlugDescriptionConfiguredDatabaseRecordSetProducer p = new PlugDescriptionConfiguredDatabaseRecordSetProducer();
        String sql = "SELECT DISTINCT id FROM t01_object WHERE work_state='V' AND publish_id='1'"
        		// single record
        		+ " AND id = 3776"
        		;
        p.setRecordSql(sql);
        p.configure(pd);

        ScriptedDocumentMapper m = new ScriptedDocumentMapper();
        m.setMappingScript(new FileSystemResource("src/main/resources/mapping/igc-3.0.0_to_lucene.js"));
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
                // when single record fetched !
                assertEquals(doc.getField("obj_uuid").stringValue(), "7AC6048A-7018-11D3-A599-C70A0FEBD4FC");
            }
        } else {
            fail("No document produced");
        }
    }
    
}
