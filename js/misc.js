/*============================================================================
function displayVarVal(myVariable, undefinedText, truthyText, falsyText)
------------------------------------------------------------------------------
Quick function to display a variable's value as text, or an appropriate string
if the variable is undefined or empty.

This entire function could be written as a sequence of ternary operations, if
desired.  It would be much shorter - but much harder to read.
------------------------------------------------------------------------------
Arguments

falsyText                           string, optional

    Specific string to display if the variable is defined but evalutes to
    false.

myVariable                          (varies)

    The variable to evalute.

truthyText                          string, optional

    Specific string to display if the variable is defined and evalutes to
    true.

undefinedText                       string, optional

    Specific string to display if the variable is undefined.

------------------------------------------------------------------------------
Variables

retval                              string

    Temporary variable to hold the return value

variableType                        string

    Result of 'typeof myVariable' at the beginning of the function, so that we
    don't have to call it multiple times.

------------------------------------------------------------------------------
Return Value:

    myVariable is undefined

        Return value of undefinedText, if specified; otherwise return
        'undefined'.

    myVariable is defined, evalutes to true

        Return value of truthyText, if specified; otherwise return
        String(myvariable).

    myVariable is defined, evalutes to false

        Return value of falsyText, if specified; otherwise return

            boolean                     String(myVariable) : false
            number                      String(myVariable) : 0
            bigint                      String(myVariable) : 0
            *                           '(empty <object type>)'

----------------------------------------------------------------------------*/
function displayVarVal(myVariable, undefinedText, truthyText, falsyText) {
    const variableType = typeof myVariable;
    let retval;

    // if the variable is undefined, just return 'undefined'
    if (variableType == 'undefined') {
        // if we were passed undefinedText then use that; otherwise use
        // 'undefined'
        retval = (typeof undefinedText == 'undefined' ? 'undefined' : undefinedText);

    // variable is defined and truthy
    } else if (myVariable) {
        // if we were passed truthyText then use that; otherwise use the
        // variable's value
        retval = (typeof truthyText == 'undefined' ? String(myVariable): truthyText);

    // variable is defined and falsy
    } else {

        // if we were passed falsyTest then use that
        if (typeof falsyText != 'undefined') {
            retval = falsyText

        // OK, now we have to check the variable type and provide
        // appropriate falsy text
        } else {
            switch(variableType) {
                case 'boolean':
                case 'number':
                case 'bigint':
                    retval = String(myVariable);
                    break;
                default:
                    retval = `(empty ${variableType})`;
            }
        }
    }

    return (retval);
}


/*============================================================================
function calloutClass(className)
------------------------------------------------------------------------------
Quick function to 'call out' all elements of a given class, for a few seconds.
------------------------------------------------------------------------------
Arguments

className                           string

    The name of the class to call out.

------------------------------------------------------------------------------
Variables

elementsInClass                     object array

    An array of the elements that are in the specified class.

oldStyles                           object array

    An array of the old styles.  Index syncs with elementsInClass

------------------------------------------------------------------------------
Return Value: true (so that calling event still takes its default action)
----------------------------------------------------------------------------*/
async function calloutClass(className) {

    // get an array of all elements matching the specified class name
    const elementsInClass = document.getElementsByClassName(className);

    // declare an array to hold the previous styles, so that we can reset
    const oldStyles = new Array(elementsInClass.length);

    // loop through all the matching elements
    for (let index = 0; index < elementsInClass.length; index++) {
        // save the old style
        oldStyles[index] = elementsInClass[index].style;

        // set the new style
        elementsInClass[index].style.border = '2px solid red';

        // set a timer to restore the old style after a few seconds
        setTimeout(function(){ elementsInClass[index].style = oldStyles[index]; }, 10000);
    }

    // return 'true' so a calling event still takes its default
    // action
    return (true);
}
