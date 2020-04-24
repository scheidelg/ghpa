/*============================================================================
GitHub Pages Authentication (GHP-Auth or GHPA)

For details on GHPA see:

 - GHPA GitHub repository: https://github.com/scheidelg/ghpa
 
 - Corresponding GHPA website, published through GitHub Pages:
   https://scheidelg.github.io/ghpa or https://ghpa.scheidel.net
   
 - GHPA GitHub repository - README.md:
   https://github.com/scheidelg/ghpa/blob/master/README.md>README.md
   
The GHPA JavaScript and example HTML contain a large amount of comments and
are formatted for readability.  You may want to use a 'minified' version of
GHPA.
----------------------------------------------------------------------------
Copyright (c) Greg Scheidel.

Licensed under the GNU General Public License v3.0.
----------------------------------------------------------------------------*/

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

function cfReadJSONfile(JSONfile) {
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
    if (!(ghpaConfig = await cfReadJSONfile('/ghpaConfig.json')) || !(ghpaConfigSchema = await cfReadJSONfile('/ghpaConfigSchema.json'))) {
        console.error('Failed to load one of the GHPA configuration file or GHPA configuration schema file; exiting.');
        return;
    }

    // process the GHPA configuration schema to ensure that it doesn't have any issues; everything needs to be solid to continue
    if (! cfgSchemaCheck(ghpaConfigSchema)) {
        console.error('GHPA configuration schema check failed; exiting.');
        return;
    }

    // if we were able to read the GHPA configuration file, then check to make sure it's all valid
//    ghpaConfigCheck(ghpaConfig);

    let x=1;
}


