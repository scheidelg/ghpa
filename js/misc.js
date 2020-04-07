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
function flashElement(elementReference, flashCount, secondsNewStyle, secondsOldStyle)
------------------------------------------------------------------------------
Quick function to make an element 'flash', to call attention to it.

Note: A 'better' way to do this would be with a style class, then
adding/removing the class.
------------------------------------------------------------------------------
Arguments

elementReference                    element object

    A reference to the object element that is supposed to flash.
   
flashCount                          number, optional

    Counter while flashing; defaults to 5.

secondsNewStyle                     number, optional

    Number of milliseconds to display the new style on each flash.  Defaults
    to 900.

secondsOldStyle                     number, optional

    Number of milliseconds to display the original style (however the element
    was configured before calling this function) between each flash.

------------------------------------------------------------------------------
Variables

oldStyle                            style object

    The style that the element had before this function was called.

------------------------------------------------------------------------------
Return Value: true (so that calling event still takes its default action)
----------------------------------------------------------------------------*/
async function flashElement(elementReference, flashCount, secondsNewStyle, secondsOldStyle) {

//    let flashCount;
if (typeof flashCount == 'undefined') flashCount = 5;
    // number of milliseconds to display the new style on each
    // 'flash'
//    const secondsNewStyle = 900
if (typeof secondsNewStyle == 'undefined') secondsNewStyle = 900;
    // number of milliseconds to display the old style between
    // each 'flash'
//    const secondsOldStyle = 300
if (typeof secondsOldStyle == 'undefined') secondsOldStyle = 300;

    // save the current style information
    const oldStyle=elementReference.style;

    // set the style to use to 'flash' the content; this should
    // match the style used inside the loop
    elementReference.style.backgroundColor = 'pink';

    // set 'flashCount < 5' to the number of times you want to
    // flip between styles
    for (flashCount = 5; flashCount > 0; flashCount--) {

        // after the desired interval, revert to the original style
        setTimeout(function(){ elementReference.style = oldStyle; }, ((flashCount * (secondsNewStyle + secondsOldStyle)) + secondsNewStyle));

        // after the desired interval, change to the new style
        setTimeout(function(){ elementReference.style.backgroundColor = 'pink'; }, ((flashCount * (secondsNewStyle + secondsOldStyle)) + (secondsNewStyle + secondsOldStyle)));

    }

    // final reversion to the original style
    setTimeout(function(){ elementReference.style = oldStyle; }, ((flashCount * (secondsNewStyle + secondsOldStyle)) + secondsNewStyle));

    // return 'true' so a calling event still takes its default
    // action
    return (true);

}
