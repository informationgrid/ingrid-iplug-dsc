package de.ingrid.iplug.dsc.om;

import java.util.HashMap;

/**
 * Base class for all source record classes. This is a flexible structure
 * (HashMap). It can hold all kind of information.
 * 
 * @author joachim@wemove.com
 * 
 */
public class SourceRecord extends HashMap<String, Object> {

    public static final String ID = "id";

    private static final long serialVersionUID = -1879989139825006688L;

    public SourceRecord(String id) {
        this.put(ID, id);
    }

}
