package de.ingrid.iplug.dsc.webapp.object;

import org.springframework.stereotype.Service;

import de.ingrid.admin.object.AbstractDataType;

@Service
public class AdressDataType extends AbstractDataType {

    public AdressDataType() {
        super("dsc_ecs_address");
    }

}