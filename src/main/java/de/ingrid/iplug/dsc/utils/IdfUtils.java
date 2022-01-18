/*
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
/**
 * 
 */
package de.ingrid.iplug.dsc.utils;

import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.iplug.dsc.utils.DOMUtils.IdfElement;
import de.ingrid.utils.udk.UtilsLanguageCodelist;
import de.ingrid.utils.xml.ConfigurableNamespaceContext;
import de.ingrid.utils.xml.IDFNamespaceContext;
import de.ingrid.utils.xml.IgcProfileNamespaceContext;
import de.ingrid.utils.xpath.XPathUtils;
import org.apache.log4j.Logger;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.util.*;

/**
 * This class provides helper functions for mapping certain data structures into
 * the IDF format. This class is IGC specific. Must be instantiated to be thread
 * safe.
 * 
 * @author joachim@wemove.com
 * 
 */
public class IdfUtils {

    private static final Logger log = Logger.getLogger(IdfUtils.class);

    /** e.g. for selecting values from db */
    private SQLUtils SQL = null;

    /** e.g. for creating values in DOM */
    private DOMUtils DOM = null;

    private XPathUtils xPathUtils = null;

    // Prefix for localized string used in IGC fields
    // correspondents to prefix in attribute gmd:LocalisedCharacterString@locale
    private static final String LOCALIZEDSTRING_PREFIX= "#locale-";

    public IdfUtils(SQLUtils sqlUtils, DOMUtils domUtils, XPathUtils xPathUtils) {
        this.SQL = sqlUtils;
        this.DOM = domUtils;
        this.xPathUtils = xPathUtils;
        ConfigurableNamespaceContext nsc = new ConfigurableNamespaceContext();
        nsc.addNamespaceContext(new IDFNamespaceContext());
        nsc.addNamespaceContext(new IgcProfileNamespaceContext());

    }

