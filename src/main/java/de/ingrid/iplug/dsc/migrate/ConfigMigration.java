/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2016 wemove digital solutions GmbH
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
package de.ingrid.iplug.dsc.migrate;

import de.ingrid.iplug.dsc.Configuration;
import de.ingrid.iplug.dsc.DscSearchPlug;

public class ConfigMigration {
    public static void migrateSpringProfile(String profile) {
        Configuration conf = DscSearchPlug.conf;
        if ("object_internet".equals( profile ) ) {
            
            conf.indexFieldId = "t01_object.id";
            conf.indexMapperSql = "SELECT DISTINCT id FROM t01_object WHERE work_state='V' AND publish_id=1";
            conf.indexMapper = "[ { \"type\": \"indexMapper\", \"compile\": true, \"scripts\": [\"mapping/global.js\", \"mapping/igc_to_lucene.js\"]}, { \"type\": \"indexProfileMapper\", \"sql\": \"SELECT value_string AS igc_profile FROM sys_generic_key WHERE key_name='profileXML'\" }, {\"type\": \"idfProducerIndexMapper\"}]";
            conf.idfMapper = "[ { \"type\": \"createIdfMapper\" }, { \"type\": \"scriptedIdfMapper\", \"compile\": true, \"scripts\": [\"mapping/global.js\", \"mapping/idf_utils.js\", \"mapping/igc_to_idf.js\"] }, { \"type\": \"scriptedIdfMapper\", \"compile\": true, \"scripts\": [\"mapping/global.js\", \"mapping/idf_utils.js\", \"mapping/igc_to_idf_obj_dq.js\"] }, { \"type\": \"scriptedIdfProfileMapper\", \"sql\": \"SELECT value_string AS igc_profile FROM sys_generic_key WHERE key_name='profileXML'\"} ]";
            
        } else if ( "object_intranet".equals( profile )) {
            conf.indexFieldId = "t01_object.id";
            conf.indexMapperSql = "SELECT DISTINCT id FROM t01_object WHERE work_state='V' AND (publish_id=1 OR publish_id=2)";
            conf.indexMapper = "[ { \"type\": \"indexMapper\", \"compile\": true, \"scripts\": [\"mapping/global.js\", \"mapping/igc_to_lucene.js\"]}, { \"type\": \"indexProfileMapper\", \"sql\": \"SELECT value_string AS igc_profile FROM sys_generic_key WHERE key_name='profileXML'\" }, {\"type\": \"idfProducerIndexMapper\"}]";
            conf.idfMapper = "[ { \"type\": \"createIdfMapper\" }, { \"type\": \"scriptedIdfMapper\", \"compile\": true, \"scripts\": [\"mapping/global.js\", \"mapping/idf_utils.js\", \"mapping/igc_to_idf.js\"] }, { \"type\": \"scriptedIdfMapper\", \"compile\": true, \"scripts\": [\"mapping/global.js\", \"mapping/idf_utils.js\", \"mapping/igc_to_idf_obj_dq.js\"] }, { \"type\": \"scriptedIdfProfileMapper\", \"sql\": \"SELECT value_string AS igc_profile FROM sys_generic_key WHERE key_name='profileXML'\"} ]";
            
        } else if ("address_internet".equals( profile ) ) {
            conf.indexFieldId = "t02_address.id";
            conf.indexMapperSql = "SELECT DISTINCT id FROM t02_address WHERE work_state='V' AND publish_id=1";
            conf.indexMapper = "[ { \"type\": \"indexMapper\", \"compile\": true, \"scripts\": [\"mapping/global.js\", \"mapping/igc_to_lucene_address.js\"]}, {\"type\": \"idfProducerIndexMapper\"} ]";
            conf.idfMapper = "[ { \"type\": \"createIdfMapper\" }, { \"type\": \"scriptedIdfMapper\", \"compile\": true, \"scripts\": [\"mapping/global.js\", \"mapping/igc_to_idf_address.js\"] } ]";
            
            
        } else if ( "address_intranet".equals( profile )) {
            conf.indexFieldId = "t02_address.id";
            conf.indexMapperSql = "SELECT DISTINCT id FROM t02_address WHERE work_state='V' AND (publish_id=1 OR publish_id=2)";
            conf.indexMapper = "[ { \"type\": \"indexMapper\", \"compile\": true, \"scripts\": [\"mapping/global.js\", \"mapping/igc_to_lucene_address.js\"]}, {\"type\": \"idfProducerIndexMapper\"} ]";
            conf.idfMapper = "[ { \"type\": \"createIdfMapper\" }, { \"type\": \"scriptedIdfMapper\", \"compile\": true, \"scripts\": [\"mapping/global.js\", \"mapping/igc_to_idf_address.js\"] } ]";
        }

        conf.springProfile = null;
    }
}
