/**
 * Copyright (c) 2014 wemove GmbH
 * Licensed under the EUPL V.1.1
 *
 * This Software is provided to You under the terms of the European
 * Union Public License (the "EUPL") version 1.1 as published by the
 * European Union. Any use of this Software, other than as authorized
 * under this License is strictly prohibited (to the extent such use
 * is covered by a right of the copyright holder of this Software).
 *
 * This Software is provided under the License on an "AS IS" basis and
 * without warranties of any kind concerning the Software, including
 * without limitation merchantability, fitness for a particular purpose,
 * absence of defects or errors, accuracy, and non-infringement of
 * intellectual property rights other than copyright. This disclaimer
 * of warranty is an essential part of the License and a condition for
 * the grant of any rights to this Software.
 *
 * For more  details, see <http://joinup.ec.europa.eu/software/page/eupl>
 */
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
