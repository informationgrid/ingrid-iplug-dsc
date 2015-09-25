package de.ingrid.iplug.dsc.migrate;

import java.util.ArrayList;

import de.ingrid.admin.JettyStarter;
import de.ingrid.iplug.dsc.Configuration;
import de.ingrid.iplug.dsc.DscSearchPlug;

public class ConfigMigration {
    public static void migrateSpringProfile(String profile) {
        Configuration conf = DscSearchPlug.conf;
        if ("object_internet".equals( profile ) || "object_intranet".equals( profile )) {
            conf.indexFieldId = "t01_object.id";

            if ("object_internet".equals( profile )) {
                conf.indexMapperSql = "SELECT DISTINCT id FROM t01_object WHERE work_state='V' AND publish_id=1";
            } else {
                conf.indexMapperSql = "SELECT DISTINCT id FROM t01_object WHERE work_state='V' AND (publish_id=1 OR publish_id=2)";
            }
            conf.indexMappingScripts = new ArrayList<String>();
            conf.indexMappingScripts.add( "mapping/global.js" );
            conf.indexMappingScripts.add( "mapping/igc_to_lucene.js" );
            conf.indexProfileMapperSql = "SELECT value_string AS igc_profile FROM sys_generic_key WHERE key_name='profileXML'";

            conf.idfMappingScripts = new ArrayList<String>();
            conf.idfMappingScripts.add( "mapping/global.js" );
            conf.idfMappingScripts.add( "mapping/idf_utils.js" );
            conf.idfMappingScripts.add( "mapping/igc_to_idf.js" );
            conf.idfMappingScriptsDQ = new ArrayList<String>();
            conf.idfMappingScriptsDQ.add( "mapping/global.js" );
            conf.idfMappingScriptsDQ.add( "mapping/idf_utils.js" );
            conf.idfMappingScriptsDQ.add( "mapping/igc_to_idf_obj_dq.js" );
            conf.idfProfileMapperSql = "SELECT value_string AS igc_profile FROM sys_generic_key WHERE key_name='profileXML'";

        } else if ("address_internet".equals( profile ) || "address_intranet".equals( profile )) {
            conf.indexFieldId = "t02_address.id";

            if ("object_internet".equals( profile )) {
                conf.indexMapperSql = "SELECT DISTINCT id FROM t02_address WHERE work_state='V' AND publish_id=1";
            } else {
                conf.indexMapperSql = "SELECT DISTINCT id FROM t02_address WHERE work_state='V' AND (publish_id=1 OR publish_id=2)";
            }
            conf.indexMappingScripts = new ArrayList<String>();
            conf.indexMappingScripts.add( "mapping/global.js" );
            conf.indexMappingScripts.add( "mapping/igc_to_lucene_address.js" );
            //conf.indexProfileMapperSql = "SELECT value_string AS igc_profile FROM sys_generic_key WHERE key_name='profileXML'";

            conf.idfMappingScripts = new ArrayList<String>();
            conf.idfMappingScripts.add( "mapping/global.js" );
            conf.idfMappingScripts.add( "mapping/igc_to_idf_address.js" );
            //conf.idfProfileMapperSql = "SELECT value_string AS igc_profile FROM sys_generic_key WHERE key_name='profileXML'";
        }
        conf.springProfile = null;
    }
}
