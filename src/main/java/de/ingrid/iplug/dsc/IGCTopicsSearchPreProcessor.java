/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2018 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.1 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * http://ec.europa.eu/idabc/eupl5
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * **************************************************#
 */
package de.ingrid.iplug.dsc;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Service;

import de.ingrid.utils.processor.IPreProcessor;
import de.ingrid.utils.query.FieldQuery;
import de.ingrid.utils.query.IngridQuery;

/**
 * Extends/changes incoming InGrid Query so search for objects in "Environment Topics" (Umweltthemen) works !
 */
@Service
public class IGCTopicsSearchPreProcessor implements IPreProcessor {

    private static final Logger LOG = Logger.getLogger(IGCTopicsSearchPreProcessor.class);

    // query fields / values
    public final static String QVALUE_DATATYPE_TOPICS = "topics";
//    public final static String QFIELD_TOPIC = "topic";
//    public final static String QFIELD_FUNCT_CATEGORY = "funct_category";
    
    // index fields / values
    final static String IDX_VALUE_YES = "y";
    final static String IDX_FIELD_IS_TOPICS = "t01_object.is_catalog_data";
//    final static String IDX_FIELD_TOPIC_ID = "t0114_env_topic.topic_key";
//    final static String IDX_FIELD_FUNCT_CATEGORY_ID = "t0114_env_category.cat_key";


    @Override
    public void process(IngridQuery query) throws Exception {

        if (LOG.isDebugEnabled()) {
            LOG.debug("pre process start: " + query);
        }

    	// map "datatype:topics" to "t01_object.is_catalog_data:y"
    	// ---------------------------

        for (FieldQuery datatype : query.getDataTypes()) {
            if (datatype.containsValue(QVALUE_DATATYPE_TOPICS)) {
				query.addField(new FieldQuery(true, false, IDX_FIELD_IS_TOPICS, IDX_VALUE_YES));
            }
        }
/*
// NOT NECESSARY ANYMORE, NOW ALSO MAPPED CORRECTLY TO topic / funct_category IN MAPPING SCRIPT !

    	// map "topic:???" to "t0114_env_topic.topic_key:??"
    	// map "funct_category:???" to "t0114_env_category.cat_key:??"
    	// ---------------------------

        // process "normal" FIELD QUERIES
        // may be entered in normal InGrid search
    	for (FieldQuery fq : query.getFields()) {
    		processFieldQuery(fq);
    	}

        // process fields encapsulated in CLAUSE QUERIES
        // topic and category fields are encapsulated in clause query when queried via "Umweltthemen"
        // we check all clause queries and change field queries accordingly !
        for (ClauseQuery cq : query.getClauses()) {
        	for (FieldQuery fq : cq.getFields()) {
        		if (!processFieldQuery(fq)) {
            		// clause not relevant, skip this clause
            		break;
        		}
        	}
        }
*/
        if (LOG.isDebugEnabled()) {
            LOG.debug("pre process finished: " + query);
        }
    }

    /**
     * Substitute Field name and value for catalog search.
     * @param fq the Field Query to check
     * @return true=was substituted, false=no change, field not relevant for catalog search
     */
/*
    private boolean processFieldQuery(FieldQuery fq) {
    	boolean changed = false;

    	if (fq.getFieldName().equalsIgnoreCase(QFIELD_TOPIC)) {
    		String newValue = UtilsUDKCodeLists.getCodeListDomainId(UtilsUDKCodeLists.SYSLIST_ID_ENV_TOPICS,
        			fq.getFieldValue(), TransformationUtils.LANG_ID_INGRID_QUERY_VALUE);

    		if (LOG.isDebugEnabled()) {
                LOG.debug("replace " + QFIELD_TOPIC + ":" + fq.getFieldValue() + " with "
                    + IDX_FIELD_TOPIC_ID + ":" + newValue);                	
            }

            fq.setFieldName(IDX_FIELD_TOPIC_ID);
    		fq.setFieldValue(newValue);
    		changed = true;

    	} else if (fq.getFieldName().equalsIgnoreCase(QFIELD_FUNCT_CATEGORY)) {
    		String newValue = UtilsUDKCodeLists.getCodeListDomainId(UtilsUDKCodeLists.SYSLIST_ID_ENV_FUNCT_CATEGORY,
        			fq.getFieldValue(), TransformationUtils.LANG_ID_INGRID_QUERY_VALUE);
    		
    		if (LOG.isDebugEnabled()) {
                LOG.debug("replace " + QFIELD_FUNCT_CATEGORY + ":" + fq.getFieldValue() + " with "
                    + IDX_FIELD_FUNCT_CATEGORY_ID + ":" + newValue);                	
            }

    		fq.setFieldName(IDX_FIELD_FUNCT_CATEGORY_ID);
    		fq.setFieldValue(newValue);
    		changed = true;        		
    	}
    	
    	return changed;
    }
*/
}
