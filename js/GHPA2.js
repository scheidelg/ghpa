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
            }
        }
    }

    if (propertyMatch) {
        if (typeof parentObject[propertyName] != 'object') {
            if (typeof parentSchemaObject[propertyMatch] == 'string') {
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
            } else {
                error.log(`Configuration schema property '${parentString} ${propertyMatch}' is not a string.`);
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

function ghpaConfigCheck2(configObject) {
// do one check working off of the configuration file and checking against the schema; another check working off of the schema and checking the configuration file
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

function ghpaReadJSONfile(JSONfile) {
    return(fetch(JSONfile)
    .then(function (response) {
        if (response.status != 200) {
            throw new Error(`${response.status} HTTP response retrieving JSON file ${JSONfile}`);
        }
        return (response.json());
    })
    .catch(function (errObject) {
        console.error(`Error processing ${JSONfile}: ${errObject.message}`);
    }));
}

async function ghpaInit() {
    // read the GHPA configuration and the GHPA configuration schema
    if (!(ghpaConfig = await ghpaReadJSONfile('/ghpaConfig.json')) || !(ghpaConfigSchema = await ghpaReadJSONfile('/ghpaConfigSchema.json'))) {
        console.error('Failed to load one of the GHPA configuration file or GHPA configuration schema file; exiting.');
        return;
    }

    let fritz = {};

    fritz = {a:0, b:3} ;
    cloneObject(ghpaConfig, fritz);

/*    fritz = {a:0, b:3} ;
    cloneObject(ghpaConfig, fritz, 1);

    fritz = {} ;
    cloneObject(ghpaConfig, fritz); */

    // process the GHPA configuration schema to ensure that it doesn't have any issues; everything needs to be solid to continue
    if (! ghpaConfigSchemaLintCheck(ghpaConfigSchema)) {
        console.error('GHPA configuration schema failed lint check; exiting.');
        return;
    }

    // if we were able to read the GHPA configuration file, then check to make sure it's all valid
//    ghpaConfigCheck(ghpaConfig);

    let x=1;
}

function cloneObject(sourceObject, targetObject, cloneType) {
    // cloneType === 0: blow away existing targetObject
    // cloneType === 1: all sourceObject properties replace existing targetObject properties;
    //                  but extra targetObject properties are retained
    // cloneType === 2: keep existing targetObject properties and property values

    function cloneObjectRecursion(sourceObject, targetObject, cloneType) {
        // iterate through all properties in sourceObject
        for (const propertyKey in sourceObject) {
            if (sourceObject.hasOwnProperty(propertyKey))   {      // only non-inherited properties
                // if cloneType 1, then delete existing targetObject properties that conflict with copied sourceObject properties;
                // but don't delete a targetObject object properties that matchies the sourceObject object property key
                if ((cloneType === 1) && targetObject.hasOwnProperty(propertyKey) && (typeof targetObject[propertyKey] !== 'object')) {
                    delete targetObject[propertyKey]
                }

                // if sourceObject[propertyKey] is an object
                if (typeof sourceObject[propertyKey] === 'object') {
                    // if the property doeesn't exist in the target, then create it as an empty object
                    if (! targetObject.hasOwnProperty(propertyKey)) {
                        targetObject[propertyKey] = {};
                    }

                    // if the property exists in the target - either because it already did or because we just created it - and is an object, then recurse
                    if (targetObject.hasOwnProperty(propertyKey) && (typeof targetObject[propertyKey] === 'object')) {
                        cloneObjectRecursion(sourceObject[propertyKey], targetObject[propertyKey], cloneType);
                    }

                // else sourceObject[propertyKey] is not an object
                } else {
                    // if the target property doesn't exist - either because it wasn't present to begin with or because we deleted it - then set it
                    if (! targetObject.hasOwnProperty(propertyKey)) {
                        targetObject[propertyKey] = sourceObject[propertyKey];
                    }
                }
            }
        }
    }

    // if cloneType is undefined (i.e., wasn't passed as an argument) or 0
    //
    // technically we could just make this all in the main function, but I like the idea of having the code for this initial
    // check for an empty cloneType only happen once
    if (! cloneType) {
        for (const propertyKey in targetObject){
            if (targetObject.hasOwnProperty(propertyKey)){
                delete targetObject[propertyKey];
            }
        }
    }

    // kick off the recursion
    cloneObjectRecursion(sourceObject, targetObject, cloneType);
}

function ghpaConfigSchemaLintCheck(configSchemaObject, configSchemaObjectString, configSchemaRoot) {
    let propertyString;
    let returnValue = true;

    configSchemaObjectString = (! configSchemaObjectString) ? '/' : (configSchemaObjectString + ' /');
    if (! configSchemaRoot) { configSchemaRoot = configSchemaObject; }

// TO DO: test the 'for...in' with 'const' instead of 'let'; if it works, replicate everywhere
    for (const propertyKey in configSchemaObject) {        // iterate through all properties in the passed object
        if (configSchemaObject.hasOwnProperty(propertyKey)) {        // only continue if this is a non-inherited property
            propertyString = configSchemaObjectString + ' ' + propertyKey;
console.log(`schema lint check: ${propertyString}`);       // debugging - get rid of this

            // if propertyName starts with '(' - in other words, a configuration schema directive
            if (propertyKey.charAt(0) === '(') {

                if (typeof configSchemaObject[propertyKey] !== 'object') {
                    console.error(`Configuration schema directive '${propertyString}' is not an object.`);
                    returnValue = false;
                }

                // must end with a closing ')' character
                if (propertyKey.slice(-1) === ')') {

                    // if we find regular expression classes, check to make sure it and it's child properties are valid
                    if (propertyKey === '(regex-classes)') {
                        // if we're at the root of the configuration schema then validate child properties
                        if (configSchemaObjectString === '/') {
                            for (const regexClassName in configSchemaObject[propertyKey]) {     // we'll still get to this code  even if '(regex-classes)' isn't an object, but there won't be any children properties so it's OK - no error
                                if (configSchemaObject[propertyKey].hasOwnProperty(regexClassName)) {        // only continue if this is a non-inherited property
                                    // if the regex class value is a string, then test whether this is a valid regular expression
                                    if (typeof configSchemaObject[propertyKey][regexClassName] === 'string') {
                                        // try to use the string as a regular expression; catch any errorrs
                                        try {
                                            new RegExp(configSchemaObject[propertyKey][regexClassName]);
                                        } catch (errorObject) {
                                            console.error(`Configuration schema property '${propertyKey} / ${regexClassName}' value /${configSchemaObject[regexClassName]}/ isn't a valid regular expression.`);
                                            returnValue = false;
                                        }
                                    // regex class property value isn't a string; error
                                    } else {
                                        console.error(`Configuration schema property '${propertyKey} / ${regexClassName}' isn't a string.`);
                                        returnValue = false;
                                    }
                                }
                            }
                        // not at the root; log an error and set returnValue to false
                        } else {
                            console.error(`Configuration schema directive '${propertyString}' error; regular expression classes can only be defined at the root of the configuration schema.`);
                            returnValue = false;
                        }

                    // a dynamic configuration schema directive
                    } else {

                        // get the property key that's referenced by this dynamic configuration schema directive
                        const propertyKeyReferenced = propertyKey.slice(1, -1);

                        // make sure that the referenced property key actually exists
                        if (!(propertyKeyReferenced && configSchemaObject.hasOwnProperty(propertyKeyReferenced))) {
                            console.error(`Configuration schema directive '${propertyString}' references a non-existent configuration schema property.`);
                            returnValue = false;
                        }

                        // check for required and invalid child properties of a dynamic configuration schema directive
                        // already reported on whether this is an object; testing here to avoid spurious error messages
                        if (typeof configSchemaObject[propertyKey] === 'object') {

                            // checks specific to a dynamic configuration schema directive that references an object property
                            if (propertyKeyReferenced && configSchemaObject.hasOwnProperty(propertyKeyReferenced) && typeof configSchemaObject[propertyKeyReferenced] === 'object') {
                                // 'value-regex' child property can't exist
                                if (configSchemaObject[propertyKey]['value-regex']) {
                                    console.error(`Configuration schema directive '${propertyString}' is for an object property and has a child property 'value-regex'.`);
                                    returnValue = false;
                                }
                            }

                            // 'required' child property must exist for all dynamic configuration schema directives
                            if (! configSchemaObject[propertyKey].hasOwnProperty('required')) {
                                console.error(`Configuration schema directive '${propertyString}' doesn't have a child property 'required'.`);
                                returnValue = false;
                            }

                            // check for required, invalid, and default child properties for configuration schema directive of a wildcard property
                            if (propertyKey.charAt(1) === '*') {
                                // 'key-regex' child property must exist
                                if (! configSchemaObject[propertyKey].hasOwnProperty('key-regex')) {
                                    console.error(`Configuration schema directive '${propertyString}' is for a wildcard property but doesn't have a child property 'key-regex'.`);
                                    returnValue = false;
                                }

                                // 'create-by-default' child property can't exist
                                if (configSchemaObject[propertyKey].hasOwnProperty('create-by-default')) {
                                    console.error(`Configuration schema directive '${propertyString}' is for a wildcard property and has a child property 'create-by-default'.`);
                                    returnValue = false;
                                }

                            // check for required and default child properties for configuration schema directive of a non-wildcard property
                            } else {
                                // 'key-regex' child property can't exist
                                if (configSchemaObject[propertyKey].hasOwnProperty('key-regex')) {
                                    console.error(`Configuration schema directive '${propertyString}' is for a named property and has a child property 'key-regex'.`);
                                    returnValue = false;
                                }

                                // 'create-by-default' child property must exist
                                if (! configSchemaObject[propertyKey].hasOwnProperty('create-by-default')) {
                                    console.error(`Configuration schema directive '${propertyString}' is for a named property but doesn't have a child property 'create-by-default'.`);
                                    returnValue = false;
                                }
                            }

                            // check to make sure that any propertyKey subkeys that do exist are correctly defined
                            for (const propertyKeySubkey in configSchemaObject[propertyKey]) {
                                if (configSchemaObject[propertyKey].hasOwnProperty(propertyKeySubkey)) {        // only continue if this is a non-inherited property

                                    switch(propertyKeySubkey) {
                                        case 'key-regex':
                                        case 'value-regex':

                                            // if the propertyKeySubkey value is a string, then test whether this is a valid regular expression
                                            // or references a valid regex class
                                            if (typeof configSchemaObject[propertyKey][propertyKeySubkey] === 'string') {

                                                // is propertyKeySubkeya reference to a regex class?
                                                if (configSchemaObject[propertyKey][propertyKeySubkey].slice(0, 13) === '(regex-class:') {
                                                    const regexMatches = configSchemaObject[propertyKey][propertyKeySubkey].match(/\(regex-class:(.*)\)/);

                                                    // test whether this is a reference to a valid regex class
                                                    if (!(regexMatches &&
                                                        configSchemaRoot.hasOwnProperty('(regex-classes)') &&
                                                        (typeof configSchemaRoot['(regex-classes)'] === 'object') &&
                                                        configSchemaRoot['(regex-classes)'].hasOwnProperty(regexMatches[1]))) {

                                                            console.error(`Configuration schema property '${propertyKey} / ${propertyKeySubkey}' references a non-existing regular expression class.`);
                                                            returnValue = false;
                                                    }

                                                // propertyKeySubkey is not a reference to a regex class; test whether it's a valid regex
                                                } else {
                                                    // try to use the string as a regular expression; catch any errorrs
                                                    try {
                                                        new RegExp(configSchemaObject[propertyKey][propertyKeySubkey]);
                                                    } catch (errorObject) {
                                                        console.error(`Configuration schema property '${propertyKey} / ${propertyKeySubkey}' value /${configSchemaObject[propertyKeySubkey]}/ isn't a valid regular expression.`);
                                                        returnValue = false;
                                                    }
                                                }

                                            // propertyKeySubkey property value isn't a string; error
                                            } else {
                                                console.error(`Configuration schema property '${propertyKey} / ${propertyKeySubkey}' isn't a string.`);
                                                returnValue = false;
                                            }
                                            break;

                                        case 'required':
                                        case 'create-by-default':

                                            if (typeof configSchemaObject[propertyKey][propertyKeySubkey] !== 'boolean') {
                                                console.error(`Configuration schema property '${propertyKey} / ${propertyKeySubkey}' isn't a boolean.`);
                                                returnValue = false;
                                            }
                                            break;

                                        default:
                                            console.error(`Configuration schema property '${propertyKey} / ${propertyKeySubkey}' isn't a valid sub-property of a configuration schema directive.`);
                                            returnValue = false;
                                            break;
                                    }
                                }
                            }
                        }
                    }

                // configuration schema directive that doesn't end with a closing ')' character?
                } else {
                    console.error(`Configuration schema property '${propertyString}' starts with a '(' but doesn't end with a ')'.`);
                    returnValue = false;
                }

            // not a configuration schema directive (standard or dynamic)
            } else {
                // must have a corresponding configuration schema directive at the same level
                if (! configSchemaObject.hasOwnProperty(`(${propertyKey})`)) {
                    console.error(`Configuration schema property '${propertyString}' doesn't have a matching configuration schema directive.`);
                    returnValue = false;
                }

                // if this proeprty is an object, then recurse
                if (typeof configSchemaObject[propertyKey] === 'object') {
                    returnValue = ghpaConfigSchemaLintCheck(configSchemaObject[propertyKey], configSchemaObjectString + ' ' + propertyKey, configSchemaRoot) && returnValue;
                }
            }
        }
    }
    return(returnValue);
}                    
            


if (document.addEventListener) {
    // for modern browsers - run init after DOM is loaded
    document.addEventListener('DOMContentLoaded', ghpaInit);
} else {
    // for older browsers - run init the window is fully loaded
    window.onload=ghpaInit;
}

let ghpaConfig;
let ghpaConfigSchema;

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
//  - cannot start with or contain a /
/*const ghpaConfigSchema =
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


// need a way to specify whether 'required' properties will be created, or cause an error; maybe a function argument?
//  - ok, 'required' vs. 'default'
const ghpaConfigSchema2 =
{
    "(regex-classes)": {
        "URI-path": "^(([0-9a-zA-Z\$\-_\.\+\!\*\'\(\),\/])|(%[2-9a-fA-F][0-9a-fA-F]))+$",
        "URI-file": "^(([0-9a-zA-Z\$\-_\.\+\!\*\'\(\),])|(%[2-9a-fA-F][0-9a-fA-F]))+$"
    },

    "tokensOnly": true,
    
    "(tokensOnly)": {
        "required": false,
        "create-by-default": true
    },

    "pageOptions": {
        "authOnly": false,

        "(authOnly)": {
            "required": false,
            "create-by-default": true
        },

        "SSO": true,

        "(SSO)": {
            "required": false,
            "create-by-default": true
        }
    },

    "(pageOptions)": {
        "required": false,
        "create-by-default": true
    },

    "loginFormOptions": {
        "loginFormFile": "",

        "(loginFormFile)": {
            "required": false,
            "create-by-default": false,
            "regex": "(class:URI-path)"
        }
    },

    "(loginFormOptions)": {
        "required": false,
        "create-by-default": true
    },

    "ghpaClasses": {
        "*ghpaClass": {
            "organization": "",

            "(organization)": {
                "required": false,
                "create-by-default": false,
                "regex": "^[0-9a-zA-Z]([0-9a-zA-Z]|\-(?!\-))*(?<!\-)$"
            },

            "repository": "",

            "(repository)": {
                "required": false,
                "create-by-default": false,
                "regex": "^[0-9a-zA-Z_.\-]+$"
            },

            "branch": "",

            "(branch)": {
                "required": false,
                "create-by-default": false,
                "regex": "^[^\^\[\\:\?]+$"
            },

            "defaultHTMLfile": "",

            "(defaultHTMLfile)": {
                "required": false,
                "create-by-default": false,
                "regex": "(class:URI-file)"
            },

            "onlyGetBody": true,

            "(onlyGetBody)": {
                "required": false,
                "create-by-default": false
            }
        },

        "(*ghpaClass)": {
            "regex": "^[a-zA-Z]([0-9a-zA-Z]|([\-_](?![\-_])))*(?<![\-_])$"
        },

        "global": {
            "(configuration-key-class)": "*ghpaClass",

            "defaultHTMLfile": "index.html",

            "(defaultHTMLfile)": {
                "create-by-default": true
            }
        },

        "(global)": {
            "required": false,
            "create-by-default": true
        }
    },

    "(ghpaClasses)": {
        "required": false,
        "create-by-default": true
    }
};
*/

// when processing config, if an option is specified that starts with '(' or '*' then kick it back as reserved for config schema; also, no keys 'configuratin-key-class'

// note that "regex": is always optional, but in particular for for booleans - since it generally doesn't make sense, we know that it's either true or false, and if it's only one or the other then why do you need a configuration option?

// "required": and "create-by-default": don't make sense for a wildcard property; but "regex:" is required

// move config and schema config to root - but still use as arguments to the config check function

// load schema from a file as well

// make an initial pass on the schema to make sure everything is OK, report errors there (i.e., only once), remove things from the schema that don't make sense; then when processing just skip over problems with the schema

// allow comments in config files; strip them out before or as part of the *.json() call

