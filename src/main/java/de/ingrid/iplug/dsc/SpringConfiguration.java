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
package de.ingrid.iplug.dsc;

import java.util.ArrayList;
import java.util.List;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.simple.parser.ParseException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import de.ingrid.iplug.dsc.index.DscDocumentProducer;
import de.ingrid.iplug.dsc.index.mapper.IRecordMapper;
import de.ingrid.iplug.dsc.index.mapper.IgcProfileDocumentMapper;
import de.ingrid.iplug.dsc.index.mapper.ScriptedDocumentMapper;
import de.ingrid.iplug.dsc.index.producer.IRecordSetProducer;
import de.ingrid.iplug.dsc.index.producer.PlugDescriptionConfiguredDatabaseRecordSetProducer;
import de.ingrid.iplug.dsc.record.DscRecordCreator;
import de.ingrid.iplug.dsc.record.mapper.CreateIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.IIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.IgcProfileIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.ScriptedIdfMapper;
import de.ingrid.iplug.dsc.record.producer.IRecordProducer;
import de.ingrid.iplug.dsc.record.producer.PlugDescriptionConfiguredDatabaseRecordProducer;
import de.ingrid.utils.IngridDocument;
import de.ingrid.utils.json.JsonUtil;

@Configuration
// @EnableAutoConfiguration
public class SpringConfiguration {
    
    private static Log log = LogFactory.getLog(SpringConfiguration.class);

    public IgcProfileDocumentMapper indexProfileMapper(IngridDocument doc) {
        IgcProfileDocumentMapper mapper = new IgcProfileDocumentMapper();
        mapper.setSql( doc.getString( "sql" ) );
        return mapper;
    }

    public ScriptedDocumentMapper indexMapper(IngridDocument doc) {
        ScriptedDocumentMapper mapper = new ScriptedDocumentMapper();
        List<Object> scripts = doc.getArrayList( "scripts" );
        Resource[] mappingScripts = convertToMappingScriptResources( scripts );
        mapper.setMappingScripts( mappingScripts );
        Boolean compile = (Boolean) doc.get( "compile" );
        mapper.setCompile( compile == null ? true : compile );
        return mapper;
    }

    public ScriptedIdfMapper scriptedIdfMapper(IngridDocument doc) {
        ScriptedIdfMapper mapper = new ScriptedIdfMapper();
        List<Object> scripts = doc.getArrayList( "scripts" );
        Resource[] mappingScripts = convertToMappingScriptResources( scripts );
        mapper.setMappingScripts( mappingScripts );
        Boolean compile = (Boolean) doc.get( "compile" );
        mapper.setCompile( compile == null ? true : compile );
        return mapper;
    }

    @Bean
    public DscDocumentProducer dscDocumentProducer(IRecordSetProducer recordSetProducer) throws ParseException {
        DscDocumentProducer producer = new DscDocumentProducer();

        producer.setRecordSetProducer( recordSetProducer );

        if (DscSearchPlug.conf.indexMapper == null) log.error( "indexMapper (mapper.index.beans) is/are not defined!" );
        List<IRecordMapper> recordMapperList = new ArrayList<IRecordMapper>();
        List<IngridDocument> mappers = JsonUtil.parseJsonToListOfIngridDocument( DscSearchPlug.conf.indexMapper );
        for (IngridDocument mapper : mappers) {
            IRecordMapper recMap = null;
            String type = mapper.getString( "type" );
            if ("indexMapper".equals( type )) {
                recMap = (IRecordMapper) indexMapper( mapper );
            } else if ("indexProfileMapper".equals( type )) {
                recMap = (IRecordMapper) indexProfileMapper( mapper );
            }
            recordMapperList.add( recMap );
        }

        producer.setRecordMapperList( recordMapperList );

        return producer;
    }

    /**
     * from configuration:
     * idf.mapper.idfMapper=scriptedIdfMapper,true,script1,script2::scriptedIdfMapper,true,script1,script2,script3::scriptedIdfProfileMapper
     * ,true,script1,script2
     * 
     * @return
     * @throws ParseException
     */
    @Bean
    public DscRecordCreator dscRecordCreator(IRecordProducer recordProducer) throws ParseException {
        DscRecordCreator producer = new DscRecordCreator();
        producer.setRecordProducer( recordProducer );

        if (DscSearchPlug.conf.idfMapper == null) log.error( "idfMapper (mapper.idf.beans) is/are not defined!" );
        List<IIdfMapper> recordMapperList = new ArrayList<IIdfMapper>();
        List<IngridDocument> mappers = JsonUtil.parseJsonToListOfIngridDocument( DscSearchPlug.conf.idfMapper );
        for (IngridDocument mapper : mappers) {
            IIdfMapper recMap = null;
            String type = mapper.getString( "type" );
            if ("scriptedIdfMapper".equals( type )) {
                recMap = (IIdfMapper) scriptedIdfMapper( mapper );
            } else if ("scriptedIdfProfileMapper".equals( type )) {
                recMap = (IIdfMapper) igcProfileIdfMapper( mapper );
            } else if ("createIdfMapper".equals( type )) {
                recMap = (IIdfMapper) new CreateIdfMapper();
            }
            recordMapperList.add( recMap );
        }

        producer.setRecord2IdfMapperList( recordMapperList );

        return producer;
    }

    public IgcProfileIdfMapper igcProfileIdfMapper(IngridDocument doc) {
        IgcProfileIdfMapper mapper = new IgcProfileIdfMapper();
        mapper.setSql( doc.getString( "sql" ) );
        return mapper;
    }

    @Bean
    public PlugDescriptionConfiguredDatabaseRecordProducer recordProducer() {
        PlugDescriptionConfiguredDatabaseRecordProducer producer = new PlugDescriptionConfiguredDatabaseRecordProducer();
        producer.setIndexFieldID( DscSearchPlug.conf.indexFieldId );
        return producer;
    }

    @Bean
    public PlugDescriptionConfiguredDatabaseRecordSetProducer recordSetProducer() {
        PlugDescriptionConfiguredDatabaseRecordSetProducer producer = new PlugDescriptionConfiguredDatabaseRecordSetProducer();
        producer.setRecordSql( DscSearchPlug.conf.indexMapperSql );
        return producer;
    }

    private Resource[] convertToMappingScriptResources(List<Object> scripts) {
        if (scripts == null)
            return new Resource[0];
        Resource[] mappingScripts = new Resource[scripts.size()];
        for (int i = 0; i < scripts.size(); i++) {
            mappingScripts[i] = new ClassPathResource( (String) scripts.get( i ) );
        }
        return mappingScripts;
    }
}
