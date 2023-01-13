/*-
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2022 wemove digital solutions GmbH
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

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.MultiThreadedHttpConnectionManager;
import org.apache.commons.httpclient.methods.GetMethod;
import org.apache.commons.httpclient.methods.PostMethod;
import org.apache.commons.httpclient.methods.RequestEntity;
import org.apache.commons.httpclient.methods.StringRequestEntity;
import org.apache.log4j.Logger;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;

/**
 * Utility Class to communicate with the Bundeswasserstrassenlocator.
 * 
 * @author jm
 *
 */
public class BwstrLocUtil {

    private HttpClient httpclient = null;

    private String bwstrLocSearch = "https://via.bund.de/wsv/bwastr-locator/rest/bwastrinfo/query?limit=1&searchfield=bwastrid&searchterm=";
    private String bwstrLocEndpoint = "https://via.bund.de/wsv/bwastr-locator/rest/geokodierung/query";

    private static final Logger log = Logger.getLogger( BwstrLocUtil.class );

    private HttpClient getHttpClient() {
        if (httpclient == null) {
            httpclient = createHttpClient();
        }
        return httpclient;
    }
    
    private HttpClient createHttpClient() {
        HttpClient client = new HttpClient( new MultiThreadedHttpConnectionManager() );
        if (System.getProperty("http.proxyHost") != null && System.getProperty("http.proxyPort") != null) {
            client.getHostConfiguration().setProxy(System.getProperty("http.proxyHost"), Integer.parseInt(System.getProperty("http.proxyPort")));
        }
        return client;
    }

    /**
     * Get the response from BwStrLoc using Referencesystem 4326 and distance 0.
     * 
     * @param bwStrId
     * @param kmFrom
     * @param kmTo
     * @return
     */
    public String getResponse(String bwStrId, String kmFrom, String kmTo) {
        String response = null;

        if((kmFrom == null || kmFrom.isEmpty()) && (kmTo == null || kmTo.isEmpty())) {
            GetMethod get = new GetMethod( bwstrLocSearch + bwStrId );
            int resp;
            try {
                resp = getHttpClient().executeMethod( get );
                if (resp != 200) {
                    throw new Exception( "Invalid HTTP Response Code.: " + resp );
                }
                response = get.getResponseBodyAsString();
                JSONObject questJson = parse( response );
                if(questJson.containsKey("result")) {
                    JSONArray questJsonArray = (JSONArray) questJson.get( "result" );
                    for (int i = 0; i < questJsonArray.size(); i++) {
                        JSONObject questJsonEntry = (JSONObject) questJsonArray.get( i );
                        if(questJsonEntry.containsKey("km_von") && questJsonEntry.containsKey("km_bis")) {
                            kmFrom = questJsonEntry.get( "km_von" ).toString();
                            kmTo = questJsonEntry.get( "km_bis" ).toString();
                            break;
                        }
                    }
                }
            } catch (Exception e) {
                log.error( "Error getting response from BwStrLocSearch at: " + bwstrLocEndpoint + bwStrId);
            } finally {
                get.releaseConnection();
            }
        }
        if(kmFrom != null && !kmFrom.isEmpty() && kmTo != null && !kmTo.isEmpty()) {
            PostMethod post = new PostMethod( bwstrLocEndpoint );
            post.setParameter( "Content-Type", "application/json" );
    
            try {
                RequestEntity reqE = new StringRequestEntity( "{\"queries\":[{\"qid\":1,\"bwastrid\":\"" + bwStrId + "\",\"stationierung\":{\"km_von\":" + kmFrom + ",\"km_bis\":"
                        + kmTo + ",\"offset\":0},\"spatialReference\":{\"wkid\":4326}}]}", "application/json", "UTF-8" );
                post.setRequestEntity( reqE );
                int resp = getHttpClient().executeMethod( post );
                if (resp != 200) {
                    throw new Exception( "Invalid HTTP Response Code.: " + resp );
                }
                response = post.getResponseBodyAsString();
                log.debug(String.format("Geocoding response from BWaStr. Locator for BWaStr. ID: %s, start km: %s, end km: %s, is: %s", bwStrId, kmFrom, kmTo, response));
            } catch (Exception e) {
                log.error( "Error getting response from BwStrLocator at: " + bwstrLocEndpoint );
            } finally {
                post.releaseConnection();
            }
        } else {
            log.error( "No BwStrLocator data found for ID: " + bwStrId );
        }
        return response;
    }

