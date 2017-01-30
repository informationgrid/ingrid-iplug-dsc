/*-
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2017 wemove digital solutions GmbH
 * ==================================================
 * Licensed under the EUPL, Version 1.1 or – as soon they will be
approved by the European Commission - subsequent versions of the
EUPL (the "Licence");

You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at:

http://ec.europa.eu/idabc/eupl5

Unless required by applicable law or agreed to in writing, software
distributed under the Licence is distributed on an "AS IS" basis,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the Licence for the specific language governing permissions and
limitations under the Licence.
 * **************************************************#
 */
package de.ingrid.iplug.dsc.utils;

import static org.junit.Assert.assertEquals;

import java.io.IOException;
import java.util.Map;

import org.junit.Test;

public class TransformationUtilsTest {

    @Test
    public void test() throws IOException {
        TransformationUtils tu = new TransformationUtils(null);
        Map<String, String> m = tu.transformIGCTimeFields( "0.0", "434566.23", "von" );
        assertEquals( "0.0", m.get( "t1" ));
        assertEquals( "434566.23", m.get( "t2" ));
    }

}
