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
/**
 * 
 */
package de.ingrid.iplug.dsc.index.mapper;

import java.io.StringReader;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.apache.log4j.Logger;
import org.springframework.core.annotation.Order;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.utils.ElasticDocument;
import de.ingrid.utils.xml.ConfigurableNamespaceContext;
import de.ingrid.utils.xml.IDFNamespaceContext;
import de.ingrid.utils.xml.IgcProfileNamespaceContext;
import de.ingrid.utils.xpath.XPathUtils;

/**
 * IGC profile based source record to lucene document mapping. It maps the
 * content of the additional fields to the index using the index field names
 * specified in the profile. It only maps additional fields that have a index
 * field name specified in the profile.
 * <p />
 * The class can be configured with a SQL string that retrieves the IGC profile
 * from the database. The profile must be stored in a database record field
 * names 'igc_profile'.
 * 
 * @author joachim@wemove.com
 * 
 */
@Order(2)
public class IgcProfileDocumentMapper implements IRecordMapper {

    private String sql;

    private static final Logger log = Logger.getLogger(IgcProfileDocumentMapper.class);
    
    private XPathUtils xPathUtils = null;

    @Override
    public void map(SourceRecord record, ElasticDocument doc) throws Exception {
        if (!(record instanceof DatabaseSourceRecord)) {
            throw new IllegalArgumentException("Record is no DatabaseRecord!");
        }
        ConfigurableNamespaceContext cnc = new ConfigurableNamespaceContext();
        cnc.addNamespaceContext(new IDFNamespaceContext());
        cnc.addNamespaceContext(new IgcProfileNamespaceContext());
        xPathUtils = new XPathUtils(cnc);
        String objId = (String) record.get(DatabaseSourceRecord.ID);

        Connection connection = (Connection) record.get(DatabaseSourceRecord.CONNECTION);
        PreparedStatement ps = null;
        try {
            ps = connection.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
            rs.next();
            String igcProfileStr = rs.getString("igc_profile");
            ps.close();
            if (igcProfileStr != null) {
                DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
                dbf.setNamespaceAware(true);
                DocumentBuilder db;
                db = dbf.newDocumentBuilder();
                org.w3c.dom.Document igcProfile = db.parse(new InputSource(new StringReader(igcProfileStr)));
                NodeList igcProfileIndexNames = xPathUtils.getNodeList(igcProfile, "//igcp:controls/*//igcp:indexName");
                Map<String, String> profileInfo = new HashMap<String, String>();
                for (int i = 0; i < igcProfileIndexNames.getLength(); i++) {
                    String igcProfileIndexName = igcProfileIndexNames.item(i).getTextContent();
                    if (igcProfileIndexName != null && igcProfileIndexName.trim().length() > 0) {
                        Node igcProfileNode = igcProfileIndexNames.item(i).getParentNode();
                        String igcProfileNodeId = xPathUtils.getString(igcProfileNode, "igcp:id");
                        profileInfo.put(igcProfileNodeId, igcProfileIndexName);
                    }
                }
                if (!profileInfo.isEmpty()) {
                    ps = connection.prepareStatement("SELECT * FROM additional_field_data WHERE obj_id=?");
                    // convert id to number to be used in PreparedStatement as Integer to avoid postgres error !
                    ps.setInt(1, new Integer(objId));
                    mapAdditionalData(connection, ps, doc, profileInfo);
                    ps.close();
                }
            }
        } catch (SQLException e) {
            log.error("Error mapping IGC profile.", e);
            throw e;
        } finally {
        	// isClosed() CAUSES EXCEPTION ON ORACLE !!!
        	// Exception in thread "Thread-8" java.lang.AbstractMethodError: oracle.jdbc.driver.T4CPreparedStatement.isClosed()Z
            // if (ps != null && !ps.isClosed()) {
            if (ps != null) {
                ps.close();
            }
        }
    }

    public String getSql() {
        return sql;
    }

    public void setSql(String sql) {
        this.sql = sql;
    }

    /**
     * Does the mapping of additional data into the index based on index field
     * name definitions in the profile. This mapping occurs recursively if
     * needed because of the hierarchical structure of the data in the database
     * for table data.
     * 
     * 
     * @param connection
     * @param ps
     * @param doc
     * @param profileInfo
     * @throws Exception
     */
    private void mapAdditionalData(Connection connection, PreparedStatement ps, Map<String, Object> doc,
            Map<String, String> profileInfo) throws Exception {
        ResultSet rs = ps.executeQuery();
        while (rs.next()) {
            String fieldKey = rs.getString("field_key");
            if (profileInfo.containsKey(fieldKey) && rs.getString("data") != null && rs.getString("data").length() > 0) {
                doc.put( profileInfo.get(fieldKey), rs.getString("data") );
            }
            String id = rs.getString("id");
            PreparedStatement psNew = connection
                    .prepareStatement("SELECT * FROM additional_field_data WHERE parent_field_id=?");
            // convert id to number to be used in PreparedStatement as Integer to avoid postgres error !
            psNew.setInt(1, new Integer(id));
            mapAdditionalData(connection, psNew, doc, profileInfo);
            psNew.close();
        }

    }
    
}