    /**
     * Maps an additional data into the IDF document using the default structure
     * for additional data in idf:IDF_MD_Metadata_Type.
     * <p/>
     * The labels and order of the table rows will be derived from the profile.
     * The data will be extracted from the database.
     * <p/>
     * This function is generic for additional data fields and data tables.
     * 
     * @param sourceRecord
     *            The database source record containing the id of the database
     *            record to work on.
     * @param idfDoc
     *            The IDF document.
     * @param igcProfileControlNode
     *            The IGC profile control node that should be mapped.
     */
    public void addAdditionalData(SourceRecord sourceRecord, Document idfDoc, Element igcProfileControlNode) {
        if (!(sourceRecord instanceof DatabaseSourceRecord)) {
            throw new IllegalArgumentException("Record is no DatabaseRecord!");
        }

        DOM.addNS("idf", "http://www.portalu.de/IDF/1.0");
        DOM.addNS("xlink", "http://www.w3.org/1999/xlink");

        try {

            if (igcProfileControlNode.getLocalName().equals("tableControl")) {
                // convert id to number to be used in PreparedStatement as Integer to avoid postgres error !
                Integer id = new Integer((String) sourceRecord.get(DatabaseSourceRecord.ID));
                String igcProfileControlNodeId = xPathUtils.getString(igcProfileControlNode, "igcp:id");
                List<Map<String, String>> contentRows = SQL.all("SELECT afd.sort, afd.field_key, afd.data "
                        + "FROM additional_field_data afd, additional_field_data afd_parent "
                        + "WHERE afd.parent_field_id = afd_parent.id " + "AND afd_parent.obj_id=? "
                        + "AND afd_parent.field_key=? " + "ORDER BY afd.sort", new Object[] { id,
                        igcProfileControlNodeId });
                if (contentRows != null && !contentRows.isEmpty()) {
                    IdfElement additionalDataSection = createDataSectionElement(idfDoc, igcProfileControlNode);
                    // add IDF table element
                    IdfElement additionalDataTable = additionalDataSection.addElement("idf:additionalDataTable")
                            .addAttribute("id", igcProfileControlNodeId);
                    NodeList localizedLabels = xPathUtils.getNodeList(igcProfileControlNode, "igcp:localizedLabel");
                    for (int i = 0; i < localizedLabels.getLength(); i++) {
                        Node localizedLabel = localizedLabels.item(i);
                        additionalDataTable.addElement("idf:title").addText(localizedLabel.getTextContent())
                                .addAttribute("lang",
                                        localizedLabel.getAttributes().getNamedItem("lang").getNodeValue());
                    }
                    // add IDF table column elements
                    // remember them in list (order correctly)
                    List<String> columnIds = new ArrayList<String>();
                    NodeList tableControls = xPathUtils.getNodeList(igcProfileControlNode, "igcp:columns/*");
                    for (int i = 0; i < tableControls.getLength(); i++) {
                        Node igcProfileTableControl = tableControls.item(i);
                        String igcProfileTableControlId = xPathUtils.getString(igcProfileTableControl, "igcp:id");
                        columnIds.add(igcProfileTableControlId);
                        IdfElement tableColumn = additionalDataTable.addElement("idf:tableColumn").addAttribute("id",
                                igcProfileTableControlId);
                        localizedLabels = xPathUtils.getNodeList(igcProfileTableControl, "igcp:localizedLabel");
                        for (int j = 0; j < localizedLabels.getLength(); j++) {
                            Node localizedLabel = localizedLabels.item(j);
                            tableColumn.addElement("idf:title").addText(localizedLabel.getTextContent()).addAttribute(
                                    "lang", localizedLabel.getAttributes().getNamedItem("lang").getNodeValue());
                        }
                    }
                    // add IDF table row data
                    // copy column array, shows which columns per row are
                    // unprocessed (have NO DATA)
                    ArrayList<String> columnIdsUnprocessed = new ArrayList<String>(columnIds);
                    String currentRow = null;
                    for (int i = 0; i < contentRows.size(); i++) {
                        Map<String, String> contentRow = contentRows.get(i);
                        if (currentRow == null) {
                            currentRow = contentRow.get("sort");
                        }
                        if (!currentRow.equals(contentRow.get("sort"))) {
                            // new row !
                            // we check whether unprocessed Columns and add
                            // empty values !
                            for (String columnIdUnprocessed : columnIdsUnprocessed) {
                                addDataToTableColumn(additionalDataTable, columnIdUnprocessed, "");
                            }
                            // initialize for next row !
                            currentRow = contentRow.get("sort");
                            columnIdsUnprocessed = new ArrayList<String>(columnIds);
                        }
                        String columnId = contentRow.get("field_key");
                        addDataToTableColumn(additionalDataTable, columnId, contentRow.get("data"));
                        columnIdsUnprocessed.remove(columnId);
                    }
                    // process last Row !
                    for (String columnIdUnprocessed : columnIdsUnprocessed) {
                        addDataToTableColumn(additionalDataTable, columnIdUnprocessed, "");
                    }
                }

            } else {
                // add the IDF data node
                // convert id to number to be used in PreparedStatement as Integer to avoid postgres error !
                Integer id = new Integer((String) sourceRecord.get(DatabaseSourceRecord.ID));
                String igcProfileControlId = xPathUtils.getString(igcProfileControlNode, "igcp:id");
                Map<String, String> content = SQL.first(
                        "SELECT data FROM additional_field_data WHERE obj_id=? AND field_key=?", new Object[] { id,
                                igcProfileControlId });
                if (content != null && !content.isEmpty()) {
                    IdfElement additionalDataSection = createDataSectionElement(idfDoc, igcProfileControlNode);
                    IdfElement additionalData = additionalDataSection.addElement("idf:additionalDataField")
                            .addAttribute("id", igcProfileControlId);
                    NodeList localizedLabels = xPathUtils.getNodeList(igcProfileControlNode, "igcp:localizedLabel");
                    for (int i = 0; i < localizedLabels.getLength(); i++) {
                        Node localizedLabel = localizedLabels.item(i);
                        String title = localizedLabel.getTextContent();
                        String lang = localizedLabel.getAttributes().getNamedItem("lang").getNodeValue();
                        additionalData.addElement("idf:title").addText(title).addAttribute("lang", lang);
                    }
                    NodeList localizedPostfixs = xPathUtils.getNodeList(igcProfileControlNode,
                            "igcp:localizedLabelPostfix");
                    for (int i = 0; i < localizedPostfixs.getLength(); i++) {
                        Node localizedPostfix = localizedPostfixs.item(i);
                        String value = localizedPostfix.getTextContent();
                        String lang = localizedPostfix.getAttributes().getNamedItem("lang").getNodeValue();
                        additionalData.addElement("idf:postfix").addText(value).addAttribute("lang", lang);
                    }
                    String data = content.get("data");
                    additionalData.addElement("idf:data").addText(data);
                }
            }
        } catch (Exception e) {
            log.error("Error adding additional data.", e);
        }
    }

    private void addDataToTableColumn(IdfElement additionalDataTable, String columnId, String data) {
        Node tableColumnNode = xPathUtils.getNode(additionalDataTable.getElement(), "idf:tableColumn[@id='" + columnId
                + "']");
        if (tableColumnNode == null) {
            throw new IllegalArgumentException("Unexpected table column id '" + columnId
                    + "'. Column ID does not exist in profile.");
        } else {
            DOM.addElement((Element) tableColumnNode, "idf:data").addText(data);
        }
    }

