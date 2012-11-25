/*
 * Copyright (c) 2006 wemove digital solutions. All rights reserved.
 */

package de.ingrid.iplug.dsc;

import java.io.IOException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.lucene.document.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import de.ingrid.admin.search.IngridIndexSearcher;
import de.ingrid.iplug.HeartBeatPlug;
import de.ingrid.iplug.IPlugdescriptionFieldFilter;
import de.ingrid.iplug.PlugDescriptionFieldFilters;
import de.ingrid.iplug.dsc.record.DscRecordCreator;
import de.ingrid.utils.IRecordLoader;
import de.ingrid.utils.IngridHit;
import de.ingrid.utils.IngridHitDetail;
import de.ingrid.utils.IngridHits;
import de.ingrid.utils.dsc.Record;
import de.ingrid.utils.metadata.IMetadataInjector;
import de.ingrid.utils.processor.IPostProcessor;
import de.ingrid.utils.processor.IPreProcessor;
import de.ingrid.utils.query.IngridQuery;

/**
 * This iPlug connects to the iBus delivers search results based on a index.
 * 
 * @author joachim@wemove.com
 * 
 */
@Service
public class DscSearchPlug extends HeartBeatPlug implements IRecordLoader {

    /**
     * The logging object
     */
    private static Log log = LogFactory.getLog(DscSearchPlug.class);

    private DscRecordCreator dscRecordProducer = null;
    
    private final IngridIndexSearcher _indexSearcher;    
    
    @Autowired
    public DscSearchPlug(final IngridIndexSearcher indexSearcher,
            IPlugdescriptionFieldFilter[] fieldFilters,
            IMetadataInjector[] injector, IPreProcessor[] preProcessors,
            IPostProcessor[] postProcessors) throws IOException {
        super(60000, new PlugDescriptionFieldFilters(fieldFilters), injector,
                preProcessors, postProcessors);
        _indexSearcher = indexSearcher;
    }


    /* (non-Javadoc)
     * @see de.ingrid.utils.ISearcher#search(de.ingrid.utils.query.IngridQuery, int, int)
     */
    @Override
    public final IngridHits search(final IngridQuery query, final int start,
            final int length) throws Exception {
        
        if (log.isDebugEnabled()) {
            log.debug("Incoming query: " + query.toString() + ", start="
                    + start + ", length=" + length);
        }
        preProcess(query);
        return _indexSearcher.search(query, start, length);
    }

    /* (non-Javadoc)
     * @see de.ingrid.utils.IRecordLoader#getRecord(de.ingrid.utils.IngridHit)
     */
    @Override
    public Record getRecord(IngridHit hit) throws Exception {
        Document document = _indexSearcher.doc(hit.getDocumentId());
        return dscRecordProducer.getRecord(document);
    }

    /* (non-Javadoc)
     * @see de.ingrid.iplug.HeartBeatPlug#close()
     */
    @Override
    public void close() throws Exception {
        _indexSearcher.close();
    }

    /* (non-Javadoc)
     * @see de.ingrid.iplug.HeartBeatPlug#close()
     */
    @Override
    public IngridHitDetail getDetail(IngridHit hit, IngridQuery query,
            String[] fields) throws Exception {
        final IngridHitDetail detail = _indexSearcher.getDetail(hit, query,
                fields);
        return detail;
    }

    /* (non-Javadoc)
     * @see de.ingrid.iplug.HeartBeatPlug#close()
     */
    @Override
    public IngridHitDetail[] getDetails(IngridHit[] hits, IngridQuery query,
            String[] fields) throws Exception {
        final IngridHitDetail[] details = _indexSearcher.getDetails(hits,
                query, fields);
        return details;
    }
    
    public DscRecordCreator getDscRecordProducer() {
        return dscRecordProducer;
    }

    public void setDscRecordProducer(DscRecordCreator dscRecordProducer) {
        this.dscRecordProducer = dscRecordProducer;
    }
    
}
