/**
 * 
 */
package de.ingrid.iplug.dsc.index.mapper;

import java.io.InputStreamReader;
import java.sql.Connection;

import javax.script.Bindings;
import javax.script.Compilable;
import javax.script.CompiledScript;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;

import org.apache.log4j.Logger;
import org.apache.lucene.document.Document;
import org.springframework.core.io.Resource;

import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.iplug.dsc.utils.IndexUtils;
import de.ingrid.iplug.dsc.utils.SQLUtils;

/**
 * Script based source record to lucene document mapping. This class takes a
 * {@link Resource} as parameter to specify the mapping script. The scripting
 * engine will be automatically determined from the extension of the mapping
 * script.
 * <p />
 * If the {@link compile} parameter is set to true, the script is compiled, if
 * the ScriptEngine supports compilation.
 * 
 * @author joachim@wemove.com
 * 
 */
public class ScriptedDocumentMapper implements IRecordMapper {

    private Resource mappingScript;

    private boolean compile = false;

    private ScriptEngine engine;
    private CompiledScript compiledScript;

    private static final Logger log = Logger.getLogger(ScriptedDocumentMapper.class);

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
            IndexUtils idxUtils = IndexUtils.getInstance(doc);
            
            Bindings bindings = engine.createBindings();
            bindings.put("sourceRecord", record);
            bindings.put("luceneDoc", doc);
            bindings.put("log", log);
            bindings.put("SQL", sqlUtils);
            bindings.put("IDX", idxUtils);

            if (compiledScript != null) {
                compiledScript.eval(bindings);
            } else {
                engine.eval(new InputStreamReader(mappingScript
                        .getInputStream()), bindings);
            }
        } catch (Exception e) {
            log.error("Error mapping source record to lucene document.", e);
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
