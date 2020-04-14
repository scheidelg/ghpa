'use strict';

function ghpaConfigPropertyCheck(propertyName, parentSchemaObject) {
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
                if (parentSchemaObject['(key:' + keyformatPropertyName + ')']) {        // after testing, switch to: `(key:{$keyformatPropertyName})`

                    // now check whether the property we're checking matches the format specified by the keyformat's regex
                    
                    propertyMatch = '(key:' + keyformatPropertyName + ')';
                    break;      // we found a match, so we can exit the for loop
                }
                    
/*                let matches = keyformatPropertyName.match(/^\(keyformat\:(.+\))$/i);
                if (matches) {
                }
*/
            }
        }
    }

    if (propertyMatch) {
        return(propertyMatch);
    } else {
        return(1);      // bogus property
    }
}

function recurseMe(configObject, schemaObject, parentString, parentObject) {
    let propertyCheck;
    let propertyString;
    
    parentString = (! parentString) ? '/' : (parentString + ' /');
//    if (! parentString) { parentString = ''; }     // gotta start somewhere, boyo
    
    for (let propertyName in configObject) {        // iterate through all properties in the passed object
        if (configObject.hasOwnProperty(propertyName)) {        // only continue if this is a non-inherited property
            propertyString = parentString + ' ' + propertyName;
console.log(propertyString);       // debugging - get rid of this and probably (depending on how detailed we want error messages to be) the parentString argument

            // check to see if this is a valid property name and value
            propertyCheck = ghpaConfigPropertyCheck(propertyName, schemaObject);
            if (typeof propertyCheck == 'string') {      // valid
                if (typeof configObject[propertyName] == 'object') {    // only recurse if this property is an object
                    recurseMe(configObject[propertyName], schemaObject[propertyCheck], propertyString, configObject);   // recurse into sub-properties, adding this property name to the parent string
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
// (keyformat)
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
        "loginFormFile": "/^(([0-9a-z\$\-_\.\+\!\*\'\(\),\/])|(%[2-9a-f][0-9a-f]))+$/i",
    },

    "ghpaClasses": {
        "(key:ghpaClass)": {
            "organization": "/^[0-9a-z]([0-9a-z]|\-(?!\-))*(?<!\-)$/i",
            "repository": "/^0-9a-z_.\-]/i",
            "branch": "/^[^\^\[\\:\?]+$/",
            "defaultHTMLfile": "/^(([0-9a-z\$\-_\.\+\!\*\'\(\),])|(%[2-9a-f][0-9a-f]))+$/i",
            "onlyGetBody": "boolean"
        },
        "(keyformats)": {
            "ghpaClass": "/^[a-z]([0-9a-z]|([\-_](?![\-_])))*(?<![\-_])$/i"
        }
    }
};
