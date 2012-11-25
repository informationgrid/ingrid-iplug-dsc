/**
 * 
 */
package de.ingrid.iplug.dsc.index.mapper;

import org.apache.lucene.document.Document;

import de.ingrid.iplug.dsc.om.SourceRecord;

/**
 * Interface for all "source record to lucene document mapper" classes.
 * Document mapper have knowledge of the underlying datasource and how to
 * retrieve a dataset from the datasource based on a record from a
 * IRecordSetProducer and map the dataset to a LuceneDocument.
 * 
 * @author joachim@wemove.com
 * 
 */
public interface IRecordMapper {

    /**
     * Maps a source record into a lucene document. The content of the source
     * record may vary. It is up to the implementing class to interpret the
     * source record and throw exceptions, if the record does not comply with
     * the needs of the mapper.
     * 
     * @param record
     * @param doc
     * @return
     */
    void map(SourceRecord record, Document doc) throws Exception;

}
