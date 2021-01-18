/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2021 wemove digital solutions GmbH
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

import de.ingrid.admin.IConfig;
import de.ingrid.admin.command.PlugdescriptionCommandObject;
import de.ingrid.iplug.dsc.index.DatabaseConnection;
import de.ingrid.utils.PlugDescription;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Value;

import java.util.Properties;

@org.springframework.context.annotation.Configuration
public class Configuration implements IConfig {
    
    private static Log log = LogFactory.getLog(Configuration.class);
    
    @Value("${iplug.database.driver:com.mysql.jdbc.Driver}")
    public String databaseDriver;
    
    @Value("${iplug.database.url:jdbc:mysql://localhost:3306/igc}")
    public String databaseUrl;
    
    @Value("${iplug.database.username:}")
    public String databaseUsername;
    
    @Value("${iplug.database.password:}")
    public String databasePassword;
    
    @Value("${iplug.database.schema:}")
    public String databaseSchema;

    public DatabaseConnection dbConnection;
    
    @Value("${mapper.index.docSql}")
    public String indexMapperSql;

    @Value("${mapper.index.fieldId}")
    public String indexFieldId;

    @Value("${mapper.idf.beans:[]}")
    public String idfMapper;
    
    @Value("${mapper.index.beans:[]}")
    public String indexMapper;

    @Override
    public void initialize() {

    }

    @Override
    public void addPlugdescriptionValues( PlugdescriptionCommandObject pdObject ) {
        pdObject.put( "iPlugClass", "de.ingrid.iplug.dsc.DscSearchPlug" );

        // add necessary fields so iBus actually will query us
        // remove field first to prevent multiple equal entries
        pdObject.removeFromList(PlugDescription.FIELDS, "incl_meta");
        pdObject.addField("incl_meta");
        pdObject.removeFromList(PlugDescription.FIELDS, "t01_object.obj_class");
        pdObject.addField("t01_object.obj_class");
        pdObject.removeFromList(PlugDescription.FIELDS, "metaclass");
        pdObject.addField("metaclass");
        
        this.dbConnection = new DatabaseConnection( databaseDriver, databaseUrl, databaseUsername, databasePassword, databaseSchema );
        pdObject.setConnection( this.dbConnection );
    }

    @Override
    public void setPropertiesFromPlugdescription( Properties props, PlugdescriptionCommandObject pd ) {
        props.setProperty( "iplug.database.driver", databaseDriver);
        props.setProperty( "iplug.database.url", databaseUrl);
        props.setProperty( "iplug.database.username", databaseUsername);
        props.setProperty( "iplug.database.password", databasePassword);
        props.setProperty( "iplug.database.schema", databaseSchema);
    }


}
