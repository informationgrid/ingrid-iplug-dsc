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
import de.ingrid.iplug.dsc.record.mapper.IgcProfileIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.ScriptedIdfMapper;
import de.ingrid.iplug.dsc.record.producer.PlugDescriptionConfiguredDatabaseRecordProducer;
import de.ingrid.utils.PlugDescription;
import de.ingrid.utils.dsc.Record;
import de.ingrid.utils.xml.PlugdescriptionSerializer;

public class IgcToIdfMappingTestLocal extends TestCase {

	// set num threads here !!!
	int numThreads = 10;
	
	DscRecordCreator recordCreator;

    /** Initialize mappers, record producer etc. Only one instance of these classes (like spring beans) */
	public void testIgcToIdfMappingTestLocal() throws Exception {
        File plugDescriptionFile = new File("src/test/resources/plugdescription_igc-3.0.0_test.xml");
        PlugDescription pd = new PlugdescriptionSerializer().deSerialize(plugDescriptionFile);

        PlugDescriptionConfiguredDatabaseRecordProducer p = new PlugDescriptionConfiguredDatabaseRecordProducer();
        p.setIndexFieldID("t01_object.id");
        p.configure(pd);

        CreateIdfMapper m1 = new CreateIdfMapper();
        ScriptedIdfMapper m2 = new ScriptedIdfMapper();
        m2.setMappingScript(new FileSystemResource("src/main/resources/mapping/igc_to_idf.js"));
        m2.setCompile(true);

        List<IIdfMapper> mList = new ArrayList<IIdfMapper>();
        mList.add(m1);
        mList.add(m2);

        recordCreator = new DscRecordCreator();
        recordCreator.setRecordProducer(p);
        recordCreator.setRecord2IdfMapperList(mList);
        
        
        Document idxDoc = new Document();
        idxDoc.add(new Field("t01_object.id", "3874", Field.Store.YES, Field.Index.ANALYZED));
        recordCreator.setCompressed(false);
        Record r = recordCreator.getRecord(idxDoc);
        assertEquals(false, r.get("data").toString().contains("<gmd:name gco:nilReason=\"unknown\"/>"));
        assertEquals(false, r.get("data").toString().contains("<gmd:version gco:nilReason=\"unknown\"/>"));
        assertEquals(false, r.get("data").toString().contains("<gmd:specification gco:nilReason=\"unknown\"/>"));

        idxDoc = new Document();
        idxDoc.add(new Field("t01_object.id", "7307272", Field.Store.YES, Field.Index.ANALYZED));
        recordCreator.setCompressed(false);
        r = recordCreator.getRecord(idxDoc);
        assertEquals(false, r.get("data").toString().contains("<gmd:name gco:nilReason=\"unknown\"/>"));
        assertEquals(true, r.get("data").toString().contains("<gmd:version gco:nilReason=\"unknown\"/>"));
        assertEquals(true, r.get("data").toString().contains("<gmd:specification gco:nilReason=\"unknown\"/>"));
        
        idxDoc = new Document();
        idxDoc.add(new Field("t01_object.id", "8323073", Field.Store.YES, Field.Index.ANALYZED));
        recordCreator.setCompressed(false);
        r = recordCreator.getRecord(idxDoc);
        assertEquals(false, r.get("data").toString().contains("<gmd:name gco:nilReason=\"unknown\"/>"));
        assertEquals(false, r.get("data").toString().contains("<gmd:version gco:nilReason=\"unknown\"/>"));
        assertEquals(true, r.get("data").toString().contains("<gmd:specification gco:nilReason=\"unknown\"/>"));
        
    }

    
}