    /**
     * Creates a additional data section element in the IDF and returns the data
     * section element.
     * <p/>
     * The additional data section will be derived from the IGC profile control
     * node.
     * <p/>
     * If the element already exists, no new element will be created.
     * 
     * @param idfDoc
     * @param igcProfileControlNode
     * @return
     */
    private IdfElement createDataSectionElement(Document idfDoc, Element igcProfileControlNode) {
        // get IGC profile layout node
        Node igcProfileLayoutRubricNode = igcProfileControlNode.getParentNode().getParentNode();
        // get the id of the IGC profile layout node
        String igcProfileLayoutRubricId = xPathUtils.getString(igcProfileLayoutRubricNode, "igcp:id");
        // try to get the IDF additional data section node
        Node additionalDataSectionNode = xPathUtils.getNode(idfDoc,
                "/idf:html/idf:body/idf:idfMdMetadata/idf:additionalDataSection[@id='" + igcProfileLayoutRubricId
                        + "']");
        IdfElement additionalDataSection;
        if (additionalDataSectionNode == null) {
            // create IDF additional data section node
            Node idfBodyNode = xPathUtils.getNode(idfDoc, "/idf:html/idf:body");
            Element idfMetadataNode = (Element) xPathUtils.getNode(idfBodyNode, "idf:idfMdMetadata");
            if (idfMetadataNode == null) {
                idfMetadataNode = DOM.addElement((Element) idfBodyNode, "idf:idfMdMetadata").getElement();
                idfMetadataNode.setAttribute("xmlns:gmd", DOM.getNS("gmd"));
                idfMetadataNode.setAttribute("xmlns:gco", DOM.getNS("gco"));
            }
            String isLegacy = xPathUtils.getString(igcProfileLayoutRubricNode, "./@isLegacy");
            if (isLegacy == null)
                isLegacy = "false";
            additionalDataSection = DOM.addElement((Element) idfMetadataNode, "idf:additionalDataSection")
                    .addAttribute("id", igcProfileLayoutRubricId).addAttribute("isLegacy", isLegacy);
            NodeList localizedLabels = xPathUtils.getNodeList(igcProfileLayoutRubricNode, "igcp:localizedLabel");
            for (int i = 0; i < localizedLabels.getLength(); i++) {
                Node localizedLabel = localizedLabels.item(i);
                additionalDataSection.addElement("idf:title").addText(localizedLabel.getTextContent()).addAttribute(
                        "lang", localizedLabel.getAttributes().getNamedItem("lang").getNodeValue());
            }
        } else {
            additionalDataSection = DOM.new IdfElement((Element) additionalDataSectionNode);
        }
        return additionalDataSection;

    }

    /**
     * Adds a ISO localized string structure to the IdfElement e.
     *
     * The localization in content is expected to follow:
     *
     * <pre>
     * DEFAULT TEXT[#locale-<i>ISO-639-2</i>:LOCALIZED TEXT][#locale-...]
     * </pre>
     *
     * The created structure looks as:
     *
     * <pre>{@code
     * <gmd:title xsi:type="PT_FreeText_PropertyType">
     *   <gco:CharacterString>DEFAULT TEXT</gco:CharacterString>
     *   <gmd:PT_FreeText>
     *     <gmd:textGroup>
     *       <gmd:LocalisedCharacterString locale="#locale-<ISO-639-2>">LOCALIZED TEXT</gmd:LocalisedCharacterString>
     *     </gmd:textGroup>
     *   </gmd:PT_FreeText>
     * </gmd:title>
     * }
     * </pre>
     *
     *
     * @param element the place to add the localized string
     * @param content Will be trimmed.
     * @return a localized trimmed string
     */
    public IdfElement addLocalizedCharacterstring(IdfElement element, String content) {
        String str = content == null ? " " : content.trim();
        if (str.contains(LOCALIZEDSTRING_PREFIX)) {
            Map<String, String> localizedStrings = new HashMap<>();
            String[] locStrArray = str.split(LOCALIZEDSTRING_PREFIX);
            String defaultStr = null;

            if (str.startsWith(LOCALIZEDSTRING_PREFIX)) {
                // special case, starts with localized string, no default
                // use the localized string als as default
                // sample "@locale-eng:This is a text"
                String locStr = locStrArray[1].substring(locStrArray[1].indexOf(":")+1, locStrArray[1].length());
                locStrArray[0] = locStr;
            }
            for (int i=0; i<locStrArray.length; i++) {
                if (i==0) {
                    defaultStr = locStrArray[i];
                } else {
                    String locale = locStrArray[i].substring(0, locStrArray[i].indexOf(":"));
                    String locStr = locStrArray[i].substring(locStrArray[i].indexOf(":")+1, locStrArray[i].length());
                    localizedStrings.put(locale, locStr);
                }
            }

            element.addAttribute("xsi:type", "PT_FreeText_PropertyType");
            element.addElement("gco:CharacterString").addText(defaultStr);
            DOMUtils.IdfElement ptFreeText = element.addElement("gmd:PT_FreeText");
            for (String locale : localizedStrings.keySet()) {
                ptFreeText.addElement("gmd:textGroup")
                        .addElement("gmd:LocalisedCharacterString")
                        .addAttribute("locale", LOCALIZEDSTRING_PREFIX + locale)
                        .addText(localizedStrings.get(locale).trim());
            }
        } else {
            element.addElement("gco:CharacterString").addText(str.trim());
        }
        return element;
    }


