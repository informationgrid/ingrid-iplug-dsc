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

import org.json.simple.JSONObject;
import org.junit.Assert;
import org.junit.Test;

import java.util.Map;

public class BwstrLocUtilTest {

    @Test
    public void testParse() {
        BwstrLocUtil blo = new BwstrLocUtil();
        Object o = blo
                .parse( "{ \"result\": [ { \"qid\": 1, \"bwastrid\": \"3901\", \"stationierung\": { \"km_von\": 729, \"km_bis\": 776, \"offset\": 0 }, \"spatialReference\": { \"wkid\": 4326 }, \"bwastr_name\": \"Rhein\", \"strecken_name\": \"Hauptstrecke\", \"geometry\": { \"type\": \"MultiLineString\", \"coordinates\": [ [ [ 6.79684033835204, 51.163654438625 ], [ 6.79697299471522, 51.1639443860597 ], [ 6.7970996759491, 51.1642352410417 ], [ 6.79722042477812, 51.1645270919987 ], [ 6.79733428546954, 51.1648174395211 ], [ 6.7974422273486, 51.1651085412906 ] ], [ [ 6.72644832190901, 51.3270606108592 ], [ 6.72629234256014, 51.3271567116764 ], [ 6.72613603175844, 51.3272526010672 ], [ 6.72597939023267, 51.3273482785834 ] ] ], \"measures\": [ 729, 729.033, 729.067, 729.1, 729.133, 729.167, 729.2, 729.233, 729.267, 729.3, 729.333, 729.367, 729.4, 729.433, 729.467, 729.5, 729.533, 729.567 ] } } ]}" );
        Assert.assertNotNull( o );
        Assert.assertTrue( o instanceof JSONObject );
    }

    @Test
    public void testGetCenter() {
        BwstrLocUtil blo = new BwstrLocUtil();
        double[] o = blo
                .getCenter( blo
                        .parse( "{ \"result\": [ { \"qid\": 1, \"bwastrid\": \"3901\", \"stationierung\": { \"km_von\": 729, \"km_bis\": 776, \"offset\": 0 }, \"spatialReference\": { \"wkid\": 4326 }, \"bwastr_name\": \"Rhein\", \"strecken_name\": \"Hauptstrecke\", \"geometry\": { \"type\": \"MultiLineString\", \"coordinates\": [ [ [ 6.79684033835204, 51.163654438625 ], [ 6.79697299471522, 51.1639443860597 ], [ 6.7970996759491, 51.1642352410417 ], [ 6.79722042477812, 51.1645270919987 ], [ 6.79733428546954, 51.1648174395211 ], [ 6.7974422273486, 51.1651085412906 ] ], [ [ 6.72644832190901, 51.3270606108592 ], [ 6.72629234256014, 51.3271567116764 ], [ 6.72613603175844, 51.3272526010672 ], [ 6.72597939023267, 51.3273482785834 ] ] ], \"measures\": [ 729, 729.033, 729.067, 729.1, 729.133, 729.167, 729.2, 729.233, 729.267, 729.3, 729.333, 729.367, 729.4, 729.433, 729.467, 729.5, 729.533, 729.567 ] } } ]}" ) );
        Assert.assertNotNull( o );
        Assert.assertEquals( 6.79733428546954, o[0], 0.0001 );
        Assert.assertEquals( 51.1648174395211, o[1], 0.0001 );
    }

    @Test
    public void testGetBBOX() {
        BwstrLocUtil blo = new BwstrLocUtil();
        Double[] o = blo
                .getBBOX( blo
                        .parse( "{ \"result\": [ { \"qid\": 1, \"bwastrid\": \"3901\", \"stationierung\": { \"km_von\": 729, \"km_bis\": 776, \"offset\": 0 }, \"spatialReference\": { \"wkid\": 4326 }, \"bwastr_name\": \"Rhein\", \"strecken_name\": \"Hauptstrecke\", \"geometry\": { \"type\": \"MultiLineString\", \"coordinates\": [ [ [ 6.79684033835204, 51.163654438625 ], [ 6.79697299471522, 51.1639443860597 ], [ 6.7970996759491, 51.1642352410417 ], [ 6.79722042477812, 51.1645270919987 ], [ 6.79733428546954, 51.1648174395211 ], [ 6.7974422273486, 51.1651085412906 ] ], [ [ 6.72644832190901, 51.3270606108592 ], [ 6.72629234256014, 51.3271567116764 ], [ 6.72613603175844, 51.3272526010672 ], [ 6.72597939023267, 51.3273482785834 ] ] ], \"measures\": [ 729, 729.033, 729.067, 729.1, 729.133, 729.167, 729.2, 729.233, 729.267, 729.3, 729.333, 729.367, 729.4, 729.433, 729.467, 729.5, 729.533, 729.567 ] } } ]}" ) );
        Assert.assertNotNull( o );
        Assert.assertEquals( 6.72597939023267, o[0], 0.0001 );
        Assert.assertEquals( 6.7974422273486, o[1], 0.0001 );
        Assert.assertEquals( 51.163654438625, o[2], 0.0001 );
        Assert.assertEquals( 51.3273482785834, o[3], 0.0001 );
    }
    
