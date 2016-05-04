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
/**
 * 
 */
package de.ingrid.iplug.dsc.record.mapper;

import java.sql.Connection;
import java.util.Hashtable;
import java.util.Map;

import org.apache.log4j.Logger;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.Resource;
import org.w3c.dom.Document;

import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.iplug.dsc.utils.DOMUtils;
import de.ingrid.iplug.dsc.utils.SQLUtils;
import de.ingrid.iplug.dsc.utils.ScriptEngine;
import de.ingrid.iplug.dsc.utils.TransformationUtils;
import de.ingrid.utils.capabilities.CapabilitiesUtils;
import de.ingrid.utils.xml.IDFNamespaceContext;
import de.ingrid.utils.xpath.XPathUtils;

/**
 * 
 * Maps a {@link SourceRecord} into an InGrid Detail data Format (IDF).
 * <p />
 * This class takes a {@link Resource} as parameter to specify the mapping
 * script. The scripting engine will be automatically determined from the
 * extension of the mapping script.
 * <p />
 * If the {@link compile} parameter is set to true, the script is compiled, if
 * the ScriptEngine supports compilation.
 * <p/>
 * The mapper expects a base IDF format already present in {@link doc}. *
 * 
 * @author joachim@wemove.com
 * 
 */
@Order(2)
public class ScriptedIdfMapper implements IIdfMapper {

    private Resource[] mappingScripts;
    private boolean compile = false;

    private static final Logger log = Logger.getLogger(ScriptedIdfMapper.class);

    @Override
    public void map(SourceRecord record, Document doc) throws Exception {
        if (mappingScripts == null) {
            log.error("Mapping script(s) not set!");
            throw new IllegalArgumentException("Mapping script(s) not set!");
        }
        try {
            // create utils for script
            Connection connection = (Connection) record.get(DatabaseSourceRecord.CONNECTION);
            SQLUtils sqlUtils = new SQLUtils(connection);
            // initialize static XPathUtils (encapsulated static XPath
            // instance))
            XPathUtils xpathUtils = new XPathUtils(new IDFNamespaceContext());
            TransformationUtils trafoUtils = new TransformationUtils(sqlUtils);
            DOMUtils domUtils = new DOMUtils(doc, xpathUtils);
            domUtils.addNS("idf", "http://www.portalu.de/IDF/1.0");

			Map<String, Object> parameters = new Hashtable<String, Object>();
			parameters.put("sourceRecord", record);
			parameters.put("idfDoc", doc);
			parameters.put("log", log);
			parameters.put("SQL", sqlUtils);
			parameters.put("XPATH", xpathUtils);
			parameters.put("TRANSF", trafoUtils);
			parameters.put("DOM", domUtils);
            parameters.put("CAPABILITIES", new CapabilitiesUtils());
			parameters.put("javaVersion", System.getProperty( "java.version" ));

			ScriptEngine.execute(this.mappingScripts, parameters, compile);
        } catch (Exception e) {
            log.error("Error mapping source record to idf document.", e);
            throw e;
        }
    }

    public Resource[] getMappingScripts() {
        return mappingScripts;
    }

	public void setMappingScripts(Resource[] mappingScripts) {
		this.mappingScripts = mappingScripts;
	}

    public boolean isCompile() {
        return compile;
    }

    public void setCompile(boolean compile) {
        this.compile = compile;
    }

}