    public void addPTLocaleDefinitions(Document idfDoc) {
        String[] siblingsReverseOrder = {"//idf:idfMdMetadata/gmd:locale",
                "//idf:idfMdMetadata/gmd:dataSetURI",
                "//idf:idfMdMetadata/gmd:metadataStandardVersion",
                "//idf:idfMdMetadata/gmd:metadataStandardName",
                "//idf:idfMdMetadata/gmd:dateStamp"};

        // get locales from xml document
        NodeList nl = xPathUtils.getNodeList(idfDoc, "//gmd:LocalisedCharacterString/@locale");
        Set<String> localeSet = new HashSet<>();
        for (int i=0; i<nl.getLength(); i++) {
            String locale = nl.item(i).getTextContent();
            if (locale.startsWith("#locale-")) {
                localeSet.add(locale.substring(8));
            }
        }

        // add PT_Locale Elements
        if (!localeSet.isEmpty()) {
            for (String locale : localeSet) {
                IdfElement idfE = getLastSibling(idfDoc, siblingsReverseOrder);
                if (idfE != null) {
                    IdfElement ptLocale = idfE.addElementAsSibling("gmd:locale/gmd:PT_Locale");
                    IdfElement languageCode = ptLocale.addAttribute("id", "locale-" + locale)
                            .addElement("gmd:languageCode/gmd:LanguageCode");
                    languageCode.addAttribute("codeList", "http://www.loc.gov/standards/iso639-2")
                            .addAttribute("codeListValue", locale);
                    String languageCodeString = UtilsLanguageCodelist.getNameFromIso639_2(locale, "en");
                    if (languageCodeString != null) {
                        languageCode.addText(languageCodeString);
                    }
                    ptLocale.addElement("gmd:characterEncoding/gmd:MD_CharacterSetCode")
                            .addAttribute("codeList", "http://standards.iso.org/iso/19139/resources/gmxCodelists.xml#MD_CharacterSetCode")
                            .addAttribute("codeListValue", "utf8")
                            .addText("UTF-8");
                }
            }
        }
    }

    /**
     * Parse the given Node for gco:CharacterString and for localizations
     * (based on gmd:PT_FreeText, gmd:LocalisedCharacterString>. Supports a
     * gco:CharacterString Node or its's parent.
     *
     * The locale is expected in gmd:LocalisedCharacterString/@locale in the
     * format <pre>#locale-<i>ISO-639-2</i></pre>

     * Returns a localized String according to
     *
     * <pre>
     * DEFAULT TEXT[#locale-<i>ISO-639-2</i>:LOCALIZED TEXT][#locale-...]
     * </pre>
     *
     *
     *
     * @param n
     * @return
     */
    public String getLocalisedIgcString(Node n) {
        Node refNode = n;
        if (n.getLocalName().equals("CharacterString")) {
            refNode = n.getParentNode();
        }
        String value = xPathUtils.getString(refNode, "gco:CharacterString");
        if (value != null) {
            value = value.trim();
        }
        NodeList nl = xPathUtils.getNodeList(refNode, ".//gmd:LocalisedCharacterString");
        if (nl.getLength() > 0) {
            StringBuilder sb = new StringBuilder(value);
            for (int i=0; i<nl.getLength(); i++) {
                Node lcsNode = nl.item(i);
                String lcsLocale = xPathUtils.getString(lcsNode, "./@locale");
                String lcsValue = xPathUtils.getString(lcsNode, ".");
                if (lcsValue != null && lcsLocale != null && lcsLocale.startsWith(LOCALIZEDSTRING_PREFIX)) {
                    sb.append(lcsLocale.trim()).append(":").append(lcsValue.trim());
                }
            }
            value = sb.toString();
        }
        return value;
    }


    public IdfElement getLastSibling(Document idfDoc,  String[] siblingsInReverseOrder) {
        Node nodeRef = null;
        for (String sibling : siblingsInReverseOrder) {
            nodeRef = xPathUtils.getNode(idfDoc, sibling + "[last()]");
            if (nodeRef != null) {
                break;
            }
        }
        if (nodeRef != null) {
            return DOM.convertToIdfElement((Element) nodeRef);
        } else {
            return null;
        }
    }



}
