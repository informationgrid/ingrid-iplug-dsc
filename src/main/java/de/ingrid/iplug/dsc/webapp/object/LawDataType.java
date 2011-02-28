package de.ingrid.iplug.dsc.webapp.object;

import org.springframework.stereotype.Service;

import de.ingrid.admin.object.AbstractDataType;

@Service
public class LawDataType extends AbstractDataType {

    public LawDataType() {
        super("fis");
    }

}