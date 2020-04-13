'use strict';

function ghpaConfigCheck(configObject) {
    let x = 1;
}

function ghpaReadConfig(configFile) {
    return(
        fetch(configFile)    // get the config file
        .then(function (response) {
            if (response.status != 200) {
                throw new Error(`${response.status} HTTP response retrieving configuration file ${configFile}`);
            }
        })
        .catch(function (errObject) {
            console.error(`Error processing ${configFile}: ${errObject.message}`);
        })
    );
}

async function ghpaInit() {
    // read the GHPA configuration file
    ghpaConfig = await ghpaReadConfig('/examples/ghpaConfig.json');

    // if we were able to read the GHPA configuration file, then check to make sure it's all valid
    ghpaConfigCheck(ghpaConfig);
    
/*    loop through the object elements and sub-elements
        for every element/sub-element, run ghpaOptionCheck() to see if it's legit
            if it isn't legit, then log a console error and throw away the element/sub-element
*/
}

if (document.addEventListener) {
    // for modern browsers - run init after DOM is loaded
    document.addEventListener('DOMContentLoaded', ghpaInit);
} else {
    // for older browsers - run init the window is fully loaded
    window.onload=ghpaInit;
}

let ghpaConfig;