/*============================================================================
function copyObject(sourceObject, targetObject, copyType)
------------------------------------------------------------------------------
Copy a JavaScript object by performing a deep copy of non-inherited
properties:

 - If a a source object's property is an object, then create a new object
   property in the target instead of simply copying the source object
   property.

   This means that target object properties will distinct object references,
   not simply references to the corresponding source object properties.

 - Recurse through the source to copy child children, grandchildren, etc.
   properties to the target.

 - If a circular reference (a child object refers to an ancestor object), is
   found, then don't copy the circular reference or it's children properties.
   Continue copying the rest of the object; and set a return value indicating
   a circular reference was found.

The copyType argument determines how any existing targetObject properties will
be handled: 0 or undefined = Deleted; 1 = replaced if they conflict with a
sourceObject property; 2 = retained even if they conflict with a sourceObject
property.

For example, given two objects:

    sourceObject = {"a": 1, "b": {"b_i": 2, "b_ii": 3}, "c": null}
    targetObject = {"a": 2, "b": {"b_ii": 5, "b_iii": 6}, "c": {}}

copyType === 0

    All existing targetObject properties are deleted before sourceObject
    is copied.  After the copy:

        targetObject = {"a": 1, "b": {"b_i": 2, "b_ii": 3}, "c": null}

    Existing properties are individually deleted instead of simply
    deleting the entire object so that any existing references to the
    object are still valid.

copyType === 1

    Existing targetObject properties are replaced if they conflict with a
    sourceObject property; otherwise existing targetObject properties are
    retained.  After the copy:

        targetObject = {"a": 1, "b": {"b_i": 2, "b_ii": 3, "b_iii": 6},
            "c": 4}

     - targetObject["a"] value of 2 is replaced with 1

     - targetObject["b"] is retained because both sourceObject["b"] and
       targetObject["b"] are objects with children properties

     - targetObject["b"]["b_ii"] value of 6 is replaced with 3

     - targetObject["b"]["b_iii"] property and value are retained because
       there is no sourceObject["b"]["b_iii"] to conflict with

     - targetObject["c"] value of {} is replaced with null; while both
       sourceObject["c"] and targetObject["c"] are objects, one is a null
       value while the other is an empty object

copyType === 2

    Existing targetObject properties are retained even if they conflict with a
    sourceObject property.  After the copy:

    sourceObject = {"a": 1, "b": {"b_i": 2, "b_ii": 3}, "c": null}
    targetObject = {"a": 2, "b": {"b_ii": 5, "b_iii": 6}, "c": {}}

        targetObject =  {"a": 2, "b": {"b_i": 2, "b_ii": 5, "b_iii": 6}, "c": {}}

     - targetObject["a"] value of 2 is retained, taking precedence over the
       sourceObject["a"] value of 1

     - targetObject["b"] is retained, including its child properties

     - targetObject["b"]["b_ii"] value of 5 is retained, taking precedence
       over sourceObject["b"]["b_ii"] value of 3

     - targetObject["b"]["b_iii"] property and value are retained
       because there is no sourceObject["b"]["b_iii"] to conflict with

     - targetObject["c"] value of {} (empty object) is retained, taking
       precedence over the sourceObject["c"] value of null

Note:

 - Only non-inherited properties are copied.

 - A valid source object and target object must be passed in as function
   arguments.

 - The properties of the copied targetObject will *not* enumerate in the same
   order as the properties of sourceObject, for two reasons.  First, we review
   the properties of the sourceObject in reverse order using while(keyIndex--)
   for slightly better performance, which means we copy the properties to
   targetObject in reverse order.  Second, if we retain existing properties
   with copyType 1 or 2, then the 'position' of those properties - relative
   to other properties - can be different in sourceObject and the copied
   targetObject.

 - If it weren't for copyType options 1 and 2, then this function could be
   much simpler.

 - If it weren't for copyType options 1 and 2 and using the return value to
   flag that circular references were found sourceObject, then we could simply
   return a new object instead of requiring a targetObject argument.

------------------------------------------------------------------------------
Arguments

sourceObject                        object

    The object to copy.

targetObject                        object

    The object to copy sourceObject into.

copyType                           number; optional

    A number that determines how any existing targetObject properties will be
    handled.

        0: All existing targetObject properties are  deleted before
           sourceObject is copied.

        1: Existing targetObject properties are replaced if they conflict with
           a sourceObject property; otherwise existing targetObject properties
           are retained.

        2: Existing targetObject properties are retained even if they conflict
           with a sourceObject property.

    See the function description for more detail.

------------------------------------------------------------------------------
Variables

authMessageElement                  object

    Reference to the web page element with id of 'ghpaAuthMessage'.

childpropertyKey                    string

    Used to iterate through sourceObject[propertyKey] properties.

keyStack                            string

    An array used as a stack to track the sourceObject keys that are being
    traversed through recursion.

    As the sourceObject keys are traversed, just before recursion the current
    propertyKey is pushed onto the stack; just after recursion that
    propertyKey is popped off the stack.
    
    The only purpose this serves is for error or log messages.  When
    reporting, we can use keyStack.join('.') to generate a string identifying
    the keys that were traversed to get to the current object.

    Keys are pushed onto keyStack at the same time object references are
    pushed onto objStack.  This means that keyStack[x] corresponds to
    objStack[x], and that the path represented by keyStack[0..x] can be used
    to access objStack[x].

objStack                            string

    As the sourceObject keys are traversed, just before recursion the current
    sourceObject[propertyKey] object is pushed onto the stack; just after
    recursion that object is popped off the stack.

    The purpose of this variable is so that we can check for circular
    references during recursion, and not recurse into an object if it is a
    circular reference.  If we're about to recurse into a property (that is an
    object), then we can check to see whether that object is already in
    objStack.  If it is, then the objects refers to one of its own ancestors;
    in other words, a circular reference.

    Keys are pushed onto keyStack at the same time object references are
    pushed onto objStack.  This means that keyStack[x] corresponds to
    objStack[x], and that the path represented by keyStack[0..x] can be used
    to access objStack[x].

    Note that if we didn't care about detailed reporting on the the circular
    reference - specifically, the path to the circular reference and the path
    to the referenced ancestor - then we wouldn't need the keyStack variable
    and objStack could be a WeakSet or WeakMap variable instead of an array;
    which could be slightly faster.

propertyKey                         string

    Used to iterate through sourceObject properties.

------------------------------------------------------------------------------
Return Value

    0: success, no issues
    1: invalid function arguments
    2: circular reference detected and logged in console; may or may not be
       a fatal error, depending on the specific use of the function
------------------------------------------------------------------------------
2020.04.24-01, original version

------------------------------------------------------------------------------
(c) Greg Scheidel, 2020.04.24, v1.0

Licensed under the GNU General Public License v3.0.
----------------------------------------------------------------------------*/
function copyObject(sourceObject, targetObject, copyType) {

    /* Define a child function that will be called for the recursive copy.
     *
     * Note:
     *
     *  - Parent and child arguments are named the same; child arguments
     *    take precedence within the scope of the child function.
     *
     *  - copyType, keyStack, and objStack aren't passed to the child
     *    copyObjectRecursion() function.  There's no need, since they will
     *    be available within the scope of the parent function; copyType
     *    doesn't change value across recursive calls; and keyStack and
     *    objStack elements change across recursive calls but values are
     *    pushed/popped before/after each recursive call and the recursive
     *    calls aren't being executed in parallel (if they were, then each
     *    recursive call would need its own copy of the stacks).
     *
     *  - Return true if no circular references are found; return false if
     *    circular references are found. */
    function copyObjectRecursion(sourceObject, targetObject) {
        /* Variable to hold return value.  Set to true at start; set to false
         * if there is an error; whenever recursing, set to 'recursion &&
         * current value'. */
        let returnValue = true;

        /* Iterate through all non-inherited properties of sourceObject.
         *
         * We're using Object.getOwnPropertyNames() to create an array of
         * enumerable and non-enumerable non-inherited properties, and
         * while(keyCounter--) to iterate - as opposed to a for...in loop; for
         * better performance.  The trade-off is using up a very small bit
         * more memory for the array. */
        const sourceObjectKeys = Object.getOwnPropertyNames(sourceObject);
        let keyIndex = sourceObjectKeys.length;
        while(keyIndex--) {
            const propertyKey = sourceObjectKeys[keyIndex];

            /* If copyType 1, then delete all existing targetObject
             * properties that conflict with sourceObject properties.
             *
             * Properties that exist in both the sourceObject and targetObject
             * but do *not* conflict:
             *
             *  - Properties with the same type and value.
             *
             *    There's no need to delete and recreate a property with the
             *    same value.
             *
             *  - Properties that are both non-null objects.
             *
             *    There's no need to delete and recreate a property that is
             *    already a non-null object and will be used as a non-null
             *    object.  Also, deleting the existing non-null object would
             *    delete any child properties - which we want to keep, at
             *    least to keep, if they don't conflict with child properties
             *    in sourceObject.
             *
             * Examples:
             *
             *    sourceObject[]===null and targetObject[]===null are both
             *    objects and have the same value.
             *
             *    sourceObject[]===0 and targetObject[]===0 are both numbers
             *    and have the same value.
             *  
             *    sourceObject[]==="" and targetObject[]==="" are both strings
             *    and have the same value.
             *  
             *    sourceObject[]==={} and targetObject[]==={} are both objects
             *    but do *not* have the same value.
             *
             * Note that for copyType 0, all existing targetObject properties
             * were cleared before starting the recursion.  For copyType 2,
             * we want existing targetObject properties to take precedence
             * (i.e., be retained). */
            if (copyType === 1 &&
                targetObject.hasOwnProperty(propertyKey) &&
                sourceObject[propertyKey] !== targetObject[propertyKey] &&
                !(typeof sourceObject[propertyKey] == 'object' &&
                    sourceObject[propertyKey] !== null &&
                    typeof targetObject[propertyKey] == 'object' &&
                    targetObject[propertyKey] !== null)) {

                /* Delete the existing targetObject property. */
                delete targetObject[propertyKey]
            }

            /* If sourceObject[propertyKey] is a non-null object, then we'll
             * want to recurse into it. */
            if (typeof sourceObject[propertyKey] == 'object' && sourceObject[propertyKey] !== null) {

                /* If the property doesn't already exist in the target, then
                 * create it as an empty object so that we can recurse into
                 * both sourceObject and targetObject. */
                if (! targetObject.hasOwnProperty(propertyKey)) {
                    targetObject[propertyKey] = {};
                }

                /* If the property exists in the target - either because it
                 * already did or because we just created it - and is a
                 * non-null object, then recurse into  sourceObject and
                 * targetObject to copy any sourceObject properties.
                 *
                 * Combined with previous actions based on copyType 0 and 1,
                 * and with the earler conditional creation of an empty
                 * object, this test allows us to replace existing target
                 * properties for copyType 0, retain existing non-conflicting
                 * non-conflicting target properties for copyType 1, and
                 * retain all existing target properties for copyType 2.
                 *
                 * We could add an additional check here for whether
                 * sourceObject[propertyKey] has any child properties, and
                 * only recurse if it does.  However, that would be more
                 * computationally expensive then just recursing and returning
                 * when the 'for' loop generates an empty set. */
                if (targetObject.hasOwnProperty(propertyKey) &&
                    typeof targetObject[propertyKey] == 'object' &&
                    targetObject[propertyKey] !== null) {

                    /* Look for the sourceObject[propertyKey] value (i.e., the
                     * object reference) in the stack of ancestor object
                     * references.  If we find it, then
                     * sourceObject[propertyKey] is a circular reference.
                     */
                    let ancestorCheck = objStack.indexOf(sourceObject[propertyKey]);

                    /* Recurse if this isn't a circular reference. */
                    if (ancestorCheck == -1) {
                        /* Push this propertyKey and the corresponding object
                         * reference onto the keyStack and objStack so that we
                         * can test whether descendant properties are circular
                         * references. */
                        keyStack.push(propertyKey);
                        objStack.push(sourceObject[propertyKey]);

                        /* Recurse; if recursion returns false then flip
                         * returnValue to false. */
                        returnValue = copyObjectRecursion(sourceObject[propertyKey], targetObject[propertyKey]) && returnValue;

                        /* Pop the processed propertyKey and corresponding
                         * object reference off keyStack and objStack. */
                        keyStack.pop();
                        objStack.pop();

                    /* If a circular reference was detected, then generate a
                     * log message and set returnValue to false.  However, do
                     * *not* error out and stop processing. We want to copy
                     * all of the branches of the original object, as far as
                     * each branch can go before hitting a circular
                     * reference. */
                    } else {
                        /* Note that this is console.log() instead of
                         * console.error().  A circular reference may or may
                         * not be an error depending on the specific use case
                         * for cloning an object. */
                        console.log(`WARNING: copyObject() circular reference detected in sourceObject; ${keyStack.join('.')}.${propertyKey} = ${keyStack.slice(0, ancestorCheck+1).join('.')}`);
                        returnValue = false;
                    }
                }

            /* If sourceObject[propertyKey] isn't an object or is a null
             * object, then we don't want to recurse; just set
             * targetObject[propertyKey]. */
            } else {
                /* If the target property doesn't exist - either because it
                 * wasn't present to begin with or because we deleted it -
                 * then set it.
                 *
                 * Combined with previous actions based on copyType 0 and 1,
                 * this test allows us to replace existing target properties
                 * for copyType 0, retain existing non-conflicting target
                 * properties for copyType 1, and retain all existing target
                 * properties for copyType 2. */
                if (! targetObject.hasOwnProperty(propertyKey)) {
                    targetObject[propertyKey] = sourceObject[propertyKey];
                }
            }
        }

        return(returnValue);
    }

    /* Initialize objStack (for circular reference checks) to the initial
     * object, with corresponding placeholder text in keyStack. */
    const keyStack = ['(root)'];
    const objStack = [sourceObject];

    /* Note: Technically the argument validation and (if copyType is 0 or
     * undefined) initial deletion of all object properties could be performed
     * in the recursive child function... In which case we wouldn't need a
     * parent function at all and could just call the recursive function to
     * begin with. However, that would mean unnecessarily including and
     * running this code in every recursive execution.  This is a better
     * trade-off. */

    /* validate argument types and values */
    if (typeof sourceObject != 'object') {
        console.error("copyObject() 'sourceObject' argument isn't an object.");
        return(1);
    }

    if (typeof targetObject != 'object') {
        console.error("copyObject() 'targetObject' argument isn't an object.");
        return(1);
    }

    if (!(typeof copyType == 'number') && (copyType < 0 || copyType > 2)) {
        console.error("copyObject() 'copyType' argument must be a number between 0 and 2 (inclusive).");
        return(1);
    }

    /* If copyType is 0 or undefined (i.e., wasn't passed as an argument or
     * was explicitely passed as undefined), then delete any existing
     * targetObject properties.
     *
     * Existing properties are individually deleted instead of simply
     * deleting the entire object so that any existing references to the
     * object are still valid. */
    if (! copyType) {
        for (const propertyKey in targetObject){
            if (targetObject.hasOwnProperty(propertyKey)){
                delete targetObject[propertyKey];
            }
        }
    }

    /* Kick off the recursive child function.
     *
     * The child function will return false if it ran into a circular
     * reference; the parent function should return 2.  The child function
     * will return true if it didn't run into a circular reference; the parent
     * function should return 0.
     *
     * Note: Inside the child function, before recursion we push the next
     * object onto objStack, and it's key onto keystack; after recursion we
     * pop those values.  We don't need to push here because we already set
     * the initial values at the top of this function when we created the
     * objStack and keyStack variables; we don't need to pop here because our
     * next step is to exit this function, and we don't need the variables any
     * more (the variables will go out of scope and the referenced memory will
     * be reclaimed). */
    return(copyObjectRecursion(sourceObject, targetObject, copyType) ? 0 : 2);
 }


