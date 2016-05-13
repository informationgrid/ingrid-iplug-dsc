/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2016 wemove digital solutions GmbH
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
package de.ingrid.iplug.dsc.index;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import junit.framework.TestCase;

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
        		+ " AND id=3778 " // GEO-INFORMATION/KARTE(1)
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
        FileSystemResource[] mappingScripts = {
                new FileSystemResource("src/main/resources/mapping/global.js"),
        		new FileSystemResource("src/main/resources/mapping/igc_to_lucene.js")
        };
        m.setMappingScripts(mappingScripts);
        m.setCompile(true);
        //m.setDefaultStemmer(new GermanStemmer());

        List<IRecordMapper> mList = new ArrayList<IRecordMapper>();
        mList.add(m);
        
        DscDocumentProducer dp = new DscDocumentProducer();
        dp.setRecordSetProducer(p);
        dp.setRecordMapperList(mList);

        if (dp.hasNext()) {
            while (dp.hasNext()) {
                Map<String, Object> doc = dp.next();
                assertNotNull(doc);
            }
        } else {
            fail("No document produced");
        }
    }
}
