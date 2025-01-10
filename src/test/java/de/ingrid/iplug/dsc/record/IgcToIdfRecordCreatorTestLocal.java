/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2025 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.2 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * https://joinup.ec.europa.eu/software/page/eupl
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
import java.util.List;

import junit.framework.TestCase;

import org.springframework.core.io.FileSystemResource;

import de.ingrid.iplug.dsc.record.mapper.CreateIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.IIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.IgcProfileIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.ScriptedIdfMapper;
import de.ingrid.iplug.dsc.record.producer.PlugDescriptionConfiguredDatabaseRecordProducer;
import de.ingrid.utils.ElasticDocument;
import de.ingrid.utils.PlugDescription;
import de.ingrid.utils.dsc.Record;
import de.ingrid.utils.xml.PlugdescriptionSerializer;

public class IgcToIdfRecordCreatorTestLocal extends TestCase {

	// set num threads here !!!
	int numThreads = 10;
	
	DscRecordCreator recordCreator;

    /** Initialize mappers, record producer etc. Only one instance of these classes (like spring beans) */
    public IgcToIdfRecordCreatorTestLocal() throws Exception {
        File plugDescriptionFile = new File("src/test/resources/plugdescription_igc-3.0.0_test.xml");
        PlugDescription pd = new PlugdescriptionSerializer().deSerialize(plugDescriptionFile);

        PlugDescriptionConfiguredDatabaseRecordProducer p = new PlugDescriptionConfiguredDatabaseRecordProducer();
        p.setIndexFieldID("t01_object.id");
        p.configure(pd);

        CreateIdfMapper m1 = new CreateIdfMapper();

        ScriptedIdfMapper m2 = new ScriptedIdfMapper();
        FileSystemResource[] mappingScripts = {
            new FileSystemResource("src/main/resources/mapping/global.js"),
            new FileSystemResource("src/main/resources/mapping/idf_utils.js"),
            new FileSystemResource("src/main/resources/mapping/igc_to_idf.js")
        };
        m2.setMappingScripts(mappingScripts);
        m2.setCompile(true);

        ScriptedIdfMapper mDQ = new ScriptedIdfMapper();
        FileSystemResource[] mappingScriptsDQ = {
            new FileSystemResource("src/main/resources/mapping/global.js"),
            new FileSystemResource("src/main/resources/mapping/idf_utils.js"),
        	new FileSystemResource("src/main/resources/mapping/igc_to_idf_obj_dq.js")
        };
        mDQ.setMappingScripts(mappingScriptsDQ);
        mDQ.setCompile(true);

        IgcProfileIdfMapper m3 = new IgcProfileIdfMapper();
        m3.setSql("SELECT value_string AS igc_profile FROM sys_generic_key WHERE key_name='profileXML'");

        List<IIdfMapper> mList = new ArrayList<IIdfMapper>();
        mList.add(m1);
        mList.add(m2);
        mList.add(mDQ);
        mList.add(m3);

        recordCreator = new DscRecordCreator();
        recordCreator.setRecordProducer(p);
        recordCreator.setRecord2IdfMapperList(mList);
    }

    public void testDscRecordCreatorMultithreaded() throws Exception {
		// all threads
		TestDscRecordCreatorThread[] threads = new TestDscRecordCreatorThread[numThreads];

		// initialize
		for (int i=0; i<numThreads; i++) {
			threads[i] = new TestDscRecordCreatorThread(i+1);
		}
		// fire
		for (int i=0; i<numThreads; i++) {
            System.out.println("!!! Start thread " + (i+1));
			threads[i].start();
		}

		// wait till all threads are finished
		boolean threadsFinished = false;
		while (!threadsFinished) {
			threadsFinished = true;
			for (int i=0; i<numThreads; i++) {
				if (threads[i].isRunning()) {
					threadsFinished = false;
					Thread.sleep(500);
					break;
                } else if (threads[i].getException() != null) {
                    throw new RuntimeException( "Thread " + threads[i] + " threw exception: ", threads[i].getException() );
                }
			}
		}
    }