    @Test
    public void testGetLocationNames() {
        BwstrLocUtil blo = new BwstrLocUtil();
        String[] o = blo
                .getLocationNames( blo
                        .parse( "{ \"result\": [ { \"qid\": 1, \"bwastrid\": \"3901\", \"stationierung\": { \"km_von\": 729, \"km_bis\": 776, \"offset\": 0 }, \"spatialReference\": { \"wkid\": 4326 }, \"bwastr_name\": \"Rhein\", \"strecken_name\": \"Hauptstrecke\", \"geometry\": { \"type\": \"MultiLineString\", \"coordinates\": [ [ [ 6.79684033835204, 51.163654438625 ], [ 6.79697299471522, 51.1639443860597 ], [ 6.7970996759491, 51.1642352410417 ], [ 6.79722042477812, 51.1645270919987 ], [ 6.79733428546954, 51.1648174395211 ], [ 6.7974422273486, 51.1651085412906 ] ], [ [ 6.72644832190901, 51.3270606108592 ], [ 6.72629234256014, 51.3271567116764 ], [ 6.72613603175844, 51.3272526010672 ], [ 6.72597939023267, 51.3273482785834 ] ] ], \"measures\": [ 729, 729.033, 729.067, 729.1, 729.133, 729.167, 729.2, 729.233, 729.267, 729.3, 729.333, 729.367, 729.4, 729.433, 729.467, 729.5, 729.533, 729.567 ] } } ]}" ) );
        Assert.assertNotNull( o );
        Assert.assertArrayEquals( new String[] { "Rhein", "Hauptstrecke" }, o );
    }
    

    @Test
    public void testIsBwstrIdAndKm() {
        BwstrLocUtil blo = new BwstrLocUtil();
        Assert.assertTrue( blo.isBwstrIdAndKm( "3901-23-34" ) );
        Assert.assertTrue( blo.isBwstrIdAndKm( "3901-23.45-34.56" ) );
        Assert.assertFalse( blo.isBwstrIdAndKm( "3901-23.45-34,56" ) );
        Assert.assertFalse( blo.isBwstrIdAndKm( "3901-23.45-34.56-" ) );
        Assert.assertFalse( blo.isBwstrIdAndKm( "3901-23,45-34,56" ) );
        Assert.assertFalse( blo.isBwstrIdAndKm( null ) );
    }

    @Test
    public void testParseBwstrIdAndKm() {
        BwstrLocUtil blo = new BwstrLocUtil();
        Assert.assertArrayEquals( new String[] { "3901", "23", "34" }, blo.parseBwstrIdAndKm( "3901-23-34" ) );
        Assert.assertArrayEquals( new String[] { "3901", "23.45", "34.56" }, blo.parseBwstrIdAndKm( "3901-23.45-34.56" ) );
        Assert.assertNull( blo.parseBwstrIdAndKm( "3901-23.45-34,56" ) );
        Assert.assertNull( blo.parseBwstrIdAndKm( "3901-23.45-34.56-" ) );
        Assert.assertNull( blo.parseBwstrIdAndKm( "3901-23,45-34,56" ) );
        Assert.assertNull( blo.parseBwstrIdAndKm( "null" ) );
    }

    @Test
    public void testParseCenterSectionFromBwstrIdAndKm() {
        BwstrLocUtil blo = new BwstrLocUtil();
        Assert.assertArrayEquals( new String[] {"3901", "752.0", "753.0"}, blo.parseCenterSectionFromBwstrIdAndKm( "3901-729-776" ) );
        Assert.assertArrayEquals( new String[] {"3901", "729.0", "730.0"}, blo.parseCenterSectionFromBwstrIdAndKm( "3901-729-730" ) );
        Assert.assertNull( blo.parseCenterSectionFromBwstrIdAndKm( "3901-23.45-34,56" ) );
        Assert.assertNull( blo.parseCenterSectionFromBwstrIdAndKm( null ) );
    }

    @Test
    public void testDoBWaStrInfoQuery() {
        BwstrLocUtil blo = new BwstrLocUtil();
        Map<String, String> result;

        result = blo.doBWaStrInfoQuery("400");
        Assert.assertNotNull(result);
        Assert.assertEquals("0400", result.get("bwastrid"));
        Assert.assertEquals("Donau", result.get("bwastr_name"));
        Assert.assertEquals("Haupt- und Nebenstrecken", result.get("strecken_name"));

        result = blo.doBWaStrInfoQuery("0401");
        Assert.assertEquals("0401", result.get("bwastrid"));
        Assert.assertEquals("Donau", result.get("bwastr_name"));
        Assert.assertEquals("Hauptstrecke", result.get("strecken_name"));

        result = blo.doBWaStrInfoQuery("3915");
        Assert.assertEquals("3915", result.get("bwastrid"));
        Assert.assertEquals("Rhein", result.get("bwastr_name"));
        Assert.assertEquals("Nebenarm Mühlarm Nackenheim", result.get("strecken_name"));
    }

}
