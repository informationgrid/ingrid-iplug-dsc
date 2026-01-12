/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2026 wemove digital solutions GmbH
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
package de.ingrid.iplug.dsc.index;

import de.ingrid.admin.Config;
import de.ingrid.iplug.dsc.index.mapper.IRecordMapper;
import de.ingrid.iplug.dsc.index.mapper.ScriptedDocumentMapper;
import de.ingrid.iplug.dsc.index.producer.PlugDescriptionConfiguredDatabaseRecordSetProducer;
import de.ingrid.iplug.dsc.utils.IgcDbUnitEnabledTestCase;
import de.ingrid.utils.ElasticDocument;
import de.ingrid.utils.PlugDescription;
import de.ingrid.utils.statusprovider.StatusProviderService;
import de.ingrid.utils.xml.PlugdescriptionSerializer;
import org.mockito.MockitoAnnotations;
import org.springframework.core.io.ClassPathResource;

import java.io.File;
import java.util.*;

public class ScriptedDatabaseDocumentProducerTest extends IgcDbUnitEnabledTestCase {

    StatusProviderService statusProviderService;

    public ScriptedDatabaseDocumentProducerTest(String name) throws Exception {
        super(name);
        MockitoAnnotations.openMocks(this);
        setDatasourceFileName("src/test/resources/dataset.xml");
    }

    public void testScriptedDatabaseDocumentProducer() throws Exception {
        this.setDatasourceFileName("src/test/resources/dataset.xml");

        File plugDescriptionFile = new File(
                "src/test/resources/plugdescription_db_test.xml");
        PlugDescription pd = new PlugdescriptionSerializer()
                .deSerialize(plugDescriptionFile);

        PlugDescriptionConfiguredDatabaseRecordSetProducer p = new PlugDescriptionConfiguredDatabaseRecordSetProducer();
        p.setStatusProviderService(statusProviderService);
        p.setRecordSql("SELECT * FROM TEST_TABLE");
        p.configure(pd);

        ScriptedDocumentMapper m = new ScriptedDocumentMapper();
        ClassPathResource[] mappingScripts = {
                new ClassPathResource("scripts/record2index_database_test.js")
        };
        m.setMappingScripts(mappingScripts);
        m.setCompile(false);

        List<IRecordMapper> mList = new ArrayList<>();
        mList.add(m);

        DscDocumentProducer dp = new DscDocumentProducer();
        dp.setConfig(new Config());
        dp.setRecordSetProducer(p);
        dp.setRecordMapperList(mList);

        if (dp.hasNext()) {
            while (dp.hasNext()) {
                Map<String, Object> doc = dp.next();
                assertNotNull(doc);

                Collection<String> keys = Arrays.asList("ID", "COL1", "COL2");
                assertTrue(doc.keySet().containsAll(keys));
            }
        } else {
            fail("No document produced");
        }
    }

    public void testScriptedDatabaseDocumentByIdProducer() throws Exception {
        this.setDatasourceFileName("src/test/resources/dataset.xml");

        File plugDescriptionFile = new File(
                "src/test/resources/plugdescription_db_test.xml");
        PlugDescription pd = new PlugdescriptionSerializer()
                .deSerialize(plugDescriptionFile);

        PlugDescriptionConfiguredDatabaseRecordSetProducer p = new PlugDescriptionConfiguredDatabaseRecordSetProducer();
        p.setStatusProviderService(statusProviderService);
        p.setRecordSql("SELECT * FROM TEST_TABLE");
        p.setRecordByIdSql("SELECT ID FROM TEST_TABLE WHERE ID=?");
        p.configure(pd);

        ScriptedDocumentMapper m = new ScriptedDocumentMapper();
        ClassPathResource[] mappingScripts = {
                new ClassPathResource("scripts/record2index_database_test.js")
        };
        m.setMappingScripts(mappingScripts);
        m.setCompile(false);

        List<IRecordMapper> mList = new ArrayList<>();
        mList.add(m);

        DscDocumentProducer dp = new DscDocumentProducer();
        dp.setConfig(new Config());
        dp.setRecordSetProducer(p);
        dp.setRecordMapperList(mList);

        ElasticDocument doc = dp.getById("3");
        assertNotNull(doc);
        Collection<String> keys = Arrays.asList("ID", "COL1", "COL2");
        assertTrue(doc.keySet().containsAll(keys));
        assertEquals("3", (String) doc.get("ID"));

        doc = dp.getById("12334");
        assertNull(doc);

        doc = dp.getById(null);
        assertNull(doc);

    }

}
