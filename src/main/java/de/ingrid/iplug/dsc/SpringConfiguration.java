/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2015 wemove digital solutions GmbH
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

import org.mortbay.log.Log;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import de.ingrid.iplug.dsc.index.mapper.IgcProfileDocumentMapper;
import de.ingrid.iplug.dsc.index.mapper.ScriptedDocumentMapper;
import de.ingrid.iplug.dsc.index.producer.PlugDescriptionConfiguredDatabaseRecordSetProducer;
import de.ingrid.iplug.dsc.record.mapper.CreateIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.IgcProfileIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.ScriptedIdfMapper;
import de.ingrid.iplug.dsc.record.producer.PlugDescriptionConfiguredDatabaseRecordProducer;

@Configuration
//@ComponentScan( basePackages = {"de.ingrid"} )
//@EnableAutoConfiguration
public class SpringConfiguration {
    
    public static String OBJECT_INTERNET = "object_internet";

    @Profile(value = { "object_internet", "object_intranet" })
    public static class ObjectGeneral {
        
        @Bean
        public IgcProfileDocumentMapper recordProfileMapper() {
            IgcProfileDocumentMapper mapper = new IgcProfileDocumentMapper();
            mapper.setSql( "SELECT value_string AS igc_profile FROM sys_generic_key WHERE key_name='profileXML'" );
            return mapper;
        }
        
        @Bean
        public ScriptedDocumentMapper recordMapper() {
            ScriptedDocumentMapper mapper = new ScriptedDocumentMapper();
            Resource[] mappingScripts = new Resource[2];
            mappingScripts[0] = new ClassPathResource( "mapping/global.js" );
            mappingScripts[1] = new ClassPathResource( "mapping/igc_to_lucene.js" );
            mapper.setMappingScripts( mappingScripts );
            mapper.setCompile( true );
            return mapper;
        }
        
        @Bean
        public ScriptedIdfMapper scriptedIdfMapper() {
            Log.debug( DscSearchPlug.conf.databaseUrl );
            ScriptedIdfMapper mapper = new ScriptedIdfMapper();
            Resource[] mappingScripts = new Resource[3];
            mappingScripts[0] = new ClassPathResource( "mapping/global.js" );
            mappingScripts[1] = new ClassPathResource( "mapping/idf_utils.js" );
            mappingScripts[2] = new ClassPathResource( "mapping/igc_to_idf.js" );
            mapper.setMappingScripts( mappingScripts );
            mapper.setCompile( true );
            return mapper;
        }
        @Bean
        public ScriptedIdfMapper scriptedIdfMapperDQ() {
            ScriptedIdfMapper mapper = new ScriptedIdfMapper();
            Resource[] mappingScripts = new Resource[3];
            mappingScripts[0] = new ClassPathResource( "mapping/global.js" );
            mappingScripts[1] = new ClassPathResource( "mapping/idf_utils.js" );
            mappingScripts[2] = new ClassPathResource( "mapping/igc_to_idf_obj_dq.js" );
            mapper.setMappingScripts( mappingScripts );
            mapper.setCompile( true );
            return mapper;
        }
        
        @Bean
        public IgcProfileIdfMapper igcProfileIdfMapper() {
            IgcProfileIdfMapper mapper = new IgcProfileIdfMapper();
            mapper.setSql( "SELECT value_string AS igc_profile FROM sys_generic_key WHERE key_name='profileXML'" );
            return mapper;
        }
        
        @Bean
        public PlugDescriptionConfiguredDatabaseRecordProducer recordProducer() {
            PlugDescriptionConfiguredDatabaseRecordProducer producer = new PlugDescriptionConfiguredDatabaseRecordProducer();
            producer.setIndexFieldID( "t01_object.id" );
            return producer;
        }
    }
    
