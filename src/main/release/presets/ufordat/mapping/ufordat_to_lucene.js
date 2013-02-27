/**
 * SourceRecord to Lucene Document mapping
 * Copyright (c) 2011 wemove digital solutions. All rights reserved.
 *
 * The following global variable are passed from the application:
 *
 * @param sourceRecord A SourceRecord instance, that defines the input
 * @param luceneDoc A lucene Document instance, that defines the output
 * @param log A Log instance
 * @param SQL SQL helper class encapsulating utility methods
 * @param IDX Lucene index helper class encapsulating utility methods for output
 * @param TRANSF Helper class for transforming, processing values/fields.
 */
importPackage(Packages.org.apache.lucene.document);
importPackage(Packages.de.ingrid.iplug.dsc.om);
importPackage(Packages.de.ingrid.geo.utils.transformation);

if (log.isDebugEnabled()) {
    log.debug("Mapping source record to lucene document: " + sourceRecord.toString());
}

if (!(sourceRecord instanceof DatabaseSourceRecord)) {
    throw new IllegalArgumentException("Record is no DatabaseRecord!");
}

// ---------- VHPRPD "id" ----------
var myVHKEY = sourceRecord.get(DatabaseSourceRecord.ID);

// ---------- VHPRPD ----------

// filter according to former mapping !
var topRows = SQL.all("SELECT * FROM VHPRPD WHERE (STATUS='G' OR STATUS='X') AND (VERSTA='x' OR VERSTA='f') AND VHKEY=?", [myVHKEY]);

