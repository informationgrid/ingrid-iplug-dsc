package de.ingrid.iplug.dsc;

import org.springframework.stereotype.Service;

import de.ingrid.iplug.IPlugdescriptionFieldFilter;

/**
 * This class is used to filter the values that shall be inside the 
 * PlugDescritption when sending it to the iBus. It is not necessary to
 * send the whole, and sometimes huge object over the network. 
 * @author André Wallat
 *
 */
@Service
public class MappingFilter implements IPlugdescriptionFieldFilter {

	public boolean filter(Object object) {
		String key = object.toString();
/*
		if ("rankingMul".equals(key) ||
			"rankingAdd".equals(key) ||
			"mapping".equals(key)) {
			return true;
		}
*/		
		return false;
	}
}