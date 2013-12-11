package de.ingrid.iplug.dsc.index;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import junit.framework.TestCase;

import org.apache.lucene.document.Document;
import org.springframework.core.io.FileSystemResource;

import de.ingrid.admin.search.GermanStemmer;
import de.ingrid.iplug.dsc.index.mapper.IRecordMapper;
import de.ingrid.iplug.dsc.index.mapper.ScriptedDocumentMapper;
import de.ingrid.iplug.dsc.index.producer.PlugDescriptionConfiguredDatabaseRecordSetProducer;
import de.ingrid.utils.PlugDescription;
import de.ingrid.utils.xml.PlugdescriptionSerializer;

public class IgcDocumentProducerAddressTestLocal extends TestCase {

    public void testScriptedDatabaseDocumentProducer() throws Exception {
        File plugDescriptionFile = new File(
                "src/test/resources/plugdescription_igc-3.0.0_test.xml");
        PlugDescription pd = new PlugdescriptionSerializer()
                .deSerialize(plugDescriptionFile);

        PlugDescriptionConfiguredDatabaseRecordSetProducer p = new PlugDescriptionConfiguredDatabaseRecordSetProducer();
        String sql = "SELECT DISTINCT id FROM t02_address WHERE work_state='V'"
        		+ " AND id=7422"	// Institution(0) TOP NODE
        		+ " OR id=7763"		// Institution(0) with parent
        		+ " OR id=7506"		// Einheit(1)
        		+ " OR id=7421"		// Person(2)
        		+ " OR id=7420"		// Freie Adresse(3) TOP NODE
        		;
        p.setRecordSql(sql);
        p.configure(pd);

        ScriptedDocumentMapper m = new ScriptedDocumentMapper();
        FileSystemResource[] mappingScripts = {
            new FileSystemResource("src/main/resources/mapping/global.js"),
        	new FileSystemResource("src/main/resources/mapping/igc_to_lucene_address.js")
        };
        m.setMappingScripts(mappingScripts);
        m.setCompile(true);
        m.setDefaultStemmer(new GermanStemmer());

        List<IRecordMapper> mList = new ArrayList<IRecordMapper>();
        mList.add(m);
        
        DscDocumentProducer dp = new DscDocumentProducer();
        dp.setRecordSetProducer(p);
        dp.setRecordMapperList(mList);

        if (dp.hasNext()) {
            while (dp.hasNext()) {
                Document doc = dp.next();
                assertNotNull(doc);
            }
        } else {
            fail("No document produced");
        }
    }
}
