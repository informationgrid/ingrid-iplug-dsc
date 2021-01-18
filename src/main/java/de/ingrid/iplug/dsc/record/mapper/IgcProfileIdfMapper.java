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
/**
 * 
 */
package de.ingrid.iplug.dsc.record.mapper;

import java.io.StringReader;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import javax.script.Bindings;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.apache.log4j.Logger;
import org.springframework.core.annotation.Order;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.iplug.dsc.utils.DOMUtils;
import de.ingrid.iplug.dsc.utils.IdfUtils;
import de.ingrid.iplug.dsc.utils.SQLUtils;
import de.ingrid.iplug.dsc.utils.TransformationUtils;
import de.ingrid.utils.xml.ConfigurableNamespaceContext;
import de.ingrid.utils.xml.IDFNamespaceContext;
import de.ingrid.utils.xml.IgcProfileNamespaceContext;
import de.ingrid.utils.xpath.XPathUtils;

/**
 * Analyzes a IGC Profile, obtained from an IGC database and executes all
 * scripted on a supplied InGrid Detail data Format (IDF).
 * <p />
 * A SQL string can be set to retrieve the IGC profile. The profile is expected
 * to be in a SQL record property named "igc_profile".
 * <p/>
 * The mapper expects a base IDF format already present in {@link doc}.
 * 
 * @author joachim@wemove.com
 * 
 */
@Order(3)
public class IgcProfileIdfMapper implements IIdfMapper {

    protected static final Logger log = Logger.getLogger(IgcProfileIdfMapper.class);

    private String sql;
    
    private ScriptEngine engine = null;

    @Override
    public synchronized void map(SourceRecord record, Document doc) throws Exception {
        if (!(record instanceof DatabaseSourceRecord)) {
            throw new IllegalArgumentException("Record is no DatabaseRecord!");
        }
        ConfigurableNamespaceContext cnc = new ConfigurableNamespaceContext();
        cnc.addNamespaceContext(new IDFNamespaceContext());
        cnc.addNamespaceContext(new IgcProfileNamespaceContext());
        
        XPathUtils xpathUtils = new XPathUtils(cnc);
        if (!(xpathUtils.nodeExists(doc, "//idf:html"))) {
            throw new IllegalArgumentException("Document is no IDF!");
        }
        Connection connection = (Connection) record.get(DatabaseSourceRecord.CONNECTION);
        PreparedStatement ps = null;
        try {
            ps = connection.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
            rs.next();
            String igcProfileStr = rs.getString("igc_profile");
            if (log.isDebugEnabled()) {
                log.debug("igc profile found: " + igcProfileStr);
            }
            ps.close();
            if (igcProfileStr != null) {
                DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
                dbf.setNamespaceAware(true);
                DocumentBuilder db;
                db = dbf.newDocumentBuilder();
                Document igcProfile = db.parse(new InputSource(new StringReader(igcProfileStr)));
                NodeList igcProfileCswMappings = xpathUtils.getNodeList(igcProfile, "//igcp:controls/*/igcp:scriptedCswMapping");
                if (log.isDebugEnabled()) {
                    log.debug("cswMappings found: " + igcProfileCswMappings.getLength());
                }
                for (int i=0; i<igcProfileCswMappings.getLength(); i++) {
                    String igcProfileCswMapping = igcProfileCswMappings.item(i).getTextContent();
                    if (log.isDebugEnabled()) {
                        log.debug("Found Mapping Script: \n" + igcProfileCswMapping);
                    }
                    if (igcProfileCswMapping != null && igcProfileCswMapping.trim().length() > 0) {
                        Node igcProfileNode = igcProfileCswMappings.item(i).getParentNode();
                        try {
                            if (engine == null) {
                                ScriptEngineManager mgr = new ScriptEngineManager();
                                engine = mgr.getEngineByExtension("js");
                            }
    
                            // create utils for script
                            SQLUtils sqlUtils = new SQLUtils(connection);
                            // get initialized XPathUtils (see above)
                            TransformationUtils trafoUtils = new TransformationUtils(sqlUtils);
                            DOMUtils domUtils = new DOMUtils(doc, xpathUtils);
                            domUtils.addNS("idf", "http://www.portalu.de/IDF/1.0");
                            
                            IdfUtils idfUtils = new IdfUtils(sqlUtils, domUtils, xpathUtils);
    
                            Bindings bindings = engine.createBindings();
                            bindings.put("sourceRecord", record);
                            bindings.put("idfDoc", doc);
                            bindings.put("igcProfileControlNode", igcProfileNode);
                            bindings.put("log", log);
                            bindings.put("SQL", sqlUtils);
                            bindings.put("XPATH", xpathUtils);
                            bindings.put("TRANSF", trafoUtils);
                            bindings.put("DOM", domUtils);
                            bindings.put("IDF", idfUtils);
    
                            // backwards compatibility
                            if (System.getProperty( "java.version" ).startsWith( "1.8" )) {
                                igcProfileCswMapping = "load('nashorn:mozilla_compat.js');" + igcProfileCswMapping;
                                // somehow the contant cannot be accessed!?
                                // convert id to number to be used in PreparedStatement as Integer to avoid postgres error !
                                igcProfileCswMapping = igcProfileCswMapping.replaceAll( "sourceRecord.get\\(DatabaseSourceRecord.ID\\)", "+sourceRecord.get(DatabaseSourceRecord.ID)" );
                                // then replace placeholder
                                igcProfileCswMapping = igcProfileCswMapping.replaceAll( "DatabaseSourceRecord.ID", "'" + DatabaseSourceRecord.ID + "'" );
                            }
                            engine.eval(new StringReader(igcProfileCswMapping), bindings);
                        } catch (Exception e) {
                            log.error("Error mapping source record to idf document.", e);
                            throw e;
                        }
                    }
                }
                
            }
        } catch (SQLException e) {
            log.error("Error mapping IGC profile.", e);
            throw e;
        } finally {
        	// isClosed() CAUSES EXCEPTION ON ORACLE !!!
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

}