for (i=0; i<topRows.size(); i++) {
    // transform vhkey to 8 digits length with leading 0
    // make JS String out of Java String for processing.
    var missingDigits = 8 - ("" + topRows.get(i).get("vhkey")).length;
    var vhkey8Digits = "";
    for (h=0; h<missingDigits; h++) {
        vhkey8Digits = vhkey8Digits + "0";
    }
    vhkey8Digits = vhkey8Digits + topRows.get(i).get("vhkey");

    IDX.add("t011_obj_data.obj_id", vhkey8Digits);
    IDX.add("status_des_datensatzes", topRows.get(i).get("status"));
    IDX.add("fs_runtime_from", topRows.get(i).get("vhbeg"));
    IDX.add("fs_runtime_to", topRows.get(i).get("vhend"));
    IDX.add("fs_projectleader", topRows.get(i).get("prolnm"));
    IDX.add("title", topRows.get(i).get("ta"));
    IDX.add("title", topRows.get(i).get("vbthem"));
    IDX.add("title", topRows.get(i).get("tc"));
    IDX.add("bearbeitungsstatus", topRows.get(i).get("versta"));

    // deliver url
    // changes display in result list !
    // with URL the url is displayed below summary and title links to URL
    // without url title links to detail view !
    var ufordatUrl = "http://doku.uba.de/aDISWeb/app?service=direct/0/Home/$DirectLink&sp=Swww-gates.uba.de%3A4111&sp=SVH";
    IDX.add("url", ufordatUrl + vhkey8Digits);

    // ---------- VHTXPD ----------
    // Aus mail "AW: Erste Version UFORDAT als DSC Scripted" 26.02.2013 17:11
    // Die alte Selektion muss angepasst werden:
    // => Wenn das FELD KURZFG='N', darf die Kurzbeschreibungen (KURZBS) nicht ins Internet
    if (topRows.get(i).get("kurzfg") != 'N') {
        var rows = SQL.all("SELECT text FROM VHTXPD WHERE FELD='KURZBS' AND PR_ISN=?", [myVHKEY]);
        for (j=0; j<rows.size(); j++) {
            IDX.add("summary", rows.get(j).get("text"));
        }
    }

    // ---------- KSPRPD ----------
    var myVHINS = topRows.get(i).get("vhins");
    if (hasValue(myVHINS)) {
        var rows = SQL.all("SELECT hs FROM KSPRPD WHERE K0001=?", [myVHINS]);
        for (j=0; j<rows.size(); j++) {
            IDX.add("fs_institution", rows.get(j).get("hs"));
        }
    }

    // ---------- VHS0PD ----------
    var rows = SQL.all("SELECT fkz, betper, autdd, fikey, zukey, thkey, gtkey FROM VHS0PD WHERE PR_ISN=?", [myVHKEY]);
    for (j=0; j<rows.size(); j++) {
        IDX.add("foerderkennzeichen", rows.get(j).get("fkz"));
        IDX.add("fs_participants", rows.get(j).get("betper"));
        IDX.add("freie_deskriptoren", rows.get(j).get("autdd"));

        // ---------- KSPRPD ----------
        var myFIKEY = rows.get(j).get("fikey");
        if (hasValue(myFIKEY)) {
            var subRows = SQL.all("SELECT hs FROM KSPRPD WHERE K0001=?", [myFIKEY]);
            for (k=0; k<subRows.size(); k++) {
                IDX.add("fs_project_executing_organisation", subRows.get(k).get("hs"));
            }
        }

        // ---------- KSPRPD ----------
        var myZUKEY = rows.get(j).get("zukey");
        if (hasValue(myZUKEY)) {
            var subRows = SQL.all("SELECT hs FROM KSPRPD WHERE K0001=?", [myZUKEY]);
            for (k=0; k<subRows.size(); k++) {
                IDX.add("fs_participants", subRows.get(k).get("hs"));
            }
        }

        // ---------- THPR01 ----------
        var myTHKEY = rows.get(j).get("thkey");
        if (hasValue(myTHKEY)) {
            var subRows = SQL.all("SELECT swvf FROM THPR01 WHERE THSISN=?", [myTHKEY]);
            for (k=0; k<subRows.size(); k++) {
                IDX.add("fs_keywords", subRows.get(k).get("swvf"));
            }
        }

        // ---------- THPR01 ----------
        var myGTKEY = rows.get(j).get("gtkey");
        if (hasValue(myGTKEY)) {
            var subRows = SQL.all("SELECT swvf FROM THPR01 WHERE THSISN=?", [myGTKEY]);
            for (k=0; k<subRows.size(); k++) {
                IDX.add("fs_geo_reference", subRows.get(k).get("swvf"));
            }
        }

        // ---------- KSS0PD ----------
        if (hasValue(myFIKEY)) {
            var subRows = SQL.all("SELECT k0810, ka850 FROM KSS0PD WHERE PR_ISN=?", [myFIKEY]);
            for (k=0; k<subRows.size(); k++) {
                IDX.add("fs_project_executing_organisation", subRows.get(k).get("k0810"));

                // ---------- KSPRPD ----------
                var myKA850 = subRows.get(k).get("ka850");
                if (hasValue(myKA850)) {
                    var subSubRows = SQL.all("SELECT hs FROM KSPRPD WHERE K0001=?", [myKA850]);
                    for (l=0; l<subSubRows.size(); l++) {
                        IDX.add("fs_project_executing_organisation", subSubRows.get(l).get("hs"));
                    }
                }

                // ??? was just joined in old mapping WITHOUT ANY MAPPING !!! ???
                // ---------- KSPRPD ----------
//                var myKC850 = subRow.get("kc850");
//                if (hasValue(myKC850)) {
//                    var subSubRows = SQL.all("SELECT * FROM KSPRPD WHERE HS=?", [myKC850]);
//                    for (l=0; l<subSubRows.size(); l++) {
//                        var subSubRow = subSubRows.get(l);
//                    }
//                }
            }
        }
    }

    // ---------- KSS0PD ----------
    if (hasValue(myVHINS)) {
        var rows = SQL.all("SELECT k0810, ka850 FROM KSS0PD WHERE PR_ISN=?", [myVHINS]);
        for (j=0; j<rows.size(); j++) {
            IDX.add("fs_institution", rows.get(j).get("k0810"));

            // ---------- KSPRPD ----------
            var myKA850 = rows.get(j).get("ka850");
            if (hasValue(myKA850)) {
                var subRows = SQL.all("SELECT hs FROM KSPRPD WHERE K0001=?", [myKA850]);
                for (k=0; k<subRows.size(); k++) {
                    IDX.add("fs_institution", subRows.get(k).get("hs"));
                }
            }
        }
    }
}

function hasValue(val) {
    if (typeof val == "undefined") {
        return false; 
    } else if (val == null) {
        return false; 
    } else if (typeof val == "string" && val == "") {
        return false;
    } else if (typeof val == "object" && val.toString().equals("")) {
        return false;
    } else {
      return true;
    }
}
