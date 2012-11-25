/**
 * 
 */
package de.ingrid.iplug.dsc.record;

import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.zip.GZIPOutputStream;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.apache.log4j.Logger;
import org.apache.lucene.document.Document;

import de.ingrid.iplug.dsc.om.IClosableDataSource;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.iplug.dsc.record.mapper.IIdfMapper;
import de.ingrid.iplug.dsc.record.producer.IRecordProducer;
import de.ingrid.utils.dsc.Record;
import de.ingrid.utils.xml.XMLUtils;

/**
 * This class manages to get a {@link Record} from a data source based on data
 * from a lucene document.
 * <p/>
 * The Class can be configured with a data source specific record producer
 * implementing the {@link IRecordProducer} interface and a list of IDF (InGrid
 * Detaildata Format) mapper, implementing the {@link IIdfMapper} interface.
 * <p/>
 * The IDF data can optionally be compressed using a {@link GZIPOutputStream} by
 * setting the property {@link compressed} to true.
 * 
 * @author joachim@wemove.com
 * 
 */
public class DscRecordCreator {

    protected static final Logger log = Logger.getLogger(DscRecordCreator.class);

    private IRecordProducer recordProducer = null;

    private List<IIdfMapper> record2IdfMapperList = null;

    private boolean compressed = false;

    /**
     * Retrieves a record with an IDF document in property "data". The property
     * "compressed" is set to "true" if the IDF document is compressed, "false"
     * if the IDF document is not compressed.
     * 
     * @param idxDoc
     * @return
     * @throws Exception
     */
    public Record getRecord(Document idxDoc) throws Exception {
        IClosableDataSource datasource = null;
        try {
            datasource = recordProducer.openDatasource();
            SourceRecord sourceRecord = recordProducer.getRecord(idxDoc, datasource);
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            DocumentBuilder docBuilder = dbf.newDocumentBuilder();
            org.w3c.dom.Document idfDoc = docBuilder.newDocument();
            for (IIdfMapper record2IdfMapper : record2IdfMapperList) {
                long start = 0;
                if (log.isDebugEnabled()) {
                    start = System.currentTimeMillis();
                }
                record2IdfMapper.map(sourceRecord, idfDoc);
                if (log.isDebugEnabled()) {
                    log.debug("Mapping of source record with " + record2IdfMapper + " took: "
                            + (System.currentTimeMillis() - start) + " ms.");
                }
            }
            Record record = new Record();
            String data = XMLUtils.toString(idfDoc);
            if (log.isDebugEnabled()) {
                log.debug("Resulting IDF document:\n" + data);
            }
            if (compressed) {
                ByteArrayOutputStream bos = new ByteArrayOutputStream();
                BufferedOutputStream bufos = new BufferedOutputStream(new GZIPOutputStream(bos));
                bufos.write(data.getBytes());
                bufos.close();
                data = new String(bos.toByteArray());
                bos.close();
                record.put("compressed", "true");
            } else {
                record.put("compressed", "false");
            }
            record.put("data", data);
            return record;
        } catch (Exception e) {
            log.error("Error creating IDF document.", e);
            throw e;
        } finally {
            if (datasource != null) {
                datasource.close();
            }
        }
    }

    public IRecordProducer getRecordProducer() {
        return recordProducer;
    }

    public void setRecordProducer(IRecordProducer recordProducer) {
        this.recordProducer = recordProducer;
    }

    public List<IIdfMapper> getRecord2IdfMapperList() {
        return record2IdfMapperList;
    }

    public void setRecord2IdfMapperList(List<IIdfMapper> record2IdfMapperList) {
        this.record2IdfMapperList = record2IdfMapperList;
    }

    public boolean isCompressed() {
        return compressed;
    }

    public void setCompressed(boolean compressed) {
        this.compressed = compressed;
    }

}
