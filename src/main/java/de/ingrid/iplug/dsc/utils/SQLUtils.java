/**
 * 
 */
package de.ingrid.iplug.dsc.utils;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;

/**
 * Singleton helper class encapsulating SQL access via JDBC connection (e.g. used in mapping script).
 *  
 * @author Martin
 */
public class SQLUtils {

    private static final Logger log = Logger.getLogger(SQLUtils.class);
    
    private Connection connection = null;

	private static SQLUtils myInstance;

	/** Get The Singleton.
	 * NOTICE: Resets internal state (uses passed connection). */
	public static synchronized SQLUtils getInstance(Connection connection) {
		if (myInstance == null) {
	        myInstance = new SQLUtils();
		}
		myInstance.initialize(connection);

		return myInstance;
	}

	private SQLUtils() {
	}
	private void initialize(Connection connection) {
		this.connection = connection;
	}

	
	/**
	 * Executes a SQL and returns the first record result.
	 * 
	 * @param sqlStr The SQL to execute.
	 * @return A map with column names as keys and column values as String (can be null)
	 * @throws SQLException
	 */
	public Map<String, String> first(String sqlStr) throws SQLException {
	    List<Map<String, String>> results = all(sqlStr);
	    if (results.size() > 0) {
	        return results.get(0);
	    } else {
	        return null;
	    }
	}

    /**
     * Executes a SQL and returns the first record result.
     * 
     * @param sqlStr The SQL to execute.
     * @param sqlParams The params to be set on SQL string. NOTICE: NO null params !
     * @return A map with column names as keys and column values as String (can be null)
     * @throws SQLException
     */
    public Map<String, String> first(String sqlStr, Object[] sqlParams) throws SQLException {
        List<Map<String, String>> results = all(sqlStr, sqlParams);
        if (results.size() > 0) {
            return results.get(0);
        } else {
            return null;
        }
    }
	
	
	/**
	 * Executes a SQL and returns a list with records results
	 * @param sqlStr the sql to execute
	 * @return list of maps, one per row, with column names as keys and column values as String (can be null)
	 * @throws SQLException
	 */
	public List<Map<String, String>> all(String sqlStr) throws SQLException {
	    return all(sqlStr, null);
	}

	/**
	 * Executes a SQL and returns a list with records results
	 * @param sqlStr the sql to execute
	 * @param sqlParams the params to be set on SQL string. NOTICE: NO null params !
	 * @return list of maps, one per row, with column names as keys and column values as String (can be null)
	 * @throws SQLException
	 */
	public List<Map<String, String>> all(String sqlStr, Object[] sqlParams) throws SQLException {
        if (log.isDebugEnabled()) {
            log.debug("Execute sql: '" + sqlStr + "' with parameters: " + Arrays.toString(sqlParams));
        }
		PreparedStatement ps = null;
		try {
			ps = connection.prepareStatement(sqlStr);
			if (sqlParams != null) {
				for (int i=0; i < sqlParams.length; i++) {
					ps.setString(i+1, sqlParams[i].toString());
				}
			}

			ResultSet rs = ps.executeQuery();
			List<Map<String, String>> result = toList(rs); 
			rs.close();
			
			return result;

		} catch (SQLException ex) {
		    log.error("Error fetching all records from SQL. Sql: " + sqlStr + ", sqlParams: " + sqlParams + ", Exception: " + ex);
		    throw ex;
		} finally {
			if (ps != null) {
				ps.close();
			}
		}
	}
	
	/**
	* Helper method that converts a ResultSet into a list of maps, one per row
	* @param query ResultSet
	* @return list of maps, one per column row, with column names as keys and column values as String (can be null)
	* @throws SQLException if the connection fails
	*/
	private List<Map<String, String>> toList(ResultSet rs) throws SQLException {
		List<String> wantedColumnNames = getColumnNames(rs);

		return toList(rs, wantedColumnNames);
	}
	/**
	* Helper method that maps a ResultSet into a list of maps, one per row.
	* NOTICE: Calls trim() to remove whitespaces from values
	* @param query ResultSet
	* @param list of columns names to include in the result map
	* @return list of maps, one per column row, with column names as keys and column values as String (can be null)
	* @throws SQLException if the connection fails
	*/
	private List<Map<String, String>> toList(ResultSet rs, List<String> wantedColumnNames) throws SQLException {
		List<Map<String, String>> rows = new ArrayList<Map<String, String>>();

		while (rs.next()) {
			Map<String, String> row = new LinkedHashMap<String, String>();

			for (String columnName : wantedColumnNames) {
				String value = rs.getString(columnName);
				if (value != null) {
					value = value.trim();
				}
				row.put(columnName, value);
			}

			rows.add(row);
		}

		return rows;
	}

	/**
	* Return all column names as a list of strings
	* @param database query result set
	* @return list of column name strings
	* @throws SQLException if the query fails
	*/
	private final List<String> getColumnNames(ResultSet rs) throws SQLException	{
		List<String> columnNames = new ArrayList<String>();

		ResultSetMetaData meta = rs.getMetaData();
		int numColumns = meta.getColumnCount();
		for (int i = 1; i <= numColumns; ++i) {
			columnNames.add(meta.getColumnName(i));
		}

		return columnNames;
	}
	
	
}
