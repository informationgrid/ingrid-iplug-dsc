package de.ingrid.iplug.dsc.index;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;

import de.ingrid.iplug.dsc.record.DscRecordCreator;
import de.ingrid.iplug.dsc.record.mapper.CreateIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.IIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.SimpleDatabaseIDFMapper;
import de.ingrid.iplug.dsc.record.producer.PlugDescriptionConfiguredDatabaseRecordProducer;
import de.ingrid.utils.PlugDescription;
import de.ingrid.utils.dsc.Record;
import de.ingrid.utils.xml.PlugdescriptionSerializer;

public class DscRecordCreatorTest extends IgcDbUnitEnabledTestCase {

    public DscRecordCreatorTest(String name) {
        super(name);
        setDatasourceFileName("src/test/resources/dataset.xml");
    }

    public void testDscRecordCreator() throws Exception {
        this.setDatasourceFileName("src/test/resources/dataset.xml");

        File plugDescriptionFile = new File(
                "src/test/resources/plugdescription_db_test.xml");
        PlugDescription pd = new PlugdescriptionSerializer()
                .deSerialize(plugDescriptionFile);

        PlugDescriptionConfiguredDatabaseRecordProducer p = new PlugDescriptionConfiguredDatabaseRecordProducer();
        p.configure(pd);

        CreateIdfMapper m1 = new CreateIdfMapper();
        SimpleDatabaseIDFMapper m2 = new SimpleDatabaseIDFMapper();
        m2.setSql("SELECT * FROM TEST_TABLE WHERE id=?");

        List<IIdfMapper> mList = new ArrayList<IIdfMapper>();
        mList.add(m1);
        mList.add(m2);
        
        DscRecordCreator dc = new DscRecordCreator();
        dc.setRecordProducer(p);
        dc.setRecord2IdfMapperList(mList);

        Document idxDoc = new Document();
        idxDoc.add(new Field("ID", "1", Field.Store.YES,
                        Field.Index.ANALYZED));
        Record r = dc.getRecord(idxDoc);
        assertNotNull(r.get("data"));
        assertTrue(r.getString("compressed").equals("false"));
        System.out.println("Size of uncompressed IDF document: " + r.getString("data").length());
        
        idxDoc = new Document();
        idxDoc.add(new Field("ID", "1", Field.Store.YES,
                        Field.Index.ANALYZED));
        dc.setCompressed(true);
        Record rCompressed = dc.getRecord(idxDoc);
        assertNotNull(rCompressed.get("data"));
        assertTrue(rCompressed.getString("compressed").equals("true"));
        System.out.println("Size of compressed IDF document: " + rCompressed.getString("data").length());
        
    }

}
