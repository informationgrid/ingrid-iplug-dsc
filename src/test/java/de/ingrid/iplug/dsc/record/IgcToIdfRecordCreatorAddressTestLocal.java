/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2021 wemove digital solutions GmbH
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
import de.ingrid.iplug.dsc.record.mapper.ScriptedIdfMapper;
import de.ingrid.iplug.dsc.record.producer.PlugDescriptionConfiguredDatabaseRecordProducer;
import de.ingrid.utils.ElasticDocument;
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
        FileSystemResource[] mappingScripts = {
            new FileSystemResource("src/main/resources/mapping/global.js"),
        	new FileSystemResource("src/main/resources/mapping/igc_to_idf_address.js")
        };
        m2.setMappingScripts(mappingScripts);
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
            ElasticDocument idxDoc = new ElasticDocument();
            idxDoc.put("t02_address.id", t02AddressId);
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
