/**
 * Copyright (c) 2014 wemove GmbH
 * Licensed under the EUPL V.1.1
 *
 * This Software is provided to You under the terms of the European
 * Union Public License (the "EUPL") version 1.1 as published by the
 * European Union. Any use of this Software, other than as authorized
 * under this License is strictly prohibited (to the extent such use
 * is covered by a right of the copyright holder of this Software).
 *
 * This Software is provided under the License on an "AS IS" basis and
 * without warranties of any kind concerning the Software, including
 * without limitation merchantability, fitness for a particular purpose,
 * absence of defects or errors, accuracy, and non-infringement of
 * intellectual property rights other than copyright. This disclaimer
 * of warranty is an essential part of the License and a condition for
 * the grant of any rights to this Software.
 *
 * For more  details, see <http://joinup.ec.europa.eu/software/page/eupl>
 */
package de.ingrid.iplug.dsc.webapp.validation;

import org.springframework.stereotype.Service;
import org.springframework.validation.BindingResult;
import org.springframework.validation.Errors;

import de.ingrid.admin.validation.AbstractValidator;
import de.ingrid.iplug.dsc.index.DatabaseConnection;

/**
 * Validator for database connection dialog.
 * 
 * 
 * @author joachim@wemove.com
 *
 */
@Service
public class DatabaseConnectionValidator extends
        AbstractValidator<DatabaseConnection> {

    public final Errors validateDBParams(final BindingResult errors) {
        rejectIfEmptyOrWhitespace(errors, "dataBaseDriver");
        rejectIfEmptyOrWhitespace(errors, "connectionURL");
        rejectIfEmptyOrWhitespace(errors, "user");
        return errors;
    }
}
