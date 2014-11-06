<%--

    Copyright (c) 2014 wemove GmbH
    Licensed under the EUPL V.1.1

    This Software is provided to You under the terms of the European
    Union Public License (the "EUPL") version 1.1 as published by the
    European Union. Any use of this Software, other than as authorized
    under this License is strictly prohibited (to the extent such use
    is covered by a right of the copyright holder of this Software).

    This Software is provided under the License on an "AS IS" basis and
    without warranties of any kind concerning the Software, including
    without limitation merchantability, fitness for a particular purpose,
    absence of defects or errors, accuracy, and non-infringement of
    intellectual property rights other than copyright. This disclaimer
    of warranty is an essential part of the License and a condition for
    the grant of any rights to this Software.

    For more  details, see <http://joinup.ec.europa.eu/software/page/eupl>

--%>
<%@ include file="/WEB-INF/jsp/base/include.jsp" %><%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>

<%@page import="de.ingrid.admin.security.IngridPrincipal"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="de">
<head>
<title><fmt:message key="DatabaseConfig.main.title"/></title>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
<meta name="description" content="" />
<meta name="keywords" content="" />
<meta name="author" content="wemove digital solutions" />
<meta name="copyright" content="wemove digital solutions GmbH" />
<link rel="StyleSheet" href="../css/base/portal_u.css" type="text/css" media="all" />

</head>
<body>
    <div id="header">
        <img src="../images/base/logo.gif" width="168" height="60" alt="Portal U" />
        <h1><fmt:message key="DatabaseConfig.main.configuration"/></h1>
        <%
          java.security.Principal  principal = request.getUserPrincipal();
          if(principal != null && !(principal instanceof IngridPrincipal.SuperAdmin)) {
        %>
            <div id="language"><a href="../base/auth/logout.html"><fmt:message key="DatabaseConfig.main.logout"/></a></div>
        <%
          }
        %>
    </div>
    <div id="help"><a href="#">[?]</a></div>

    <c:set var="active" value="dbParams" scope="request"/>
    <c:import url="../base/subNavi.jsp"></c:import>

    <div id="contentBox" class="contentMiddle">
        <h1 id="head">Datenbank Einstellungen</h1>
        <div class="controls">
            <a href="../base/extras.html">Zur&uuml;ck</a>
            <a href="../base/welcome.html">Abbrechen</a>
            <a href="#" onclick="document.getElementById('dbConfig').submit();">Weiter</a>
        </div>
        <div class="controls cBottom">
            <a href="../base/extras.html">Zur&uuml;ck</a>
            <a href="../base/welcome.html">Abbrechen</a>
            <a href="#" onclick="document.getElementById('dbConfig').submit();">Weiter</a>
        </div>
        <div id="content">
            <form:form method="post" action="dbParams.html" modelAttribute="dbConfig">
                <input type="hidden" name="action" value="submit" />
                <input type="hidden" name="id" value="" />
                <table id="konfigForm">
                    <br />
                    <tr>
                        <td colspan="2"><h3>Auswahl des Datenbanktreibers:</h3></td>
                    </tr>
                    <tr>
                        <td class="leftCol">Datenbanktreiber</td>
                        <td>
                            <div class="input full">
                                <form:input path="dataBaseDriver" />
                            </div>
                            <form:errors path="dataBaseDriver" cssClass="error" element="div" />
                            <br />
                            Geben Sie bitte einen Datenbanktreiber an. G�ltige Eintr�ge sind:
                            <ul>
                                <li>MySql: com.mysql.jdbc.Driver</li>
                                <li>Oracle: oracle.jdbc.driver.OracleDriver</li>
                            </ul>
                            Falls die Datenbank nicht aufgef�hrt ist, dann muss der Treiber im lib-Verzeichnis des iPlugs vorhanden sein.
                            <p style="color: gray;">(Zum Beispiel: com.mysql.jdbc.Driver)</p>
                        </td>
                    </tr>
                    <tr>
                        <td class="leftCol">Verbindungs-URL</td>
                        <td>
                            <div class="input full">
                                <form:input path="connectionURL" />
                            </div>
                            <form:errors path="connectionURL" cssClass="error" element="div" />
                            <br />
                            Geben Sie eine Verbindungs-URL zur JDBC-Datenbank an.
                            <p style="color: gray;">(Zum Beispiel: jdbc:mysql://localhost:3306/igc)</p>
                        </td>
                    </tr>
                    <tr>
                        <td class="leftCol">Benutzer</td>
                        <td>
                            <div class="input full">
                                <form:input path="user" />
                            </div>
                            <form:errors path="user" cssClass="error" element="div" />
                            <br />
                            Geben Sie einen Datenbank Benutzer an.
                            <p style="color: gray;">(Zum Beispiel: igc)</p>
                        </td>
                    </tr>
                    <tr>
                        <td class="leftCol">Passwort</td>
                        <td>
                            <div class="input full">
                                <form:input path="password" />
                            </div>
                            <form:errors path="password" cssClass="error" element="div" />
                            <br />
                            Geben Sie ein Passwort f�r den Benutzer an.
                            <p style="color: gray;">(Zum Beispiel: 5&hftre)</p>
                        </td>
                    </tr>
                    <tr>
                        <td class="leftCol">Datenbank Schema</td>
                        <td>
                            <div class="input full">
                                <form:input path="schema" />
                            </div>
                            <form:errors path="schema" cssClass="error" element="div" />
                            <br />
                            Optional: Geben Sie ein Schema der Datenbank an.
                        </td>
                    </tr>
                </table>
            </form:form>
        </div>
    </div>

    <div id="footer" style="height:100px; width:90%"></div>
</body>
</html>