    /**
     * Parse a BwstrLoc response into a JSONObject.
     * 
     * @param response
     * @return
     */
    public JSONObject parse(String response) {
        JSONObject result = null;
        JSONParser parser = new JSONParser();
        try {
            result = (JSONObject) parser.parse( response );
        } catch (Exception e) {
            log.error( "Error parsing BwstrLoc response: " + response );
        }
        return result;
    }

    /**
     * Get the center coordinate from the parsed response.
     * 
     * @param parsedResponse
     * @return The center in Double[centerLon, centerLat].
     */
    public double[] getCenter(JSONObject parsedResponse) {
        double[] result = { Double.NaN, Double.NaN };
        try {
            JSONObject re = (JSONObject) ((JSONArray) parsedResponse.get( "result" )).get( 0 );
            JSONArray coordinates = (JSONArray) ((JSONObject) re.get( "geometry" )).get( "coordinates" );
            int maxNoOfCoordinates = 0;
            for (int i = 0; i < coordinates.size(); i++) {
                JSONArray a = (JSONArray) coordinates.get( i );
                maxNoOfCoordinates += a.size();
            }
            int cnt = 0;
            int centerCnt = ((int) (maxNoOfCoordinates / 2));

            for (Object c : coordinates) {
                JSONArray a = (JSONArray) c;
                for (Object cc : a) {
                    cnt++;
                    JSONArray aa = (JSONArray) cc;
                    double lon = (Double) aa.get( 0 );
                    double lat = (Double) aa.get( 1 );
                    if (cnt == centerCnt) {
                        result[0] = lon;
                        result[1] = lat;
                        break;
                    }
                }
            }
        } catch (Exception e) {
            log.error( "Error parsing BwstrLoc response: " + parsedResponse.toJSONString(), e );
        }
        return result;
    }

    /**
     * Get the bounding box of the parsed response.
     * 
     * @param parsedResponse
     * @return The bounding box [minLon, maxLon, minLat, maxLat].
     */
    public Double[] getBBOX(JSONObject parsedResponse) {

        Double[] result = null;

        JSONObject re = (JSONObject) ((JSONArray) parsedResponse.get( "result" )).get( 0 );
        JSONArray coordinates = (JSONArray) ((JSONObject) re.get( "geometry" )).get( "coordinates" );
        Double maxLon = null;
        Double maxLat = null;
        Double minLon = null;
        Double minLat = null;

        for (Object c : coordinates) {
            JSONArray a = (JSONArray) c;
            for (Object cc : a) {
                JSONArray aa = (JSONArray) cc;
                double lon = (Double) aa.get( 0 );
                double lat = (Double) aa.get( 1 );
                if (maxLon == null)
                    maxLon = lon;
                if (maxLat == null)
                    maxLat = lat;
                if (minLon == null)
                    minLon = lon;
                if (minLat == null)
                    minLat = lat;
                if (lon > maxLon)
                    maxLon = lon;
                if (lon < minLon)
                    minLon = lon;
                if (lat > maxLat)
                    maxLat = lat;
                if (lat < minLat)
                    minLat = lat;
            }
        }

        result = new Double[] { minLon, maxLon, minLat, maxLat };

        return result;
    }
    
    /**
     * Get the location names 'bwastr_name' and 'strecken_name' from the parsed response.
     * 
     * @param parsedResponse
     * @return String array containing [bwastr_name, strecken_name] or null in case or parsing error.
     */
    public String[] getLocationNames(JSONObject parsedResponse) {
        String[] result = null;
        try {
            JSONObject re = (JSONObject) ((JSONArray) parsedResponse.get( "result" )).get( 0 );
            result = new String[] {(String)re.get( "bwastr_name" ), (String)re.get( "strecken_name" )};
        } catch (Exception e) {
            log.error( "Error getting 'bwastr_name' and 'strecken_name' from parsed response.", e );
        }
        return result;
    }

    
    static final Pattern BWSTRID_AND_KM_PATTERN = Pattern.compile( "[0-9]+\\-[0-9]+(\\.[0-9]+)?\\-[0-9]+(\\.[0-9]+)?" );

    /**
     * Checks if bwStrIdAndKm follows the pattern <Wasserstrassen
     * ID>-<km_from>-<km_to> ([0-9]+\-[0-9]+(\.[0-9]+)?\-[0-9]+(\.[0-9]+)?).
     * 
     * @param bwStrIdAndKm
     * @return
     */
    public boolean isBwstrIdAndKm(String bwStrIdAndKm) {
        if (bwStrIdAndKm == null) {
            return false;
        }

        return BWSTRID_AND_KM_PATTERN.matcher( bwStrIdAndKm ).matches();
    }
    
