package de.ingrid.iplug.dsc.index;

import java.io.FileInputStream;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

import org.dbunit.DBTestCase;
import org.dbunit.PropertiesBasedJdbcDatabaseTester;
import org.dbunit.database.DatabaseConfig;
import org.dbunit.dataset.Column;
import org.dbunit.dataset.DataSetException;
import org.dbunit.dataset.IDataSet;
import org.dbunit.dataset.ITable;
import org.dbunit.dataset.ITableMetaData;
import org.dbunit.dataset.xml.FlatXmlDataSetBuilder;
import org.dbunit.ext.hsqldb.HsqldbDataTypeFactory;

public class IgcDbUnitEnabledTestCase extends DBTestCase {

    protected String datasourceFileName;
    
    
    public IgcDbUnitEnabledTestCase(String name) {
        super( name );
        System.setProperty( PropertiesBasedJdbcDatabaseTester.DBUNIT_DRIVER_CLASS, "org.hsqldb.jdbcDriver" );
        System.setProperty( PropertiesBasedJdbcDatabaseTester.DBUNIT_CONNECTION_URL, "jdbc:hsqldb:mem:sample" );
        System.setProperty( PropertiesBasedJdbcDatabaseTester.DBUNIT_USERNAME, "sa" );
        System.setProperty( PropertiesBasedJdbcDatabaseTester.DBUNIT_PASSWORD, "" );
    }
    
    
    @Override
    protected void setUp() throws Exception {
        IDataSet ds = new FlatXmlDataSetBuilder().build(new FileInputStream(datasourceFileName));
        createHsqldbTables(ds, this.getConnection().getConnection());
        super.setUp();
    }


    @Override
    protected IDataSet getDataSet() throws Exception {
        IDataSet ds = new FlatXmlDataSetBuilder().build(new FileInputStream(datasourceFileName));
        return ds;
    }

    
    @Override
    protected void setUpDatabaseConfig(DatabaseConfig config) {
        config.setProperty(DatabaseConfig.PROPERTY_DATATYPE_FACTORY, new HsqldbDataTypeFactory());
    }


    private void createHsqldbTables(IDataSet dataSet, Connection connection) throws DataSetException, SQLException {
        String[] tableNames = dataSet.getTableNames();

        String sql = "";
        for (String tableName : tableNames) {
          ITable table = dataSet.getTable(tableName);
          ITableMetaData metadata = table.getTableMetaData();
          Column[] columns = metadata.getColumns();

          sql = "create memory table " + tableName + "( ";
          boolean first = true;
          for (Column column : columns) {
            if (!first) {
              sql += ", ";
            }
            String columnName = column.getColumnName();
            String type = resolveType((String) table.getValue(0, columnName));
            sql += columnName + " " + type;
            if (first) {
              sql += " primary key";
              first = false;
            }
          }
          sql += "); ";
          PreparedStatement pp = connection.prepareStatement(sql);
          pp.executeUpdate();
        }
    }

    private String resolveType(String str) {
      try {
        if (new Double(str).toString().equals(str)) {
          return "double";
        }
      } catch (Exception e) {}

      try {
        if (new Integer(str).toString().equals(str)) {
          return "int";
        }
      } catch (Exception e) {}

      return "varchar(255)";
    }
    
    
    public String getDatasourceFileName() {
        return datasourceFileName;
    }


    public void setDatasourceFileName(String datasourceFileName) {
        this.datasourceFileName = datasourceFileName;
    }

    
    
}
