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
