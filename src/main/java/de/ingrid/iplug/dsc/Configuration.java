/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2017 wemove digital solutions GmbH
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

import java.util.Properties;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.tngtech.configbuilder.annotation.propertyloaderconfiguration.PropertiesFiles;
import com.tngtech.configbuilder.annotation.propertyloaderconfiguration.PropertyLocations;
import com.tngtech.configbuilder.annotation.valueextractor.DefaultValue;
import com.tngtech.configbuilder.annotation.valueextractor.PropertyValue;

import de.ingrid.admin.IConfig;
import de.ingrid.admin.command.PlugdescriptionCommandObject;
import de.ingrid.iplug.dsc.index.DatabaseConnection;
import de.ingrid.iplug.dsc.migrate.ConfigMigration;
import de.ingrid.utils.PlugDescription;

@PropertiesFiles( {"config"} )
@PropertyLocations(directories = {"conf"}, fromClassLoader = true)
public class Configuration implements IConfig {
    
    private static Log log = LogFactory.getLog(Configuration.class);
    
    @PropertyValue("iplug.database.driver")
    @DefaultValue("com.mysql.jdbc.Driver")
    public String databaseDriver;
    
    @PropertyValue("iplug.database.url")
    @DefaultValue("jdbc:mysql://localhost:3306/igc")
    public String databaseUrl;
    
    @PropertyValue("iplug.database.username")
    @DefaultValue("")
    public String databaseUsername;
    
    @PropertyValue("iplug.database.password")
    @DefaultValue("")
    public String databasePassword;
    
    @PropertyValue("iplug.database.schema")
    @DefaultValue("")
    public String databaseSchema;
    
    
    /**
     * Should be removed in future versions, when version <3.6.0.3 is nowhere being used!
     */
    @PropertyValue("spring.profile")
    @Deprecated
    public String springProfile;
    
    @PropertyValue("mapper.index.docSql")
    public String indexMapperSql;

    @PropertyValue("mapper.index.fieldId")
    public String indexFieldId;

    @PropertyValue("mapper.idf.beans")
    @DefaultValue("[]")
    public String idfMapper;
    
    @PropertyValue("mapper.index.beans")
    @DefaultValue("[]")
    public String indexMapper;

    @Override
    public void initialize() {
        
        // since 3.6.0.4 there's no profile for spring used anymore
        // migrate necessary settings accordingly 
        if (springProfile != null && (indexMapper == null || indexMapper.trim().isEmpty())) {
            ConfigMigration.migrateSpringProfile( springProfile );
        }
        
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
        
        DatabaseConnection dbc = new DatabaseConnection( databaseDriver, databaseUrl, databaseUsername, databasePassword, databaseSchema );
        pdObject.setConnection( dbc );
    }

    @Override
    public void setPropertiesFromPlugdescription( Properties props, PlugdescriptionCommandObject pd ) {
        DatabaseConnection connection = (DatabaseConnection) pd.getConnection();
        databaseDriver = connection.getDataBaseDriver();
        databaseUrl = connection.getConnectionURL();
        databaseUsername = connection.getUser();
        databasePassword = connection.getPassword();
        databaseSchema = connection.getSchema();
        
        props.setProperty( "iplug.database.driver", databaseDriver);
        props.setProperty( "iplug.database.url", databaseUrl);
        props.setProperty( "iplug.database.username", databaseUsername);
        props.setProperty( "iplug.database.password", databasePassword);
        props.setProperty( "iplug.database.schema", databaseSchema);
    }


}
