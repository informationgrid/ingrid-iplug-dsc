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

// constant to punish the rank of a service/data object, which has no coupled resource
var BOOST_NO_COUPLED_RESOURCE  = 0.9;
//constant to boost the rank of a service/data object, which has at least one coupled resource
var BOOST_HAS_COUPLED_RESOURCE = 1.0;

if (log.isDebugEnabled()) {
	log.debug("Mapping source record to lucene document: " + sourceRecord.toString());
}

if (!(sourceRecord instanceof DatabaseSourceRecord)) {
    throw new IllegalArgumentException("Record is no DatabaseRecord!");
}

// ---------- VHPRPD "id" ----------
var myVHKEY = sourceRecord.get(DatabaseSourceRecord.ID);

// filter according to former mapping !
// BUT filter columns removed from schema ???
//var topRows = SQL.all("SELECT * FROM VHPRPD WHERE (STATUS='G' OR STATUS='X') AND (VERSTA='x' OR VERSTA='f') AND VHKEY=?", [myVHKEY]);

var topRows = SQL.all("SELECT * FROM VHPRPD WHERE VHKEY=?", [myVHKEY]);
for (i=0; i<topRows.size(); i++) {
    var topRow = topRows.get(i);

    // ---------- VHPRPD ----------
    var myVHINS = topRow.get("VHINS");

	// transform vhkey to 8 digits length with leading 0
	// make JS String out of Java String for processing.
	var missingDigits = 8 - ("" + topRow.get("vhkey")).length;
	var vhkey8Digits = "";
	for (h=0; h<missingDigits; h++) {
		vhkey8Digits = vhkey8Digits + "0";
	}
	vhkey8Digits = vhkey8Digits + topRow.get("vhkey");

    IDX.add("t011_obj_data.obj_id", vhkey8Digits);
    IDX.add("fs_runtime_from", topRow.get("vhbeg"));
    IDX.add("fs_runtime_to", topRow.get("vhend"));
    IDX.add("title", topRow.get("ta"));
    IDX.add("title", topRow.get("vbthem"));

    // deliver url
    // changes display in result list !
    // with URL the url is displayed below summary and title links to URL
    // without url title links to detail view !
	var ufordatUrl = "http://doku.uba.de/aDISWeb/app?service=direct/0/Home/$DirectLink&sp=Swww-gates.uba.de%3A4111&sp=SVH";
    IDX.add("url", ufordatUrl + vhkey8Digits);

	// removed from schema ?
//    IDX.add("status_des_datensatzes", topRow.get("status"));
//    IDX.add("fs_projectleader", topRow.get("prolnm"));
//    IDX.add("title", topRow.get("tc"));
//    IDX.add("bearbeitungsstatus", topRow.get("versta"));

    // ---------- VHTXPD ----------
    var rows = SQL.all("SELECT * FROM VHTXPD WHERE FELD='KURZBS' AND PR_ISN=?", [myVHKEY]);
    for (j=0; j<rows.size(); j++) {
		var row = rows.get(j);
		IDX.add("summary", row.get("text"));
    }

    // ---------- KSPRPD ----------
	if (hasValue(myVHINS)) {
		var rows = SQL.all("SELECT * FROM KSPRPD WHERE K0001=?", [myVHINS]);
		for (j=0; j<rows.size(); j++) {
			var row = rows.get(j);
			IDX.add("fs_institution", row.get("hs"));
		}
	}

    // ---------- VHS0PD ----------
    var rows = SQL.all("SELECT * FROM VHS0PD WHERE PR_ISN=?", [myVHKEY]);
    for (j=0; j<rows.size(); j++) {
		var row = rows.get(j);
		var myFIKEY = row.get("FIKEY");
		var myZUKEY = row.get("ZUKEY");
//		var myTHKEY = row.get("THKEY");

		// removed from schema ?
//		var myGTKEY = row.get("GTKEY");
//		IDX.add("foerderkennzeichen", row.get("fkz"));
//		IDX.add("fs_participants", row.get("betper"));
//		IDX.add("freie_deskriptoren", row.get("autdd"));

		// ---------- KSPRPD ----------
		if (hasValue(myFIKEY)) {
			var subRows = SQL.all("SELECT * FROM KSPRPD WHERE K0001=?", [myFIKEY]);
			for (k=0; k<subRows.size(); k++) {
				var subRow = subRows.get(k);
				IDX.add("fs_project_executing_organisation", subRow.get("hs"));
			}
		}

		// ---------- KSPRPD ----------
		if (hasValue(myZUKEY)) {
			var subRows = SQL.all("SELECT * FROM KSPRPD WHERE K0001=?", [myZUKEY]);
			for (k=0; k<subRows.size(); k++) {
				var subRow = subRows.get(k);
				IDX.add("fs_participants", subRow.get("hs"));
			}
		}
/*
		// ---------- THPR01 ----------
		var subRows = SQL.all("SELECT * FROM THPR01 WHERE THSISN=?", [myTHKEY]);
		for (k=0; k<subRows.size(); k++) {
			var subRow = subRows.get(k);
			// SWVF removed from schema ?
//			IDX.add("fs_keywords", subRow.get("swvf"));
		}

		// ---------- THPR01 ----------
		// GTKEY removed from schema ?
		var subRows = SQL.all("SELECT * FROM THPR01 WHERE THSISN=?", [myGTKEY]);
		for (k=0; k<subRows.size(); k++) {
			var subRow = subRows.get(k);
			// SWVF removed from schema ?
//			IDX.add("fs_geo_reference", subRow.get("swvf"));
		}
*/
/*
		// KSS0PD removed from schema ?
		// ---------- KSS0PD ----------
		var subRows = SQL.all("SELECT * FROM KSS0PD WHERE PR_ISN=?", [myFIKEY]);
		for (k=0; k<subRows.size(); k++) {
			var subRow = subRows.get(k);
			var myKA850 = row.get("KA850");
			var myKC850 = row.get("KC850");

			IDX.add("fs_project_executing_organisation", subRow.get("k0810"));

			// ---------- KSPRPD ----------
			var subSubRows = SQL.all("SELECT * FROM KSPRPD WHERE K0001=?", [myKA850]);
			for (l=0; l<subSubRows.size(); l++) {
				var subSubRow = subSubRows.get(l);
				IDX.add("fs_project_executing_organisation", subSubRow.get("hs"));
			}

			// ---------- KSPRPD ----------
			// ??? just joined via HS ???
			var subSubRows = SQL.all("SELECT * FROM KSPRPD WHERE HS=?", [myKC850]);
			for (l=0; l<subSubRows.size(); l++) {
				var subSubRow = subSubRows.get(l);
			}
		}
*/
// ...
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
