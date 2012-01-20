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

public class IgcToIdfRecordCreatorAddressTestLocal extends TestCase {

    public void testDscRecordCreator() throws Exception {
        File plugDescriptionFile = new File(
        	"src/test/resources/plugdescription_igc-3.0.0_test.xml");
        PlugDescription pd = new PlugdescriptionSerializer()
        	.deSerialize(plugDescriptionFile);

        PlugDescriptionConfiguredDatabaseRecordProducer p = new PlugDescriptionConfiguredDatabaseRecordProducer();
        p.setIndexFieldID("t02_address.id");
        p.configure(pd);

        CreateIdfMapper m1 = new CreateIdfMapper();
        ScriptedIdfMapper m2 = new ScriptedIdfMapper();
        m2.setMappingScript(new FileSystemResource("src/main/resources/mapping/igc-3.0.0_to_idf_address.js"));
        m2.setCompile(true);

        List<IIdfMapper> mList = new ArrayList<IIdfMapper>();
        mList.add(m1);
        mList.add(m2);

        DscRecordCreator dc = new DscRecordCreator();
        dc.setRecordProducer(p);
        dc.setRecord2IdfMapperList(mList);

        String[] t02AddressIds = new String[] {
        		"7422",		// Institution(0) TOP NODE
        		"7763",		// Institution(0) with parent
        		"7506",		// Einheit(1)
        		"7421",		// Person(2)
        		"7420",		// Freie Adresse(3) TOP NODE
        };

        for (String t02AddressId : t02AddressIds) {
            Document idxDoc = new Document();
            idxDoc.add(new Field("t02_address.id", t02AddressId, Field.Store.YES, Field.Index.ANALYZED));
            dc.setCompressed(false);
            Record r = dc.getRecord(idxDoc);
            assertNotNull(r.get("data"));
            assertTrue(r.getString("compressed").equals("false"));
            System.out.println("Size of uncompressed IDF document: " + r.getString("data").length());
/*
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
*/
        }
    }
}