    /**
     * Checks and parses a String according to the pattern <Wasserstrassen ID>-<km_from>-<km_to>.
     * If the distance is > 1 km then the from to section is computed
     * with kmFrom = center-0.5km and kmTo = center+0.5km.
     * 
     * @param bwStrIdAndKm
     * @return Returns array with [Wasserstrassen ID, km_from, km_to].
     */
    public String[] parseCenterSectionFromBwstrIdAndKm(String bwStrIdAndKm) {
        String[] parts = parseBwstrIdAndKm(bwStrIdAndKm);
        if (parts != null) {
            Double from = Double.parseDouble( parts[1] );
            Double to = Double.parseDouble( parts[2] );
            Double distance = to - from;
            if (distance > 1.0) {
                Double center = from + (to - from) / 2;
                from = center - 0.5;
                to = center + 0.5;
            }
            return new String[] {parts[0], from.toString(), to.toString()};
        }
        return null;
    }
    
    /**
     * Checks and parses a String according to the pattern <Wasserstrassen ID>-<km_from>-<km_to>.
     * 
     * @param bwStrIdAndKm
     * @return Returns array with [Wasserstrassen ID, km_from, km_to].
     */
    public String[] parseBwstrIdAndKm(String bwStrIdAndKm) {
        if (isBwstrIdAndKm(bwStrIdAndKm)) {
            String[] parts = bwStrIdAndKm.split( "-" );
            return parts;
        }
        return null;
    }
    

    public String getBwstrLocUrl() {
        return bwstrLocEndpoint;
    }

    /**
     * Uses the BWaStr-Locator to get the waterway name and the waterway-stretch
     * name for the provieded BWaStr-ID. This method adds leading zeros to the
     * provided BWaStr.-ID. Also one is added to BWaStr.-IDs ending in 00.
     * Examples of converted BWaStr.IDs are: 400 -> 0401 and 3900 -> 3901.
     * Following parameters are returned:
     * <ul>
     *     <li>{@code bwastrid}: the BWaStr.-ID used for the query (converted if necessary)</li>
     *     <li>{@code bwastr_name}: Name of the waterway for the first hit returned by the BWaStr.-Locator</li>
     *     <li>{@code strecken_name}: Name of the waterway-stretch for the first hit returned by the BWaStr.-Locator</li>
     * </ul>
     *
     * @param bwastrId BWaStr.-ID for the query
     * @return BWaStr-ID used for the query, waterway name of the first hit, waterway-stretch name of the first hit
     */
    public Map<String, String> doBWaStrInfoQuery(String bwastrId) {
        while(bwastrId.length() < 4) {
            bwastrId = "0" + bwastrId;
        }

        // BWaStr.-Locator database doesn't include collective "Haupt- und
        // Nebenstrecken" entries. Convert these to the ID for the "Hauptstrecke"
        String id = bwastrId.replaceAll("00$", "01");
        GetMethod get = new GetMethod(bwstrLocSearch + id);
        get.setRequestHeader("Content-Type", "application/json");

        try {
            int responseCode = getHttpClient().executeMethod(get);
            if (responseCode != 200) {
                log.error("Invalid HTTP Response code from BWaStr.-Locator: " + responseCode);
            }
            String responseString = get.getResponseBodyAsString();
            JSONObject responseJson = parse(responseString);
            JSONArray arr = (JSONArray) responseJson.get("result");
            JSONObject firstHit = (JSONObject) arr.get(0);

            Map<String, String> result = new HashMap<>();
            result.put("bwastrid", bwastrId);
            result.put("bwastr_name", (String) firstHit.get("bwastr_name"));

            if (bwastrId.endsWith("00")) {
                result.put("strecken_name", "Haupt- und Nebenstrecken");
            } else {
                result.put("strecken_name", (String) firstHit.get("strecken_name"));
            }

            return result;
        } catch (IOException e) {
            log.error( "Error getting response from BwStrLocator at: " + bwstrLocSearch, e );
        }

        return null;
    }

    /**
     * Sets the endpoint of the Bundeswasserstrassenlocator. Updates the httpClient with 
     * the new endpoint.
     * 
     * Defaults to:
     * 
     * https://atlas.wsv.bund.de/bwastr-locator/rest/geokodierung/query
     * 
     * @param bwstrLocUrl
     */
    public void setBwstrLocUrl(String bwstrLocUrl) {
        this.bwstrLocEndpoint = bwstrLocUrl;
        httpclient = createHttpClient();
    }


}
