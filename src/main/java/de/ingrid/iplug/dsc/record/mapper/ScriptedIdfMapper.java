/**
 * 
 */
package de.ingrid.iplug.dsc.record.mapper;

import java.io.InputStreamReader;
import java.sql.Connection;

import javax.script.Bindings;
import javax.script.Compilable;
import javax.script.CompiledScript;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;

import org.apache.log4j.Logger;
import org.springframework.core.io.Resource;
import org.w3c.dom.Document;

import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.IdfNamespaceContext;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.iplug.dsc.utils.SQLUtils;
import de.ingrid.iplug.dsc.utils.TransformationUtils;
import de.ingrid.utils.xml.XPathUtils;

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
public class ScriptedIdfMapper implements IIdfMapper {

    private Resource mappingScript;

    private boolean compile = false;

    private ScriptEngine engine;
    private CompiledScript compiledScript;

    private static final Logger log = Logger.getLogger(ScriptedIdfMapper.class);

    @Override
    public void map(SourceRecord record, Document doc) throws Exception {
        if (mappingScript == null) {
            log.error("Mapping script is not set!");
            throw new IllegalArgumentException("Mapping script is not set!");
        }
        try {
            if (engine == null) {
                String scriptName = mappingScript.getFilename();
                String extension = scriptName.substring(scriptName
                        .lastIndexOf('.') + 1, scriptName.length());
                ScriptEngineManager mgr = new ScriptEngineManager();
                engine = mgr.getEngineByExtension(extension);
                if (compile) {
                    if (engine instanceof Compilable) {
                        Compilable compilable = (Compilable) engine;
                        compiledScript = compilable
                                .compile(new InputStreamReader(mappingScript
                                        .getInputStream()));
                    }
                }
            }

            // create utils for script
            Connection connection = (Connection) record.get(DatabaseSourceRecord.CONNECTION);
            SQLUtils sqlUtils = SQLUtils.getInstance(connection);
            // initialize static XPathUtils (encapsulated static XPath instance))
            XPathUtils.getXPathInstance(new IdfNamespaceContext());
            XPathUtils xpathUtils = XPathUtils.getInstance();
            TransformationUtils trafoUtils = TransformationUtils.getInstance(sqlUtils);

            Bindings bindings = engine.createBindings();
            bindings.put("sourceRecord", record);
            bindings.put("idfDoc", doc);
            bindings.put("log", log);
            bindings.put("SQL", sqlUtils);
            bindings.put("XPATH", xpathUtils);
            bindings.put("TRANSF", trafoUtils);

            if (compiledScript != null) {
                compiledScript.eval(bindings);
            } else {
                engine.eval(new InputStreamReader(mappingScript
                        .getInputStream()), bindings);
            }
        } catch (Exception e) {
            log.error("Error mapping source record to idf document.", e);
            throw e;
        }
    }

    public Resource getMappingScript() {
        return mappingScript;
    }

    public void setMappingScript(Resource mappingScript) {
        this.mappingScript = mappingScript;
    }

    public boolean isCompile() {
        return compile;
    }

    public void setCompile(boolean compile) {
        this.compile = compile;
    }

}
