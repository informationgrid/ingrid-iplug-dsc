package de.ingrid.iplug.dsc.record;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

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

public class ScriptedDatabaseDscRecordCreatorTest extends IgcDbUnitEnabledTestCase {

    public ScriptedDatabaseDscRecordCreatorTest(String name) {
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
        Record r = dc.getRecord(idxDoc);
        assertNotNull(r.get("data"));
        assertTrue(r.getString("compressed").equals("false"));
        System.out.println("Size of uncompressed IDF document: " + r.getString("data").length());
        
        idxDoc = new Document();
        idxDoc.add(new Field("ID", "1", Field.Store.YES,
                        Field.Index.ANALYZED));
        dc.setCompressed(true);
        r = dc.getRecord(idxDoc);
        assertNotNull(r.get("data"));
        assertTrue(r.getString("compressed").equals("true"));
        System.out.println("Size of compressed IDF document: " + r.getString("data").length());

        m2.setCompile(true);
        idxDoc = new Document();
        idxDoc.add(new Field("ID", "1", Field.Store.YES,
                        Field.Index.ANALYZED));
        dc.setCompressed(true);
        r = dc.getRecord(idxDoc);
        assertNotNull(r.get("data"));
        assertTrue(r.getString("compressed").equals("true"));
        System.out.println("Size of compressed IDF document with compiled mapper script: " + r.getString("data").length());
        
    }

}
