package de.ingrid.iplug.dsc.record;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import junit.framework.TestCase;

import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.springframework.core.io.FileSystemResource;

import de.ingrid.iplug.dsc.record.mapper.CreateIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.IIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.ScriptedIdfMapper;
import de.ingrid.iplug.dsc.record.producer.PlugDescriptionConfiguredDatabaseRecordProducer;
import de.ingrid.utils.PlugDescription;
import de.ingrid.utils.dsc.Record;
import de.ingrid.utils.xml.PlugdescriptionSerializer;

public class ScriptedDatabaseDscRecordCreatorTestLocal extends TestCase {

    public void testDscRecordCreator() throws Exception {
        File plugDescriptionFile = new File(
        		"src/test/resources/plugdescription_db_test_local.xml");
        PlugDescription pd = new PlugdescriptionSerializer()
                .deSerialize(plugDescriptionFile);

        PlugDescriptionConfiguredDatabaseRecordProducer p = new PlugDescriptionConfiguredDatabaseRecordProducer();
        p.setIndexFieldID("t01_object.id");
        p.configure(pd);

        CreateIdfMapper m1 = new CreateIdfMapper();
        ScriptedIdfMapper m2 = new ScriptedIdfMapper();
        m2.setMappingScript(new FileSystemResource("src/main/resources/mapping/igc-3.0.0_to_idf-1.0.js"));

        List<IIdfMapper> mList = new ArrayList<IIdfMapper>();
        mList.add(m1);
        mList.add(m2);
        
        DscRecordCreator dc = new DscRecordCreator();
        dc.setRecordProducer(p);
        dc.setRecord2IdfMapperList(mList);

        String t01ObjectId = "3778";

        Document idxDoc = new Document();
        idxDoc.add(new Field("t01_object.id", t01ObjectId, Field.Store.YES, Field.Index.ANALYZED));
        Record r = dc.getRecord(idxDoc);
        assertNotNull(r.get("data"));
        assertTrue(r.getString("compressed").equals("false"));
        System.out.println("Size of uncompressed IDF document: " + r.getString("data").length());
        
        idxDoc = new Document();
        idxDoc.add(new Field("t01_object.id", t01ObjectId, Field.Store.YES, Field.Index.ANALYZED));
        dc.setCompressed(true);
        r = dc.getRecord(idxDoc);
        assertNotNull(r.get("data"));
        assertTrue(r.getString("compressed").equals("true"));
        System.out.println("Size of compressed IDF document: " + r.getString("data").length());

        m2.setCompile(true);
        idxDoc = new Document();
        idxDoc.add(new Field("t01_object.id", t01ObjectId, Field.Store.YES, Field.Index.ANALYZED));
        dc.setCompressed(true);
        r = dc.getRecord(idxDoc);
        assertNotNull(r.get("data"));
        assertTrue(r.getString("compressed").equals("true"));
        System.out.println("Size of compressed IDF document with compiled mapper script: " + r.getString("data").length());
    }

}