    @Profile(value = { "address_internet", "address_intranet" })
    public static class AddressGeneral {
        @Bean
        public static ScriptedDocumentMapper recordMapper() {
            ScriptedDocumentMapper mapper = new ScriptedDocumentMapper();
            Resource[] mappingScripts = new Resource[2];
            mappingScripts[0] = new ClassPathResource( "mapping/global.js" );
            mappingScripts[1] = new ClassPathResource( "mapping/igc_to_lucene_address.js" );
            mapper.setMappingScripts( mappingScripts );
            mapper.setCompile( true );
            return mapper;
        }
        
        /*
        @Bean
        public DscRecordCreator dscRecordProducer() {
            DscRecordCreator creator = new DscRecordCreator();
            creator.setRecordProducer( recordProducer() );
            List<IIdfMapper> record2IdfMapperList = new ArrayList<IIdfMapper>();
            record2IdfMapperList.add( createIdfMapper() );
            record2IdfMapperList.add( scriptedIdfMapper() );
            creator.setRecord2IdfMapperList( record2IdfMapperList );
            return creator;
        }*/
        
        @Bean
        public PlugDescriptionConfiguredDatabaseRecordProducer recordProducer() {
            PlugDescriptionConfiguredDatabaseRecordProducer producer = new PlugDescriptionConfiguredDatabaseRecordProducer();
            producer.setIndexFieldID( "t02_address.id" );
            return producer;
        }
        
        @Bean
        public ScriptedIdfMapper scriptedIdfMapper() {
            //Log.debug( DscSearchPlug.conf.databaseUrl );
            ScriptedIdfMapper mapper = new ScriptedIdfMapper();
            Resource[] mappingScripts = new Resource[2];
            mappingScripts[0] = new ClassPathResource( "mapping/global.js" );
            mappingScripts[1] = new ClassPathResource( "mapping/igc_to_idf_address.js" );
            mapper.setMappingScripts( mappingScripts );
            mapper.setCompile( true );
            return mapper;
        }
    }

    @Profile(value = { "object_internet" })
    public static class ObjectInternet {
        
        @Bean
        public PlugDescriptionConfiguredDatabaseRecordSetProducer recordSetProducerObjectInternet() {
            PlugDescriptionConfiguredDatabaseRecordSetProducer producer = new PlugDescriptionConfiguredDatabaseRecordSetProducer(); 
            producer.setRecordSql( "SELECT DISTINCT id FROM t01_object WHERE work_state='V' AND publish_id=1" );
            return producer;
        }
    }
    
    @Profile(value = { "object_intranet" })
    public static class ObjectIntranet {
        
        @Bean
        public PlugDescriptionConfiguredDatabaseRecordSetProducer recordSetProducerObjectIntranet() {
            PlugDescriptionConfiguredDatabaseRecordSetProducer producer = new PlugDescriptionConfiguredDatabaseRecordSetProducer(); 
            producer.setRecordSql( "SELECT DISTINCT id FROM t01_object WHERE work_state='V' AND (publish_id=1 OR publish_id=2)" );
            return producer;
        }
    }
    
    @Profile(value = { "address_internet" })
    public static class AddressInternet {
       
        @Bean
        public PlugDescriptionConfiguredDatabaseRecordSetProducer recordSetProducerAddressInternet() {
            PlugDescriptionConfiguredDatabaseRecordSetProducer producer = new PlugDescriptionConfiguredDatabaseRecordSetProducer(); 
            producer.setRecordSql( "SELECT DISTINCT id FROM t02_address WHERE work_state='V' AND publish_id=1" );
            return producer;
        }
    }
    
    @Profile(value = { "address_intranet" })
    public static class AddressIntranet {
        
        @Bean
        public PlugDescriptionConfiguredDatabaseRecordSetProducer recordSetProducerAddressIntranet() {
            PlugDescriptionConfiguredDatabaseRecordSetProducer producer = new PlugDescriptionConfiguredDatabaseRecordSetProducer(); 
            producer.setRecordSql( "SELECT DISTINCT id FROM t02_address WHERE work_state='V' AND (publish_id=1 OR publish_id=2)" );
            return producer;
        }
    }
    
    @Bean
    public static CreateIdfMapper createIdfMapper() {
        return new CreateIdfMapper();
    }
    
}