    private void doTestDscRecordCreator() throws Exception {
        String[] t01ObjectIds = new String[] {
        		"6667",		// class 0 = Organisationseinheit/Fachaufgabe
        		"3776",		// class 1 = Geo-Information/Karte -> coupled mit Dienst ID 7897096
//                "3776",     // class 1 = Geo-Information/Karte, "Coupled Data" !!! (BUT t011_obj_serv_op_connpoint HAS TO BE CONNECTED IN DB MANUALLY !? missing !?)
        		"3778",		// class 1 = Geo-Information/Karte -> t0114_env_category, t0114_env_topic -> gmd:descriptiveKeywords + object_data_quality DQ !!!
        		"6672",		// class 1 = Geo-Information/Karte, mit t011_obj_geo_symc + object_reference.special_ref 3555
        		"6146",		// class 1 = Geo-Information/Karte, mit t011_obj_geo.keyc_incl_w_dataset + t011_obj_geo_supplinfo + DQ
        		"5388",		// class 1 = Geo-Information/Karte, mit t011_obj_geo.keyc_incl_w_dataset + object_reference.special_ref 3535 + DQ
        		"5933",		// class 1 = Geo-Information/Karte, mit multiple t012_obj_adr associations + DQ
        		"3787",		// class 1 = Geo-Information/Karte, t012_obj_adr.type = 5 -> gmd:distributorContact + DQ
        		"3919",		// class 2 = Dokument/Bericht/Literatur + DQ
        		"3918",		// class 2 = Dokument/Bericht/Literatur, object_reference.special_ref -> srv:SV_CouplingType "loose"
        		"7897096",	// class 3 = Geodatendienst, t011_obj_serv gefuellt
        		"8781824",	// class 3 = Geodatendienst, object_reference.special_ref -> srv:SV_CouplingType "tight"
        		"6674",		// class 3 = Geodatendienst, "Coupled Data" !!! (BUT t011_obj_serv_op_connpoint missing ?)
        		"3782",		// class 4 = Vorhaben/Projekt/Programm
        		"3820",		// class 5 = Datensammlung/Datenbank
        		"3832",		// class 5 = Datensammlung/Datenbank, t01_object.time_period, time_interval, time_alle, time_descr -> gmd:MD_MaintenanceInformation
        		"7897095",	// class 6 = Informationssystem/Dienst/Anwendung
        		"6685",		// class 6 = Informationssystem/Dienst/Anwendung
        };

        for (String t01ObjectId : t01ObjectIds) {
            ElasticDocument idxDoc = new ElasticDocument();
            idxDoc.put("t01_object.id", t01ObjectId);
            recordCreator.setCompressed(false);
            Record r = recordCreator.getRecord(idxDoc);
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

    class TestDscRecordCreatorThread extends Thread {
    	private int threadNumber;
    	private boolean isRunning = false;

    	private Exception myException = null;

    	public TestDscRecordCreatorThread(int threadNumber) {
    		this.threadNumber = threadNumber;
    	}

    	public void run() {
    		isRunning = true;
    		long startTime = System.currentTimeMillis();
    		
    		try {
        		doTestDscRecordCreator();    			
    		} catch (Exception ex) {
        		System.out.println("!!!!!!!!!! Thread " + threadNumber + " EXCEPTION: " + ex);
                isRunning = false;
                myException = ex;
                throw new RuntimeException( ex );
    		}

    		long endTime = System.currentTimeMillis();
    		long neededTime = endTime - startTime;
    		System.out.println("\n----------");
    		System.out.println("Thread " + threadNumber + " EXECUTION TIME: " + (neededTime/1000) + " s");

    		isRunning = false;
    	}

    	public void start() {
    		this.isRunning = true;
    		super.start();
    	}

    	public boolean isRunning() {
    		return isRunning;
    	}

        public Exception getException() {
            return myException;
        }

        public String toString() {
            return "THREAD " + threadNumber;
        }
    }
}
