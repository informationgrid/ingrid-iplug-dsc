/**
 * 
 */
package de.ingrid.iplug.dsc.index;

import java.util.List;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.lucene.document.Document;

import de.ingrid.admin.object.IDocumentProducer;
import de.ingrid.iplug.dsc.index.mapper.IRecordMapper;
import de.ingrid.iplug.dsc.index.recordsetproducer.IRecordSetProducer;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.utils.PlugDescription;

/**
 * @author joachim
 * 
 */
public class DscDocumentProducer implements IDocumentProducer {

    private IRecordSetProducer recordSetProducer = null;

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
        Document doc = null;
        try {
            SourceRecord record = recordSetProducer.next();
            for (IRecordMapper mapper : recordMapperList) {
                doc = mapper.map(record, doc);
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
        // TODO Auto-generated method stub

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
