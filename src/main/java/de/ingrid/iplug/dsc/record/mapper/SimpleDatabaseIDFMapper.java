/*
 * **************************************************-
 * InGrid-iPlug DSC
 * ==================================================
 * Copyright (C) 2014 - 2021 wemove digital solutions GmbH
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
package de.ingrid.iplug.dsc.record.mapper;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.apache.log4j.Logger;
import org.w3c.dom.Document;
import org.w3c.dom.Node;

import de.ingrid.iplug.dsc.om.DatabaseSourceRecord;
import de.ingrid.iplug.dsc.om.SourceRecord;
import de.ingrid.utils.xml.IDFNamespaceContext;
import de.ingrid.utils.xpath.XPathUtils;

/**
 * Maps a {@link DatabaseSourceRecord} into an InGrid Detail data Format (IDF).
 * <p />
 * A SQL string can be set to retrieve a record from the database, based in the
 * id and the connection supplied by the {@link DatabaseSourceRecord}.
 * <p/>
 * The mapper expects a base IDF format already present in {@link doc}.
 * 
 * 
 * 
 * @author joachim@wemove.com
 * 
 */
public class SimpleDatabaseIDFMapper implements IIdfMapper {

    protected static final Logger log = Logger
            .getLogger(SimpleDatabaseIDFMapper.class);

    private String sql;
    
    final private XPathUtils xPathUtils = new XPathUtils(new IDFNamespaceContext());

    @Override
    public void map(SourceRecord record, Document doc) throws Exception {
        if (!(record instanceof DatabaseSourceRecord)) {
            throw new IllegalArgumentException("Record is no DatabaseRecord!");
        }
        String id = (String) record.get(DatabaseSourceRecord.ID);
        Connection connection = (Connection) record
                .get(DatabaseSourceRecord.CONNECTION);
        try {
            PreparedStatement ps = connection.prepareStatement(sql);
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            rs.next();

            for (int i = 1; i <= rs.getMetaData().getColumnCount(); i++) {
                String colName = rs.getMetaData().getColumnName(i);
                String colValue = rs.getString(i);
                Node body = xPathUtils.getNode(doc, "/idf:html/idf:body");
                Node p = body.appendChild(doc.createElementNS("http://www.portalu.de/IDF/1.0", "p"));
                Node strong = p.appendChild(doc.createElementNS("http://www.portalu.de/IDF/1.0", "strong"));
                strong.appendChild(doc.createTextNode(colName+": "));
                p.appendChild(doc.createTextNode(colValue));        
            }
        } catch (SQLException e) {
            log.error("Error mapping Record.", e);
            throw e;
        }

    }

    public String getSql() {
        return sql;
    }

    public void setSql(String sql) {
        this.sql = sql;
    }
    
}