function cfgSchemaCheck(cfgSchemaObj, cfgSchemaRootObj) {

    function cfgSchemaCheckRecursion(cfgSchemaObj, cfgSchemaStr) {
        let keyIndex;
        let returnValue = true;
        
        // get an array of non-inherited enumerable and non-enumerable keys for this object; do this once up top
        // because we're going to reference this array on multiple passes through the keys
        //
        // we use this technique instead of a for...in because it's faster; we *can* use this technique instead of a
        // for...in becuase we're not going to add or delete the object's keys during processing
        const cfgSchemaObjKeys = Object.getOwnPropertyNames(cfgSchemaObj);
        
        cfgSchemaStr = (! cfgSchemaStr) ? '/' : (cfgSchemaStr + ' /');

        // take an initial pass at the cfgSchemaObj properties (at this level of recursion) to find any dynamic configuration schema directives that contain
        // 'keyClass' properties; if any are found, then copy in the properties from the specified keyClass.
        //
        // by copying in the properties instead of just referencing the keyClass, we'll reduce complexity later because we
        // won't have to check local properties and keyClass properties, including not having to check for which takes
        // precedence every time.  this applies to the rest of this function's check on the cfgSchemaObj properties and later
        // when a configuration is actually used.
        //
        // we have to do this as an initial pass instead of whenever we get to the configuration schema directive in the
        // full loop because the cfgSchemaObj properties aren't guaranteed to ordered with configuration schema directives before
        // their referenced configuration options.

        // iterate through all non-inherited properties in the passed object
        keyIndex = cfgSchemaObjKeys.length;
        while(keyIndex--) {
            const propertyKey = cfgSchemaObjKeys[keyIndex];

            const propertyString = cfgSchemaStr + ' ' + propertyKey;

            // if this property is a configuration schema directive that is an object and includes a keyClass property
            if (propertyKey.charAt(0) == '(' &&
                propertyKey.slice(-1) == ')' &&
                typeof cfgSchemaObj[propertyKey] == 'object' &&
                cfgSchemaObj[propertyKey].hasOwnProperty('keyClass')) {

                // make sure that the 'keyClass' property value is a non-empty string
                if (typeof cfgSchemaObj[propertyKey]['keyClass'] == 'string' && cfgSchemaObj[propertyKey]['keyClass'].length > 0) {
                    // make sure that there is a keyClass object at the configuration schema root
                    if (cfgSchemaRootObj.hasOwnProperty('(keyClasses)') && typeof cfgSchemaRootObj['(keyClasses)'] == 'object') {
                        // check for the referenced keyClass definition, as an object
                        if (cfgSchemaRootObj['(keyClasses)'].hasOwnProperty(cfgSchemaObj[propertyKey]['keyClass']) &&
                            typeof cfgSchemaRootObj['(keyClasses)'][cfgSchemaObj[propertyKey]['keyClass']] == 'object') {

                            if (copyObject(cfgSchemaRootObj['(keyClasses)'][cfgSchemaObj[propertyKey]['keyClass']], cfgSchemaObj[propertyKey.slice(1,-1)], 2) != 0) {
                                console.error(`Error copying keyClass data '(root).(keyClasses) / ${cfgSchemaObj[propertyKey]['keyClass']}' to '${cfgSchemaStr} ${cfgSchemaObj[propertyKey]['keyClass']}'.`);
                                returnValue = false;
                            }
                        } else {
                            console.error(`Configuration schema property '${propertyString} / keyClass' references keyClass '${cfgSchemaObj[propertyKey]['keyClass']}'; '(root).(keyClasses) / ${cfgSchemaObj[propertyKey]['keyClass']}' doesn't exist as an object.`);
                            returnValue = false;
                        }

                        // check for the dynamic configuration schema directive for the referenced keyClass definition, as an object
                        if (cfgSchemaRootObj['(keyClasses)'].hasOwnProperty(`(${cfgSchemaObj[propertyKey]['keyClass']})`) && typeof cfgSchemaRootObj['(keyClasses)'][`(${cfgSchemaObj[propertyKey]['keyClass']})`] == 'object') {
                            if (copyObject(cfgSchemaRootObj['(keyClasses)'][`(${cfgSchemaObj[propertyKey]['keyClass']})`], cfgSchemaObj[propertyKey], 2) != 0) {
                                console.error(`Error copying keyClass data '/ (keyClasses) / (${cfgSchemaObj[propertyKey]['keyClass']})' to '${propertyString}'.`);
                                returnValue = false;
                            }
                        } else {
                            console.error(`Configuration schema property '${propertyString} / keyClass' references keyClass '${cfgSchemaObj[propertyKey]['keyClass']}'; '(root).(keyClasses) / (${cfgSchemaObj[propertyKey]['keyClass']})' doesn't exist as an object.`);
                            returnValue = false;
                        }

                    // there's no keyClass object at the configuration schema root
                    } else {
                        console.error(`Configuration schema property '${propertyString}' references keyClass '${cfgSchemaObj[propertyKey]['keyClass']}' but there is no '(root).(keyClass)' object.`);
                        returnValue = false;
                    }
                // 'keyClass isn't a non-empty string; error message and returnValue = false
                } else {
                    console.error(`Configuration schema property '${propertyString}' must be a non-empty string string.`);
                    returnValue = false;
                }
            }
        }

        // iterate through all non-inherited properties in the passed object
        keyIndex = cfgSchemaObjKeys.length;
        while(keyIndex--) {
            const propertyKey = cfgSchemaObjKeys[keyIndex];

            const propertyString = cfgSchemaStr + ' ' + propertyKey;
console.log(`schema check: ${propertyString}`);       // debugging - get rid of this

            // if propertyName starts with '(' - in other words, a configuration schema directive
            if (propertyKey.charAt(0) === '(') {

                if (typeof cfgSchemaObj[propertyKey] != 'object') {
                    console.error(`Configuration schema directive '${propertyString}' is not an object.`);
                    returnValue = false;
                }

                // must end with a closing ')' character
                if (propertyKey.slice(-1) === ')') {

                    if (propertyKey === '(regexClasses)' || propertyKey === '(keyClasses)') {
                        // if we're at the root of the configuration schema, then we should have already validated the regex classes before starting recursion
                        //
                        // if not at the root, then log an error and set returnValue to false
                        if (cfgSchemaStr !== '/') {
                            console.error(`Configuration schema directive '${propertyString}' error; regular expression classes and key classes can only be defined at the root of the configuration schema.`);
                            returnValue = false;
                        }

                    // a dynamic configuration schema directive
                    } else {

                        // get the property key that's referenced by this dynamic configuration schema directive
                        const propertyKeyReferenced = propertyKey.slice(1, -1);

                        // make sure that the referenced property key actually exists
                        if (!(propertyKeyReferenced && cfgSchemaObj.hasOwnProperty(propertyKeyReferenced))) {
                            console.error(`Configuration schema directive '${propertyString}' references a non-existent configuration schema property.`);
                            returnValue = false;
                        }

                        // check for required and invalid child properties of a dynamic configuration schema directive
                        // already reported on whether this is an object; testing here to avoid spurious error messages
                        if (typeof cfgSchemaObj[propertyKey] == 'object') {

                            // checks specific to a dynamic configuration schema directive that references an object property
                            if (propertyKeyReferenced && cfgSchemaObj.hasOwnProperty(propertyKeyReferenced) && typeof cfgSchemaObj[propertyKeyReferenced] == 'object') {
                                // 'valueRegex' child property can't exist
                                if (cfgSchemaObj[propertyKey]['valueRegex']) {
                                    console.error(`Configuration schema directive '${propertyString}' is for an object property but has a child property 'valueregex'.`);
                                    returnValue = false;
                                }
                            }

                            // 'required' child property must exist for all dynamic configuration schema directives
                            if (! cfgSchemaObj[propertyKey].hasOwnProperty('required')) {
                                console.error(`Configuration schema directive '${propertyString}' doesn't have a child property 'required'.`);
                                returnValue = false;
                            }

                            // check for required, invalid, and default child properties for configuration schema directive of a wildcard property
                            if (propertyKey.charAt(1) === '*') {
                                // 'keyRegex' child property must exist
                                if (! cfgSchemaObj[propertyKey].hasOwnProperty('keyRegex')) {
                                    console.error(`Configuration schema directive '${propertyString}' is a wildcard but doesn't have a child property 'keyRegex'.`);
                                    returnValue = false;
                                }

                                // 'createByDefault' child property can't exist
                                if (cfgSchemaObj[propertyKey].hasOwnProperty('createByDefault')) {
                                    console.error(`Configuration schema directive '${propertyString}' is a wildcard and has a child property 'createByDefault'.`);
                                    returnValue = false;
                                }

                            // check for required and default child properties for configuration schema directive of a non-wildcard property
                            } else {
                                // 'keyRegex' child property can't exist
                                if (cfgSchemaObj[propertyKey].hasOwnProperty('keyRegex')) {
                                    console.error(`Configuration schema directive '${propertyString}' is for a named property but has a child property 'keyRegex'.`);
                                    returnValue = false;
                                }

                                // 'createByDefault' child property must exist
                                if (! cfgSchemaObj[propertyKey].hasOwnProperty('createByDefault')) {
                                    console.error(`Configuration schema directive '${propertyString}' is for a named property but doesn't have a child property 'createByDefault'.`);
                                    returnValue = false;
                                }
                            }

                            // check to make sure that any propertyKey subkeys that do exist are correctly defined
                            const cfgSchemaObjSubkeys = Object.getOwnPropertyNames(cfgSchemaObj[propertyKey]);
                            let subkeyIndex = cfgSchemaObjSubkeys.length;
                            while(subkeyIndex--) {
                                const propertySubkey = cfgSchemaObjSubkeys[subkeyIndex];

                                switch(propertySubkey) {
                                    case 'keyRegex':
                                    case 'valueRegex':

                                        // if the propertySubkey value is a string, then test whether this is a valid regular expression
                                        // or references a valid regex class
                                        if (typeof cfgSchemaObj[propertyKey][propertySubkey] == 'string') {

                                            // is propertySubkey a reference to a regex class?
                                            if (cfgSchemaObj[propertyKey][propertySubkey].slice(0, 12) === '(regexClass:') {
                                                const regexMatches = cfgSchemaObj[propertyKey][propertySubkey].match(/\(regexClass:(.*)\)/);

                                                // test whether this is a reference to a valid regex class
                                                if (!(regexMatches &&
                                                    cfgSchemaRootObj.hasOwnProperty('(regexClasses)') &&
                                                    typeof cfgSchemaRootObj['(regexClasses)'] == 'object' &&
                                                    cfgSchemaRootObj['(regexClasses)'].hasOwnProperty(regexMatches[1]))) {

                                                        console.error(`Configuration schema property '${propertyKey} / ${propertySubkey}' references a non-existing regular expression class.`);
                                                        returnValue = false;
                                                }

                                            // propertySubkey is not a reference to a regex class; test whether it's a valid regex
                                            } else {
                                                // try to use the string as a regular expression; catch any errorrs
                                                try {
                                                    new RegExp(cfgSchemaObj[propertyKey][propertySubkey]);
                                                } catch (errorObject) {
                                                    console.error(`Configuration schema property '${propertyKey} / ${propertySubkey}' value /${cfgSchemaObj[propertySubkey]}/ isn't a valid regular expression.`);
                                                    returnValue = false;
                                                }
                                            }

                                        // propertySubkey property value isn't a string; error
                                        } else {
                                            console.error(`Configuration schema property '${propertyKey} / ${propertySubkey}' isn't a string.`);
                                            returnValue = false;
                                        }
                                        break;

                                    case 'required':
                                    case 'createByDefault':

                                        if (typeof cfgSchemaObj[propertyKey][propertySubkey] != 'boolean') {
                                            console.error(`Configuration schema property '${propertyKey} / ${propertySubkey}' isn't a boolean.`);
                                            returnValue = false;
                                        }
                                        break;

                                    case 'keyClass':
                                        break;

                                    default:
                                        console.error(`Configuration schema property '${propertyKey} / ${propertySubkey}' isn't a valid property of a dynamic configuration schema directive.`);
                                        returnValue = false;
                                        break;
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
                if (! cfgSchemaObj.hasOwnProperty(`(${propertyKey})`)) {
                    console.error(`Configuration schema property '${propertyString}' doesn't have a matching configuration schema directive.`);
                    returnValue = false;
                }

                // if this proeprty is an object, then recurse
                if (typeof cfgSchemaObj[propertyKey] == 'object') {
                    keyStack.push(propertyKey);
                    objStack.push(cfgSchemaObj[propertyKey]);

                    returnValue = cfgSchemaCheckRecursion(cfgSchemaObj[propertyKey], cfgSchemaStr + ' ' + propertyKey) && returnValue;

                    /* Pop the processed propertyKey and corresponding
                     * object reference off keyStack and objStack. */
                    keyStack.pop();
                    objStack.pop();
                }
            }
        }

        return(returnValue);
    }

    let returnValue = true;

    if (typeof cfgSchemaObj != 'object') {
        console.error("cfSchemaCheck() 'cfgSchemaObj' argument isn't an object.");
        return (false);
    }

    if (cfgSchemaRootObj) {
        if (typeof cfgSchemaRootObj != 'object') {
        console.error("cfSchemaCheck() 'cfgSchemaRootObj' argument isn't an object.");
            return (false);
        }
    } else {
         cfgSchemaRootObj = cfgSchemaObj;
    }

    /* Initialize objStack (for circular reference checks) to the initial
     * object, with corresponding placeholder text in keyStack. */
    const keyStack = ['(root)'];
    const objStack = [cfgSchemaObj];

    // validate '/ (regexClasses)' data before starting recursion

    // iterate through all non-inherited properties in the passed object
    if (cfgSchemaRootObj.hasOwnProperty('(regexClasses)')) {
        if (typeof cfgSchemaObj['(regexClasses)'] == 'object') {

            const cfgSchemaObjKeys = Object.getOwnPropertyNames(cfgSchemaObj['(regexClasses)']);
            let keyIndex = cfgSchemaObjKeys.length;
            while(keyIndex--) {

                const regexClassName = cfgSchemaObjKeys[keyIndex];
                
                // if the regex class value is a string, then test whether this is a valid regular expression
                if (typeof cfgSchemaObj['(regexClasses)'][regexClassName] == 'string') {
                    // try to use the string as a regular expression; catch any errorrs
                    try {
                        new RegExp(cfgSchemaObj['(regexClasses)'][regexClassName]);
                    } catch (errorObject) {
                        console.error(`Configuration schema property '(root).(regexClasses).${regexClassName}' value /${cfgSchemaObj[regexClassName]}/ isn't a valid regular expression.`);
                        returnValue = false;
                    }

                // regex class property value isn't a string; error
                } else {
                    console.error(`Configuration schema property '(root).(regexClasses).${regexClassName}' isn't a string.`);
                    returnValue = false;
                }
            }
        // '/ (regexClasses)' isn't an object
        } else {
            console.error(`Configuration schema directive '(root).(regexClasses)' error; must be an object.`);
            returnValue = false;
        }
    }

//need to add checks for keyClass syntax & structure - it's an object, each schema directive has a key, vice-versa; make sure that's all OK

    // now process everything else, including recursion if needed
    returnValue = cfgSchemaCheckRecursion(cfgSchemaObj) && returnValue;
    
    return (returnValue);
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

// when processing config, if an option is specified that starts with '(' or '*' then kick it back as reserved for config schema; also, no keys 'keyClass'

// note that "regex": is always optional, but in particular for for booleans - since it generally doesn't make sense, we know that it's either true or false, and if it's only one or the other then why do you need a configuration option?

// "required": and "createByDefault": don't make sense for a wildcard property; but "regex:" is required

// move config and schema config to root - but still use as arguments to the config check function

// load schema from a file as well

// make an initial pass on the schema to make sure everything is OK, report errors there (i.e., only once), remove things from the schema that don't make sense; then when processing just skip over problems with the schema

// allow comments in config files; strip them out before or as part of the *.json() call

// review code for appropriate use of == vs. ===
//  x copyObject()

//need to add checks for keyClass syntax & structure - it's an object, each schema directive has a key, vice-versa; make sure that's all OK
