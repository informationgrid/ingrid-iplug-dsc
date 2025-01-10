/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2025 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.2 or – as soon they will be
 * approved by the European Commission - subsequent versions of the
 * EUPL (the "Licence");
 * 
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 * https://joinup.ec.europa.eu/software/page/eupl
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * **************************************************#
 */
package de.ingrid.iplug.dsc.record;

import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import org.dbunit.DBTestCase;
import org.dbunit.PropertiesBasedJdbcDatabaseTester;
import org.dbunit.database.DatabaseConfig;
import org.dbunit.dataset.Column;
import org.dbunit.dataset.DataSetException;
import org.dbunit.dataset.IDataSet;
import org.dbunit.dataset.ITable;
import org.dbunit.dataset.ITableMetaData;
import org.dbunit.dataset.xml.XmlDataSet;
import org.dbunit.ext.hsqldb.HsqldbDataTypeFactory;

import de.ingrid.iplug.dsc.record.mapper.CreateIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.IIdfMapper;
import de.ingrid.iplug.dsc.record.mapper.IgcProfileIdfMapper;
import de.ingrid.iplug.dsc.record.producer.PlugDescriptionConfiguredDatabaseRecordProducer;
import de.ingrid.utils.ElasticDocument;
import de.ingrid.utils.PlugDescription;
import de.ingrid.utils.dsc.Record;
import de.ingrid.utils.xml.PlugdescriptionSerializer;

public class IgcProfileIdfRecordCreatorTest extends DBTestCase {

    public static String DATASOURCE_FILE_NAME = "src/test/resources/dataset_igc_profile.xml";
    
    public IgcProfileIdfRecordCreatorTest(String name) {
        super( name );
        System.setProperty( PropertiesBasedJdbcDatabaseTester.DBUNIT_DRIVER_CLASS, "org.hsqldb.jdbcDriver" );
        System.setProperty( PropertiesBasedJdbcDatabaseTester.DBUNIT_CONNECTION_URL, "jdbc:hsqldb:mem:sample" );
        System.setProperty( PropertiesBasedJdbcDatabaseTester.DBUNIT_USERNAME, "sa" );
        System.setProperty( PropertiesBasedJdbcDatabaseTester.DBUNIT_PASSWORD, "" );
    }

    @Override
    protected void setUp() throws Exception {
        System.out.println("Try creating tables from data source file: " + DATASOURCE_FILE_NAME);
        IDataSet ds = new XmlDataSet(Files.newInputStream(Paths.get(DATASOURCE_FILE_NAME)));
        createHsqldbTables(ds, this.getConnection().getConnection());
        super.setUp();
    }

    @Override
    protected void tearDown() throws Exception {
        super.tearDown();
        System.out.println("Drop all tables.");
        PreparedStatement pp = this.getConnection().getConnection().prepareStatement("DROP SCHEMA PUBLIC CASCADE");
        pp.executeUpdate();
        pp.close();
    }


    @Override
    protected IDataSet getDataSet() throws Exception {
        System.out.println("Populating from data source file: " + DATASOURCE_FILE_NAME);
        IDataSet ds = new XmlDataSet(Files.newInputStream(Paths.get(DATASOURCE_FILE_NAME)));
        return ds;
    }

    
    @Override
    protected void setUpDatabaseConfig(DatabaseConfig config) {
        config.setProperty(DatabaseConfig.PROPERTY_DATATYPE_FACTORY, new HsqldbDataTypeFactory());
        config.setProperty(DatabaseConfig.FEATURE_ALLOW_EMPTY_FIELDS, true);
    }


    private void createHsqldbTables(IDataSet dataSet, Connection connection) throws DataSetException, SQLException {
        String[] tableNames = dataSet.getTableNames();

        for (String tableName : tableNames) {
          ITable table = dataSet.getTable(tableName);
          ITableMetaData metadata = table.getTableMetaData();
          Column[] columns = metadata.getColumns();
          
          StringBuilder sql = new StringBuilder("create memory table " + tableName + "( ");
          boolean first = true;
          for (Column column : columns) {
            if (!first) {
              sql.append(", ");
            }
            String columnName = column.getColumnName();
            String type = resolveType((String) table.getValue(0, columnName));
            sql.append(columnName).append(" ").append(type);
            if (first) {
              sql.append(" primary key");
              first = false;
            }
          }
          sql.append("); ");
          PreparedStatement pp = connection.prepareStatement(sql.toString());
          pp.executeUpdate();
          pp.close();
        }
    }

    private String resolveType(String str) {
      try {
        if (Double.valueOf(str).toString().equals(str)) {
          return "double";
        }
      } catch (Exception ignored) {}

      try {
        if (Integer.valueOf(str).toString().equals(str)) {
          return "int";
        }
      } catch (Exception ignored) {}

      return "varchar(10550)";
    }
    
    public void testDscRecordCreator() throws Exception {

        File plugDescriptionFile = new File(
                "src/test/resources/plugdescription_db_test.xml");
        PlugDescription pd = new PlugdescriptionSerializer()
                .deSerialize(plugDescriptionFile);

        PlugDescriptionConfiguredDatabaseRecordProducer p = new PlugDescriptionConfiguredDatabaseRecordProducer();
        p.setIndexFieldID("ID");
        p.configure(pd);

        CreateIdfMapper m1 = new CreateIdfMapper();
        IgcProfileIdfMapper m2 = new IgcProfileIdfMapper();
        m2.setSql("SELECT VALUE AS igc_profile FROM TEST_TABLE WHERE KEY='igc_profile'");

        List<IIdfMapper> mList = new ArrayList<>();
        mList.add(m1);
        mList.add(m2);
        
        DscRecordCreator dc = new DscRecordCreator();
        dc.setRecordProducer(p);
        dc.setRecord2IdfMapperList(mList);

        ElasticDocument idxDoc = new ElasticDocument();
        idxDoc.put("ID", "2");
        Record r = dc.getRecord(idxDoc);
        assertNotNull(r.get("data"));
        assertEquals("false", r.getString("compressed"));
        assertTrue(r.getString("data").contains("test content for field id2"));
        System.out.println("Size of uncompressed IDF document: " + r.getString("data").length());
        
    }

}
