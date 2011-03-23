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

public class Igc_3_0_0_To_Idf_1_0_RecordCreatorTestLocal extends TestCase {

    public void testDscRecordCreator() throws Exception {
        File plugDescriptionFile = new File(
        	"src/test/resources/plugdescription_igc-3.0.0_test.xml");
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

        String[] t01ObjectIds = new String[] {
        		"6667",		// class 0 = Organisationseinheit/Fachaufgabe
        		"3778",		// class 1 = Geo-Information/Karte -> t0114_env_category, t0114_env_topic -> gmd:descriptiveKeywords
        		"6672",		// class 1 = Geo-Information/Karte, mit t011_obj_geo_symc + object_reference.special_ref 3555
        		"6146",		// class 1 = Geo-Information/Karte, mit t011_obj_geo.keyc_incl_w_dataset + t011_obj_geo_supplinfo
        		"5388",		// class 1 = Geo-Information/Karte, mit t011_obj_geo.keyc_incl_w_dataset + object_reference.special_ref 3535
        		"5933",		// class 1 = Geo-Information/Karte, mit multiple t012_obj_adr associations
        		"3787",		// class 1 = Geo-Information/Karte, t012_obj_adr.type = 5 -> gmd:distributorContact
        		"3919",		// class 2 = Dokument/Bericht/Literatur
        		"3918",		// class 2 = Dokument/Bericht/Literatur, object_reference.special_ref -> srv:SV_CouplingType "loose"
        		"7897096",	// class 3 = Geodatendienst, t011_obj_serv gefuellt
        		"8781824",	// class 3 = Geodatendienst, object_reference.special_ref -> srv:SV_CouplingType "tight"
        		"3782",		// class 4 = Vorhaben/Projekt/Programm
        		"3820",		// class 5 = Datensammlung/Datenbank
        		"3832",		// class 5 = Datensammlung/Datenbank, t01_object.time_period, time_interval, time_alle, time_descr -> gmd:MD_MaintenanceInformation
        		"7897095",	// class 6 = Informationssystem/Dienst/Anwendung
        		"6685",		// class 6 = Informationssystem/Dienst/Anwendung
        };

        for (String t01ObjectId : t01ObjectIds) {
            Document idxDoc = new Document();
            idxDoc.add(new Field("t01_object.id", t01ObjectId, Field.Store.YES, Field.Index.ANALYZED));
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
