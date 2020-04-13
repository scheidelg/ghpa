'use strict';

async function ghpaReadConfig(configFile) {
    return(await fetch(configFile)
    .then(function (response) {
        if (response.status != 200) {
            throw new Error(`${response.status} HTTP response retrieving configuration file ${configFile}`);
        }
        return response.json();
    })
    .catch(function (errObject) {
        console.error(errObject.message);
// return an empty JSON object here --- ?  test to see whether it's really necessary (or if not strictly necessary, desirable)
    }));
}

function ghpaInit() {
    // read the GHPA configuration file
    ghpaConfig = ghpaReadConfig('/examples/ghpaConfig.json');

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
