package de.ingrid.iplug.dsc.utils;

import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Hashtable;
import java.util.Map;

import javax.script.Bindings;
import javax.script.Compilable;
import javax.script.CompiledScript;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;

import org.springframework.core.io.Resource;

/**
 * This class allows to execute scripts
 * @author ingo@wemove.com
 */
public class ScriptEngine {

	protected static ScriptEngineManager scriptEngineManager = new ScriptEngineManager();
	protected static Map<String, javax.script.ScriptEngine> engines = new Hashtable<String, javax.script.ScriptEngine>();
	protected static Map<String, CompiledScript> compiledScripts = new Hashtable<String, CompiledScript>();

	/**
	 * Execute the given scripts with the given parameters
	 * @param scripts The script files
	 * @param parameters The parameters
	 * @param compile Boolean indicating whether to compile the script or not
	 * @return Map with the absolute paths of the scripts as keys and the execution results as values
	 * If an execution returns null, the result will not be added
	 * @throws Exception
	 */
	public static Map<String, Object> execute(Resource[] scripts, Map<String, Object> parameters, boolean compile) throws Exception {

		Map<Integer, Bindings> bindings = new Hashtable<Integer, Bindings>();
		Map<String, Object> results = new Hashtable<String, Object>();

		for (Resource script : scripts) {
			// get the engine for the script
			javax.script.ScriptEngine engine = getEngine(script);

			// initialize/get the bindings
			if (!bindings.containsKey(engine.hashCode())) {
				Bindings newBindings = engine.createBindings();
				newBindings.putAll(parameters);
				bindings.put(engine.hashCode(), newBindings);
			}
			Bindings curBindings = bindings.get(engine.hashCode());

			// execute the script
			CompiledScript compiledScript = null;
			Object result = null;
			if (compile && (compiledScript = getCompiledScript(script)) != null) {
				result = compiledScript.eval(curBindings);
			} else {
				result = engine.eval(new InputStreamReader(script.getInputStream()), curBindings);
			}
			if (result != null) {
				results.put(script.getFilename(), result);
			}
		}
		return results;
	}

	/**
	 * Get the compiled version of the given script
	 * @param script The script file
	 * @return CompiledScript
	 * @throws ScriptException
	 * @throws IOException 
	 */
	protected static CompiledScript getCompiledScript(Resource script) throws ScriptException, IOException {
		String filename = script.getFilename();
		if (!compiledScripts.containsKey(filename)) {
			javax.script.ScriptEngine engine = getEngine(script);
			if (engine instanceof Compilable) {
				Compilable compilable = (Compilable)engine;
				CompiledScript compiledScript = compilable.compile(new InputStreamReader(script.getInputStream()));
				compiledScripts.put(filename, compiledScript);
			}
		}
		return compiledScripts.get(filename);
	}

	/**
	 * Get the scripting engine for the given script file
	 * @param script The script file
	 * @return javax.script.ScriptEngine
	 */
	protected static javax.script.ScriptEngine getEngine(Resource script) {
        String scriptName = script.getFilename();
        String extension = scriptName.substring(scriptName.lastIndexOf('.') + 1, scriptName.length());
		if (!engines.containsKey(extension)) {
			javax.script.ScriptEngine engine = scriptEngineManager.getEngineByExtension(extension);
			engines.put(extension, engine);
		}
		return engines.get(extension);
	}
}
