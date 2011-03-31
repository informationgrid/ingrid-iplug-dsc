/**
 * 
 */
package de.ingrid.iplug.dsc.utils;

import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.iplug.dsc.utils.DOMUtils.IdfElement;
import de.ingrid.utils.xml.ConfigurableNamespaceContext;
import de.ingrid.utils.xml.IDFNamespaceContext;
import de.ingrid.utils.xml.IgcProfileNamespaceContext;
import de.ingrid.utils.xml.XPathUtils;

/**
 * This class provides helper functions for mapping certain data structures into
 * the IDF format. This class is IGC specific.
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

    private static IdfUtils myInstance;

    /**
     * Get The Singleton.
     * 
     * @param sqlUtils
     * @param domUtils
     * @return
     */
    public static synchronized IdfUtils getInstance(SQLUtils sqlUtils, DOMUtils domUtils) {
        if (myInstance == null) {
            myInstance = new IdfUtils();
        }
        myInstance.initialize(sqlUtils, domUtils);

        return myInstance;
    }

    private IdfUtils() {
    }

    private void initialize(SQLUtils sqlUtils, DOMUtils domUtils) {
        this.SQL = sqlUtils;
        this.DOM = domUtils;
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
                String id = (String) sourceRecord.get(DatabaseSourceRecord.ID);
                String igcProfileControlNodeId = XPathUtils.getString(igcProfileControlNode, "igcp:id");
                List<Map<String, String>> contentRows = SQL
                        .all(
                                "SELECT afd.field_key, afd.data FROM additional_field_data afd, additional_field_data afd_parent WHERE afd.parent_field_id = afd_parent.id AND afd_parent.obj_id=? AND afd_parent.field_key=? ORDER BY afd.sort",
                                new Object[] { id, igcProfileControlNodeId });
                if (contentRows != null && !contentRows.isEmpty()) {
                    IdfElement additionalDataSection = createDataSectionElement(idfDoc, igcProfileControlNode);
                    // add IDF table element
                    IdfElement additionalData = additionalDataSection.addElement("idf:additionalDataTable")
                    	.addAttribute("id", igcProfileControlNodeId);
                    NodeList localizedLabels = XPathUtils.getNodeList(igcProfileControlNode, "igcp:localizedLabel");
                    for (int i = 0; i < localizedLabels.getLength(); i++) {
                        Node localizedLabel = localizedLabels.item(i);
                        additionalData.addElement("idf:title").addText(localizedLabel.getTextContent()).addAttribute(
                                "lang", localizedLabel.getAttributes().getNamedItem("lang").getNodeValue());
                    }
                    // add IDF table column elements
                    NodeList tableControls = XPathUtils.getNodeList(igcProfileControlNode, "igcp:columns/*");
                    for (int i = 0; i < tableControls.getLength(); i++) {
                        Node igcProfileTableControl = tableControls.item(i);
                        String igcProfileTableControlId = XPathUtils.getString(igcProfileTableControl, "igcp:id");
                        IdfElement tableColumn = additionalData.addElement("idf:tableColumn").addAttribute("id",
                                igcProfileTableControlId);
                        localizedLabels = XPathUtils.getNodeList(igcProfileTableControl, "igcp:localizedLabel");
                        for (int j = 0; j < localizedLabels.getLength(); j++) {
                            Node localizedLabel = localizedLabels.item(j);
                            tableColumn.addElement("idf:title").addText(localizedLabel.getTextContent()).addAttribute(
                                    "lang", localizedLabel.getAttributes().getNamedItem("lang").getNodeValue());
                        }
                    }
                    // add IDF table row data
                    for (int i = 0; i < contentRows.size(); i++) {
                        Map<String, String> contentRow = contentRows.get(i);
                        Node tableColumnNode = XPathUtils.getNode(additionalData.getElement(), "idf:tableColumn[@id='"
                                + contentRow.get("field_key") + "']");
                        if (tableColumnNode == null) {
                            throw new IllegalArgumentException("Unexpected table column id '"
                                    + contentRow.get("field_key") + "'. Column ID does not exist in profile.");
                        } else {
                            DOM.addElement((Element) tableColumnNode, "idf:data").addText(contentRow.get("data"));
                        }
                    }
                }

            } else {
                // add the IDF data node
                String id = (String) sourceRecord.get(DatabaseSourceRecord.ID);
                String igcProfileControlId = XPathUtils.getString(igcProfileControlNode, "igcp:id");
                Map<String, String> content = SQL.first(
                        "SELECT data FROM additional_field_data WHERE obj_id=? AND field_key=?", new Object[] { id,
                                igcProfileControlId });
                if (content != null && !content.isEmpty()) {
                    IdfElement additionalDataSection = createDataSectionElement(idfDoc, igcProfileControlNode);
                    IdfElement additionalData = additionalDataSection.addElement("idf:additionalDataField")
                    	.addAttribute("id", igcProfileControlId);
                    NodeList localizedLabels = XPathUtils.getNodeList(igcProfileControlNode, "igcp:localizedLabel");
                    for (int i = 0; i < localizedLabels.getLength(); i++) {
                        Node localizedLabel = localizedLabels.item(i);
                        String title = localizedLabel.getTextContent();
                        String lang = localizedLabel.getAttributes().getNamedItem("lang").getNodeValue();
                        additionalData.addElement("idf:title").addText(title).addAttribute("lang", lang);
                    }
                    String data = content.get("data");
                    additionalData.addElement("idf:data").addText(data);
                }
            }
        } catch (Exception e) {
            log.error("Error adding additional data.", e);
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
        String igcProfileLayoutRubricId = XPathUtils.getString(igcProfileLayoutRubricNode, "igcp:id");
        // try to get the IDF additional data section node
        Node additionalDataSectionNode = XPathUtils.getNode(idfDoc,
                "/idf:html/idf:body/idf:idfMdMetadata/idf:additionalDataSection[@id='" + igcProfileLayoutRubricId
                        + "']");
        IdfElement additionalDataSection;
        if (additionalDataSectionNode == null) {
            // create IDF additional data section node
            Node idfBodyNode = XPathUtils.getNode(idfDoc, "/idf:html/idf:body");
            Element idfMetadataNode = (Element)XPathUtils.getNode(idfBodyNode, "idf:idfMdMetadata");
            if (idfMetadataNode == null) {
                idfMetadataNode = DOM.addElement((Element) idfBodyNode, "idf:idfMdMetadata").getElement();
                idfMetadataNode.setAttribute("xmlns:gmd", DOM.getNS("gmd"));
                idfMetadataNode.setAttribute("xmlns:gco", DOM.getNS("gco"));
            }
            String isLegacy = XPathUtils.getString(igcProfileLayoutRubricNode, "./@isLegacy");
            if (isLegacy == null) isLegacy = "false";
            additionalDataSection = DOM.addElement((Element) idfMetadataNode, "idf:additionalDataSection")
                    .addAttribute("id", igcProfileLayoutRubricId).addAttribute("isLegacy", isLegacy);
            NodeList localizedLabels = XPathUtils.getNodeList(igcProfileLayoutRubricNode, "igcp:localizedLabel");
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
}
