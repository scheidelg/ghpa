'use strict';

function ghpaConfigPropertyCheck(propertyName, parentObject, parentSchemaObject, parentString) {
    let propertyMatch;

    // if the property exists in the schema
    if (parentSchemaObject[propertyName]) {
        propertyMatch =  propertyName;

    // if there are any keyformats, then check those for a match
    } else if (parentSchemaObject['(keyformats)'] && typeof parentSchemaObject['(keyformats)'] == 'object') {

        //  if there's a keyformat that matches this string
        for (let keyformatPropertyName in parentSchemaObject['(keyformats)']) {
            if (parentSchemaObject['(keyformats)'].hasOwnProperty(keyformatPropertyName)) {        // only continue if this is a non-inherited property
// so far just checking to see if there's *any* "(keyformat:*)", not necessarily a matching one
                if (parentSchemaObject[`(key:${keyformatPropertyName})`]) {

                    if (typeof parentSchemaObject['(keyformats)'][keyformatPropertyName] == 'string') {

                        try {
                            const keyRegEx = new RegExp(parentSchemaObject['(keyformats)'][keyformatPropertyName]);

                            // now check whether the property we're checking matches the format specified by the keyformat's regex
                            if (keyRegEx.test(propertyName)) {
                                propertyMatch = `(key:${keyformatPropertyName})`;
                                break;      // we found a match, so we can exit the for loop
                            }
                        } catch (errObject) {
                            error.log(`Error using configuration schema property '${parentString} (keyformats) / ${keyformatPropertyName}' as regular expression: ${errObject.message}`);
                        }

                    } else {
                        error.log(`Configuration schema property '${parentString} (keyformats) / ${keyformatPropertyName}' is not a string.`);
                    }
                } else {
                    error.log(`Configuration schema contains '${parentString} (keyformats) / ${keyformatPropertyName}' without matching '${parentString} (key:${keyformatPropertyName})'.`);
                }
                    
/*                let matches = keyformatPropertyName.match(/^\(keyformat\:(.+\))$/i);
                if (matches) {
                }
*/
            }
        }
    }

    if (propertyMatch) {
        if (typeof parentObject[propertyName] == 'object') {
// here's where you need to test for valid property values
            const propertyMatchSubstrings = parentSchemaObject[propertyMatch].match(/^(.+?)(?::(.*))?$/)

            if (propertyMatchSubstrings[1] == typeof parentObject[propertyName]) {
    // we know that the property has the correct type; now check the details
                if (propertyMatchSubstrings[2]) {       // there was a regex specified in the property
                    try {
                        const valueRegEx = new RegExp(propertyMatchSubstrings[2]);

                        if (! valueRegEx.test(String(parentObject[propertyName]))) {
                            return(3);
                        }
                    } catch (errObject) {
                        error.log(`Error using configuration property '${parentString} ${propertyName}' as regular expression: ${errObject.message}`);
                    }                
                }
            } else {
                return(2);
            }
        }

        return(propertyMatch);

    } else {
        return(1);      // bogus property
    }
}

function recurseMe(configObject, schemaObject, parentString) {      // , parentObject) {
    let propertyCheck;
    let propertyString;
    
    parentString = (! parentString) ? '/' : (parentString + ' /');
//    if (! parentString) { parentString = ''; }     // gotta start somewhere, boyo
    
    for (let propertyName in configObject) {        // iterate through all properties in the passed object
        if (configObject.hasOwnProperty(propertyName)) {        // only continue if this is a non-inherited property
            propertyString = parentString + ' ' + propertyName;
console.log(propertyString);       // debugging - get rid of this and probably (depending on how detailed we want error messages to be) the parentString argument

            // check to see if this is a valid property name and value
            propertyCheck = ghpaConfigPropertyCheck(propertyName, configObject, schemaObject, parentString);
            if (typeof propertyCheck == 'string') {      // valid
                if (typeof configObject[propertyName] == 'object') {    // only recurse if this property is an object
                    recurseMe(configObject[propertyName], schemaObject[propertyCheck], propertyString);     //, configObject);   // recurse into sub-properties, adding this property name to the parent string
                }
            } else {        // invalid
                // delete the property; s'OK to delete the current property being iterated through, just not any others
// console error message here!!! (for real, not just for debugging); different messages based on ghpaConfigPropertyCheck() return value
// write a separate function that returns a base string depending on the integer value; then massage into the actual message here; then can re-use the function when checking HTML elements and attributes
                delete configObject[propertyName];
            }
        }
    }
}

function ghpaConfigCheck(configObject) {
    recurseMe(configObject, ghpaConfigSchema);
    let x = 1;
}

function ghpaReadConfig(configFile) {
    return(fetch(configFile)
    .then(function (response) {
        if (response.status != 200) {
            throw new Error(`${response.status} HTTP response retrieving configuration file ${configFile}`);
        }
        return (response.json());
    })
    .catch(function (errObject) {
        console.error(`Error processing ${configFile}: ${errObject.message}`);
    }));
}

async function ghpaInit() {
    // read the GHPA configuration file
    ghpaConfig = await ghpaReadConfig('/examples/ghpaConfig.json');

    // if we were able to read the GHPA configuration file, then check to make sure it's all valid
    ghpaConfigCheck(ghpaConfig);

    let x=1;
}

if (document.addEventListener) {
    // for modern browsers - run init after DOM is loaded
    document.addEventListener('DOMContentLoaded', ghpaInit);
} else {
    // for older browsers - run init the window is fully loaded
    window.onload=ghpaInit;
}

let ghpaConfig;

// loginFormFile - any of:
//  - alphanumeric
//  - $-_.+!*'()\
//  - %xx where xx is 20 through FF
//
// (keyformat) / ghpaClass
//  - start with alpha
//  - any of:
//     - alphanumeric
//     - _-
//  - cannot have sequential -_
//  - cannot end with -_
//
// organization
//  - may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen
//
// repository
//  - may only contain alphanumeric, hyphen, underscore, period
//
// branch
//  - cannot contain ^[\:?
//
// defaultHTMLfile
//  - any of:
//     - alphanumeric
//     - $-_.+!*'()\
//     - %xx where xx is 20 through FF
//  - cannot start with a /
const ghpaConfigSchema =
{
    "tokensOnly": "boolean",

    "pageOptions": {
        "authOnly": "boolean",
        "SSO": "boolean"
    },

    "loginFormOptions": {
        "loginFormFile": "string:^(([0-9a-zA-Z\$\-_\.\+\!\*\'\(\),\/])|(%[2-9a-fA-F][0-9a-fA-F]))+$",
    },

    "ghpaClasses": {
        "(key:ghpaClass)": {
            "organization": "string:^[0-9a-zA-Z]([0-9a-zA-Z]|\-(?!\-))*(?<!\-)$",
            "repository": "string:^[0-9a-zA-Z_.\-]+$",
            "branch": "string:^[^\^\[\\:\?]+$",
            "defaultHTMLfile": "string:^(([0-9a-zA-Z\$\-_\.\+\!\*\'\(\),])|(%[2-9a-fA-F][0-9a-fA-F]))+$",
            "onlyGetBody": "boolean"
        },
        "(keyformats)": {
            "ghpaClass": "^[a-zA-Z]([0-9a-zA-Z]|([\-_](?![\-_])))*(?<![\-_])$"
        }
    }
};
