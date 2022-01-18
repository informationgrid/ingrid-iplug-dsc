/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2022 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.1 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * http://ec.europa.eu/idabc/eupl5
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
        IgcProfileIdfMapper m3 = new IgcProfileIdfMapper();
        FileSystemResource[] mappingScripts = {
            new FileSystemResource("src/main/resources/mapping/global.js"),
            new FileSystemResource("src/main/resources/mapping/idf_utils.js"),
        	new FileSystemResource("src/main/resources/mapping/igc_to_idf.js")
        };
        m2.setMappingScripts(mappingScripts);
        m2.setCompile(true);
        m3.setSql("SELECT value_string AS igc_profile FROM sys_generic_key WHERE key_name='profileXML'");

        List<IIdfMapper> mList = new ArrayList<IIdfMapper>();
        mList.add(m1);
        mList.add(m2);
        mList.add(m3);

        recordCreator = new DscRecordCreator();
        recordCreator.setRecordProducer(p);
        recordCreator.setRecord2IdfMapperList(mList);
        
        
        ElasticDocument idxDoc = new ElasticDocument();
        idxDoc.put("t01_object.id", "3874");
        recordCreator.setCompressed(false);
        Record r = recordCreator.getRecord(idxDoc);
        assertEquals(false, r.get("data").toString().contains("<gmd:name gco:nilReason=\"unknown\"/>"));
        assertEquals(false, r.get("data").toString().contains("<gmd:version gco:nilReason=\"unknown\"/>"));
        assertEquals(false, r.get("data").toString().contains("<gmd:specification gco:nilReason=\"unknown\"/>"));

        idxDoc = new ElasticDocument();
        idxDoc.put("t01_object.id", "7307272");
        recordCreator.setCompressed(false);
        r = recordCreator.getRecord(idxDoc);
        assertEquals(false, r.get("data").toString().contains("<gmd:name gco:nilReason=\"unknown\"/>"));
        assertEquals(true, r.get("data").toString().contains("<gmd:version gco:nilReason=\"unknown\"/>"));
        assertEquals(true, r.get("data").toString().contains("<gmd:specification gco:nilReason=\"unknown\"/>"));
        
        idxDoc = new ElasticDocument();
        idxDoc.put("t01_object.id", "8323073");
        recordCreator.setCompressed(false);
        r = recordCreator.getRecord(idxDoc);
        assertEquals(false, r.get("data").toString().contains("<gmd:name gco:nilReason=\"unknown\"/>"));
        assertEquals(false, r.get("data").toString().contains("<gmd:version gco:nilReason=\"unknown\"/>"));
        assertEquals(true, r.get("data").toString().contains("<gmd:specification gco:nilReason=\"unknown\"/>"));
        
    }

    
}
