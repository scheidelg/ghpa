'use strict';

function recurseMe(configObject, parentString) {
    if (! parentString) { parentString = '/'; }     // gotta start somewhere, boyo
    
    for (let propertyName in configObject) {        // iterate through all properties in the passed object
        if (configObject.hasOwnProperty(propertyName)) {        // only continue if this is a non-inherited property
console.log(parentString + propertyName);
            if (typeof configObject[propertyName] == 'object') {    // only recurse if this property is an object
                recurseMe(configObject[propertyName], parentString + propertyName + '/');   // recurse into sub-properties, adding this property name to the parent string
            }
        }
    }
}

function ghpaConfigCheck(configObject) {
    recurseMe(configObject);
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
        "(keys)": {
            "(keyformat)": "/^[a-z]([0-9a-z]|([\-_](?![\-_])))*(?<![\-_])$/i",
            "organization": "/^[0-9a-z]([0-9a-z]|\-(?!\-))*(?<!\-)$/i",
            "repository": "/^0-9a-z_.\-]/i",
            "branch": "/^[^\^\[\\:\?]+$/",
            "defaultHTMLfile": ""/^(([0-9a-z\$\-_\.\+\!\*\'\(\),])|(%[2-9a-f][0-9a-f]))+$/i"",
            "onlyGetBody": "boolean"
        }
    }
};
