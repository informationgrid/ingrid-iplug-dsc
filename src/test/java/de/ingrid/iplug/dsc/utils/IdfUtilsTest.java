/*-
 * **************************************************-
 * InGrid iPlug DSC
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

import de.ingrid.utils.xml.IDFNamespaceContext;
import de.ingrid.utils.xpath.XPathUtils;
import org.junit.Assert;
import org.junit.Test;
import org.w3c.dom.Document;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.IOException;
import java.io.StringReader;
import java.nio.file.Files;
import java.nio.file.Paths;

public class IdfUtilsTest {

    DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
    DocumentBuilder docBuilder = null;
    org.w3c.dom.Document idfDoc = null;
    DOMUtils domUtils = null;
    XPathUtils xpu = null;
    DOMUtils.IdfElement testElement = null;
    IdfUtils idfUtils = null;

    public void setUpIdfElement() throws Exception {
        try {
            dbf.setNamespaceAware(true);
            docBuilder = dbf.newDocumentBuilder();
        } catch (ParserConfigurationException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        idfDoc = docBuilder.newDocument();

        domUtils = new DOMUtils(idfDoc, new XPathUtils(new IDFNamespaceContext()));
        domUtils.addNS("idf", "http://www.portalu.de/IDF/1.0");
        domUtils.addNS("gmd", "http://www.isotc211.org/2005/gmd");
        domUtils.addNS("gco", "http://www.isotc211.org/2005/gco");
        domUtils.addNS("xlink", "http://www.w3.org/1999/xlink");
        domUtils.addNS("xsi", "http://www.w3.org/2001/XMLSchema-instance");

        xpu = new XPathUtils(new IDFNamespaceContext());

        testElement = domUtils.createElement("idf:testElement");
        idfDoc.appendChild(testElement.getElement());
        testElement.addAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
        testElement.addAttribute("xsi:schemaLocation", domUtils.getNS("idf") + " ingrid_detail_data_schema.xsd");

        idfUtils = new IdfUtils(null, domUtils, xpu);

    }

    @Test
    public void addLocalizedCharacterstringMultiLanguage() throws Exception {
        setUpIdfElement();

        idfUtils.addLocalizedCharacterstring(testElement, "Das ist ein Test.#locale-eng:\n\tThis is a test.#locale-rus:Это тест.  \n");

        Assert.assertEquals("gmd:PT_FreeText_PropertyType", xpu.getString(idfDoc, "//idf:testElement/@type"));
        Assert.assertEquals("Das ist ein Test.", xpu.getString(idfDoc, "//idf:testElement/gco:CharacterString"));
        Assert.assertEquals("This is a test.", xpu.getString(idfDoc, "//idf:testElement/gmd:PT_FreeText/gmd:textGroup/gmd:LocalisedCharacterString[./@locale='#locale-eng']"));
        Assert.assertEquals("Это тест.", xpu.getString(idfDoc, "//idf:testElement/gmd:PT_FreeText/gmd:textGroup/gmd:LocalisedCharacterString[./@locale='#locale-rus']"));
    }

    @Test
    public void addLocalizedCharacterstringNoLang() throws Exception {
        setUpIdfElement();

        idfUtils.addLocalizedCharacterstring(testElement, "\t\nDas ist ein Test.\n\n");

        Assert.assertEquals("Das ist ein Test.", xpu.getString(idfDoc, "//idf:testElement/gco:CharacterString"));
        Assert.assertEquals(false, xpu.nodeExists(idfDoc, "//idf:testElement/@type"));
        Assert.assertEquals(false, xpu.nodeExists(idfDoc, "//idf:testElement/gmd:PT_FreeText"));
    }

    @Test
    public void addLocalizedCharacterstringOnlyOneLang() throws Exception {
        setUpIdfElement();

        idfUtils.addLocalizedCharacterstring(testElement, "\n\n#locale-rus:Это тест.");

        Assert.assertEquals("gmd:PT_FreeText_PropertyType", xpu.getString(idfDoc, "//idf:testElement/@type"));
        Assert.assertEquals("Это тест.", xpu.getString(idfDoc, "//idf:testElement/gco:CharacterString"));
        Assert.assertEquals("Это тест.", xpu.getString(idfDoc, "//idf:testElement/gmd:PT_FreeText/gmd:textGroup/gmd:LocalisedCharacterString[./@locale='#locale-rus']"));
    }

    @Test
    public void addPTLocaleDefinitions() throws IOException, SAXException, ParserConfigurationException {

        String idfString = new String(Files.readAllBytes(Paths.get("src/test/resources/idf.xml")));
        dbf.setNamespaceAware(true);
        Document idfDoc = dbf.newDocumentBuilder().parse(new InputSource(new StringReader(idfString)));

        domUtils = new DOMUtils(idfDoc, new XPathUtils(new IDFNamespaceContext()));
        domUtils.addNS("idf", "http://www.portalu.de/IDF/1.0");
        domUtils.addNS("gmd", "http://www.isotc211.org/2005/gmd");
        domUtils.addNS("gco", "http://www.isotc211.org/2005/gco");
        domUtils.addNS("xlink", "http://www.w3.org/1999/xlink");
        domUtils.addNS("xsi", "http://www.w3.org/2001/XMLSchema-instance");

        xpu = new XPathUtils(new IDFNamespaceContext());

        idfUtils = new IdfUtils(null, domUtils, xpu);

        idfUtils.addPTLocaleDefinitions(idfDoc);

        Assert.assertEquals(1, xpu.getNodeList(idfDoc, "//gmd:locale/gmd:PT_Locale[./@id='locale-eng']").getLength());
        Assert.assertEquals(1, xpu.getNodeList(idfDoc, "//gmd:locale/gmd:PT_Locale[./@id='locale-rus']").getLength());
    }

    @Test
    public void getLastSibling() throws Exception {
        String[] siblingsReverseOrder = {"//idf:idfMdMetadata/gmd:locale",
                "//idf:idfMdMetadata/gmd:dataSetURI",
                "//idf:idfMdMetadata/gmd:metadataStandardVersion",
                "//idf:idfMdMetadata/gmd:metadataStandardName",
                "//idf:idfMdMetadata/gmd:dateStamp"};

        String idfString = new String(Files.readAllBytes(Paths.get("src/test/resources/idf.xml")));
        dbf.setNamespaceAware(true);
        Document idfDoc = dbf.newDocumentBuilder().parse(new InputSource(new StringReader(idfString)));

        domUtils = new DOMUtils(idfDoc, new XPathUtils(new IDFNamespaceContext()));
        domUtils.addNS("idf", "http://www.portalu.de/IDF/1.0");
        domUtils.addNS("gmd", "http://www.isotc211.org/2005/gmd");
        domUtils.addNS("gco", "http://www.isotc211.org/2005/gco");
        domUtils.addNS("xlink", "http://www.w3.org/1999/xlink");
        domUtils.addNS("xsi", "http://www.w3.org/2001/XMLSchema-instance");

        xpu = new XPathUtils(new IDFNamespaceContext());

        idfUtils = new IdfUtils(null, domUtils, xpu);

        DOMUtils.IdfElement idfE = idfUtils.getLastSibling(idfDoc, siblingsReverseOrder);

        Assert.assertEquals("gmd:metadataStandardVersion", idfE.getElement().getTagName());

    }


    @Test
    public void getIgcLocalizedStringFromIso() throws Exception {

        String idfString = new String(Files.readAllBytes(Paths.get("src/test/resources/idf.xml")));
        dbf.setNamespaceAware(true);
        Document idfDoc = dbf.newDocumentBuilder().parse(new InputSource(new StringReader(idfString)));

        domUtils = new DOMUtils(idfDoc, new XPathUtils(new IDFNamespaceContext()));
        domUtils.addNS("idf", "http://www.portalu.de/IDF/1.0");
        domUtils.addNS("gmd", "http://www.isotc211.org/2005/gmd");
        domUtils.addNS("gco", "http://www.isotc211.org/2005/gco");
        domUtils.addNS("xlink", "http://www.w3.org/1999/xlink");
        domUtils.addNS("xsi", "http://www.w3.org/2001/XMLSchema-instance");

        xpu = new XPathUtils(new IDFNamespaceContext());

        idfUtils = new IdfUtils(null, domUtils, xpu);

        Assert.assertEquals(
                "INSPIRE HH Geografische Bezeichnungen#locale-eng:English translation of INSPIRE HH Geografische Bezeichnungen",
                idfUtils.getLocalisedIgcString(xpu.getNode(idfDoc, "//gmd:CI_Citation/gmd:title")));
        Assert.assertEquals(
                "INSPIRE HH AI 3 GN#locale-rus:Это тест.#locale-eng:English for INSPIRE HH AI 3 GN",
                idfUtils.getLocalisedIgcString(xpu.getNode(idfDoc, "//gmd:CI_Citation/gmd:alternateTitle")));
        // supports selecting the gco:CharacterString node
        Assert.assertEquals(
                "INSPIRE HH AI 3 GN#locale-rus:Это тест.#locale-eng:English for INSPIRE HH AI 3 GN",
                idfUtils.getLocalisedIgcString(xpu.getNode(idfDoc, "//gmd:CI_Citation/gmd:alternateTitle/gco:CharacterString")));
        Assert.assertEquals(
                "Dieser Datensatz stellt die geografischen Bezeichnungen von Hamburg im INSPIRE-Zielmodell dar.",
                idfUtils.getLocalisedIgcString(xpu.getNode(idfDoc, "//gmd:abstract")));

        // element with no gco:CharacterString
        Assert.assertEquals(
                null,
                idfUtils.getLocalisedIgcString(xpu.getNode(idfDoc, "//gmd:URL")));

    }
}
