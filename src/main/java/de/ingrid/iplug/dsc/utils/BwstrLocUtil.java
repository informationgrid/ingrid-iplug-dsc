package de.ingrid.iplug.dsc.utils;

import java.util.regex.Pattern;

import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.MultiThreadedHttpConnectionManager;
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

    private String bwstrLocUrl = "https://atlas.wsv.bund.de/bwastr-locator/rest/geokodierung/query";

    private static final Logger log = Logger.getLogger( BwstrLocUtil.class );

    private HttpClient getHttpClient() {
        if (httpclient == null) {
            httpclient = new HttpClient( new MultiThreadedHttpConnectionManager() );
        }
        return httpclient;
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

        PostMethod post = new PostMethod( bwstrLocUrl );
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
        } catch (Exception e) {
            log.error( "Error getting response from BwStrLocator at: " + bwstrLocUrl );
        } finally {
            post.releaseConnection();
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
    public Double[] getCenter(JSONObject parsedResponse) {

        Double[] result = null;
        
        
        try {
            JSONObject re = (JSONObject) ((JSONArray) parsedResponse.get( "result" )).get( 0 );
            JSONArray coordinates = (JSONArray) ((JSONObject) re.get( "geometry" )).get( "coordinates" );
            int maxNoOfCoordinates = 0;
            Double centerLon = null;
            Double centerLat = null;
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
                        centerLon = lon;
                        centerLat = lat;
                        break;
                    }
                }
            }

            result = new Double[] { centerLon, centerLat };
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
     * Get center coordinates of Wasserstrassenabschnitt described by <Wasserstrassen
     * ID>-<km_from>-<km_to>. If the distance is > 1 km then the locator is
     * called with kmFrom = center-0.5km and kmTo = center+0.5km.
     * 
     * @param bwStrIdAndKm
     * @return An array of Double [centerLon, centerLat].
     */
    public Double[] getCenterFromBwstrIdAndKm(String bwStrIdAndKm) {

        String[] parts = bwStrIdAndKm.split( "-" );

        Double from = Double.parseDouble( parts[1] );
        Double to = Double.parseDouble( parts[2] );
        Double distance = to - from;
        if (distance > 1.0) {
            Double center = from + (to - from) / 2;
            from = center - 0.5;
            to = center + 0.5;
        }

        return getCenter( parse( getResponse( parts[0], from.toString(), to.toString() ) ) );
    }

}
