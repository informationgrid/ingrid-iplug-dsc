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
