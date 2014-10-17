/**
 * 
 */
package de.ingrid.iplug.dsc.index;

import java.util.List;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.lucene.document.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import de.ingrid.admin.object.IDocumentProducer;
import de.ingrid.iplug.dsc.index.mapper.IRecordMapper;
import de.ingrid.iplug.dsc.index.producer.IRecordSetProducer;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.utils.PlugDescription;

/**
 * Implements de.ingrid.admin.object.IDocumentProducer from the base webapp 
 * interface. It is triggered by the base webapp during indexing of a 
 * datasource. The DocumentProducer iterates over all records of the 
 * datasource and maps each record into a LuceneDocument.
 * This producer is configured with a IRecordSetProducer and one or more
 * IRecordMapper. 
 * @author joachim
 */
@Service
public class DscDocumentProducer implements IDocumentProducer {

    @Autowired
    private IRecordSetProducer recordSetProducer = null;

    @Autowired
    private List<IRecordMapper> recordMapperList = null;

    final private static Log log = LogFactory.getLog(DscDocumentProducer.class);
    
    public DscDocumentProducer() {
        log.info("DscDocumentProducer started.");
    }
    
    /*
     * (non-Javadoc)
     * 
     * @see de.ingrid.admin.object.IDocumentProducer#hasNext()
     */
    @Override
    public boolean hasNext() {
        try {
            return recordSetProducer.hasNext();
        } catch (Exception e) {
            log.error("Error obtaining information about a next record. Skip all records.", e);
            return false;
        }
    }

    /*
     * (non-Javadoc)
     * 
     * @see de.ingrid.admin.object.IDocumentProducer#next()
     */
    @Override
    public Document next() {
        Document doc = new Document();
        try {
            SourceRecord record = recordSetProducer.next();
            for (IRecordMapper mapper : recordMapperList) {
                long start = 0;
                if (log.isDebugEnabled()) {
                    start = System.currentTimeMillis();
                }
                mapper.map(record, doc);
                if (log.isDebugEnabled()) {
                    log.debug("Mapping of source record with " + mapper + " took: " + (System.currentTimeMillis() - start) + " ms.");
                }
            }
            return doc;
        } catch (Exception e) {
            log.error("Error obtaining next record.", e);
            return null;
        }
    }

    /*
     * (non-Javadoc)
     * 
     * @see
     * de.ingrid.utils.IConfigurable#configure(de.ingrid.utils.PlugDescription)
     */
    @Override
    public void configure(PlugDescription arg0) {
        log.info("DscDocumentProducer: configuring...");
    }

    public IRecordSetProducer getRecordSetProducer() {
        return recordSetProducer;
    }

    public void setRecordSetProducer(IRecordSetProducer recordProducer) {
        this.recordSetProducer = recordProducer;
    }

    public List<IRecordMapper> getRecordMapperList() {
        return recordMapperList;
    }

    public void setRecordMapperList(List<IRecordMapper> recordMapperList) {
        this.recordMapperList = recordMapperList;
    }

}
