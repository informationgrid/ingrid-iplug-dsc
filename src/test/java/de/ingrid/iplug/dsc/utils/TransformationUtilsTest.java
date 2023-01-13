/*-
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2023 wemove digital solutions GmbH
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
        
        assertEquals( "2016-07-06T13:12:11.456+02:00", tu.getISODateFromIGCDate( "20160706131211456" ));
        assertEquals( "2016-01-06T13:12:11.456+01:00", tu.getISODateFromIGCDate( "20160106131211456" ));
        
        assertEquals( "1968-01-06T13:12:11.456+01:00", tu.getISODateFromIGCDate( "19680106131211456" ));
        // since wrong handling of summer time in IGE: INPUT 1950-07-06T14:12:11 stores 1950-07-06T13:12:11
        // see https://dev.informationgrid.eu/redmine/issues/439
        // see UtilsCSWDate.fixIgcDateString()
        assertEquals( "1950-07-06T14:12:11+01:00", tu.getISODateFromIGCDate( "19500706131211" ));
        
        assertEquals("20211220185853321", tu.millisecondsToTimestamp("1640023133321"));
    }
    
}
