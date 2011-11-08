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

public class IgcDocumentProducerTestLocal extends TestCase {

    public void testScriptedDatabaseDocumentProducer() throws Exception {
        File plugDescriptionFile = new File(
                "src/test/resources/plugdescription_igc-3.0.0_test.xml");
        PlugDescription pd = new PlugdescriptionSerializer()
                .deSerialize(plugDescriptionFile);

        PlugDescriptionConfiguredDatabaseRecordSetProducer p = new PlugDescriptionConfiguredDatabaseRecordSetProducer();
        String sql = "SELECT DISTINCT id FROM t01_object WHERE work_state='V' AND publish_id='1'"
        		+ " AND id=3778 "
        		+ " OR id=6667" // t014_info_impart
        		+ " OR id=3919" // t011_obj_literature
        		+ " OR id=3782" // t011_obj_project
        		+ " OR id=3820" // t011_obj_data
        		+ " OR id=8781824" // t011_obj_serv
        		+ " OR id=7897095" // t011_obj_serv with urls
        		+ " OR id=6672" // t011_obj_geo
        		+ " OR id=6685" // additional_field_data
        		;
        p.setRecordSql(sql);
        p.configure(pd);

        ScriptedDocumentMapper m = new ScriptedDocumentMapper();
        m.setMappingScript(new FileSystemResource("src/main/resources/mapping/igc-3.2.0_to_lucene.js"));
        m.setCompile(true);

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
            fail("No document produced");
        }
    }
}
