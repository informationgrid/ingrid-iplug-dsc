package de.ingrid.iplug.dsc.index;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import org.apache.lucene.document.Document;

import de.ingrid.iplug.dsc.index.mapper.IRecordMapper;
import de.ingrid.iplug.dsc.index.mapper.SimpleDatabaseRecord2DocumentMapper;
import de.ingrid.iplug.dsc.index.recordsetproducer.PlugDescriptionConfiguredDatabaseRecordSetProducer;
import de.ingrid.utils.PlugDescription;
import de.ingrid.utils.xml.PlugdescriptionSerializer;

public class DscDocumentProducerTest extends IgcDbUnitEnabledTestCase {

    public DscDocumentProducerTest(String name) {
        super(name);
        setDatasourceFileName("src/test/resources/dataset.xml");
    }

    public void testDscDocumentProducer() throws Exception {
        this.setDatasourceFileName("src/test/resources/dataset.xml");

        File plugDescriptionFile = new File(
                "src/test/resources/plugdescription_db_test.xml");
        PlugDescription pd = new PlugdescriptionSerializer()
                .deSerialize(plugDescriptionFile);

        PlugDescriptionConfiguredDatabaseRecordSetProducer p = new PlugDescriptionConfiguredDatabaseRecordSetProducer();
        p.setRecordSql("SELECT * FROM TEST_TABLE");
        p.configure(pd);

        SimpleDatabaseRecord2DocumentMapper m = new SimpleDatabaseRecord2DocumentMapper();
        m.setSql("SELECT * FROM TEST_TABLE WHERE id=?");

        List<IRecordMapper> mList = new ArrayList<IRecordMapper>();
        mList.add(m);
        
        DscDocumentProducer dp = new DscDocumentProducer();
        dp.setRecordSetProducer(p);
        dp.setRecordMapperList(mList);

        if (dp.hasNext()) {
            Document doc = dp.next();
            assertNotNull(doc);
        } else {
            fail("No documnet produced");
        }
    }

}
