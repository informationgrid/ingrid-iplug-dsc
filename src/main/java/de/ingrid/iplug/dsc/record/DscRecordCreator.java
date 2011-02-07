/**
 * 
 */
package de.ingrid.iplug.dsc.record;

import java.util.List;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.apache.lucene.document.Document;

import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.iplug.dsc.record.mapper.IIdfMapper;
import de.ingrid.iplug.dsc.record.producer.IRecordProducer;
import de.ingrid.utils.dsc.Record;
import de.ingrid.utils.xml.XMLUtils;


/**
 * @author joachim
 *
 */
public class DscRecordCreator {
    
    private IRecordProducer recordProducer = null;

    private List<IIdfMapper> record2IdfMapperList = null;

    public Record getRecord(Document idxDoc) {
        try {
            recordProducer.openDatasource();
            SourceRecord sourceRecord = recordProducer.getRecord(idxDoc);
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            DocumentBuilder docBuilder = dbf.newDocumentBuilder();
            org.w3c.dom.Document idfDoc = docBuilder.newDocument();
            for (IIdfMapper record2IdfMapper : record2IdfMapperList) {
                record2IdfMapper.map(sourceRecord, idfDoc);
            }
            Record record = new Record();
            record.put("data", XMLUtils.toString(idfDoc));
        } catch (Exception e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } finally {
            recordProducer.closeDatasource();
        }
        
        return null;
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
    
    
    

}
