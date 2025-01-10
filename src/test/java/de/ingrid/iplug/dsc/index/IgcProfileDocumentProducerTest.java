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
package de.ingrid.iplug.dsc.index;

import de.ingrid.admin.Config;
import de.ingrid.iplug.dsc.index.mapper.IRecordMapper;
import de.ingrid.iplug.dsc.index.mapper.IgcProfileDocumentMapper;
import de.ingrid.iplug.dsc.index.producer.PlugDescriptionConfiguredDatabaseRecordSetProducer;
import de.ingrid.utils.PlugDescription;
import de.ingrid.utils.statusprovider.StatusProviderService;
import de.ingrid.utils.xml.PlugdescriptionSerializer;
import org.dbunit.DBTestCase;
import org.dbunit.PropertiesBasedJdbcDatabaseTester;
import org.dbunit.database.DatabaseConfig;
import org.dbunit.dataset.*;
import org.dbunit.dataset.xml.XmlDataSet;
import org.dbunit.ext.hsqldb.HsqldbDataTypeFactory;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class IgcProfileDocumentProducerTest extends DBTestCase {

    StatusProviderService statusProviderService;

    public static String DATASOURCE_FILE_NAME = "src/test/resources/dataset_igc_profile.xml";

    public IgcProfileDocumentProducerTest(String name) {
        super(name);
        statusProviderService = new StatusProviderService();
        System.setProperty(PropertiesBasedJdbcDatabaseTester.DBUNIT_DRIVER_CLASS, "org.hsqldb.jdbcDriver");
        System.setProperty(PropertiesBasedJdbcDatabaseTester.DBUNIT_CONNECTION_URL, "jdbc:hsqldb:mem:sample");
        System.setProperty(PropertiesBasedJdbcDatabaseTester.DBUNIT_USERNAME, "sa");
        System.setProperty(PropertiesBasedJdbcDatabaseTester.DBUNIT_PASSWORD, "");
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
        return new XmlDataSet(Files.newInputStream(Paths.get(DATASOURCE_FILE_NAME)));
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
        } catch (Exception ignored) {
        }

        try {
            if (Integer.valueOf(str).toString().equals(str)) {
                return "int";
            }
        } catch (Exception ignored) {
        }

        return "varchar(10550)";
    }


    @SuppressWarnings("unchecked")
    public void testDscRecordCreator() throws Exception {

        File plugDescriptionFile = new File("src/test/resources/plugdescription_db_test.xml");
        PlugDescription pd = new PlugdescriptionSerializer().deSerialize(plugDescriptionFile);

        PlugDescriptionConfiguredDatabaseRecordSetProducer p = new PlugDescriptionConfiguredDatabaseRecordSetProducer();
        p.setStatusProviderService(statusProviderService);
        p.setRecordSql("SELECT id, obj_uuid, obj_class FROM t01_object");
        p.configure(pd);

        IgcProfileDocumentMapper m = new IgcProfileDocumentMapper();
        m.setSql("SELECT VALUE AS igc_profile FROM TEST_TABLE WHERE KEY='igc_profile'");

        List<IRecordMapper> mList = new ArrayList<>();
        mList.add(m);

        DscDocumentProducer dp = new DscDocumentProducer();
        dp.setConfig(new Config());
        dp.setRecordSetProducer(p);
        dp.setRecordMapperList(mList);

        if (dp.hasNext()) {
            Map<String, Object> doc = dp.next();
            assertNotNull(doc);
            assertEquals(doc.get("indexName0"), "test content for field id2");
            assertEquals(((List<Object>) doc.get("indexName5")).size(), 2);
        } else {
            fail("No document produced");
        }

    }

}
