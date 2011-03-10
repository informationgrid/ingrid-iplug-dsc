package de.ingrid.iplug.dsc.webapp.object;

import org.springframework.stereotype.Service;

import de.ingrid.admin.object.AbstractDataType;

@Service
public class ResearchDataType extends AbstractDataType {

    public ResearchDataType() {
        super("dsc_research");
    }

}