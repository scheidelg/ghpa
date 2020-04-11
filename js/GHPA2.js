'use strict';

async function ghpaReadConfig(configFile) {
    const jsonData = await fetch(configFile)
    .then(function (response) {
        if (response.status != 200) {
            throw new Error(`${response.status} HTTP response retrieving configuration file ${configFile}`);
        }
        return response.json();
    })
    .catch(function (errObject) {
        console.error(errObject.message);
// return an empty JSON object here --- ?  test to see whether it's really necessary (or if not strictly necessary, desirable)
    });
    
    let x=1;
}

function ghpaInit() {
    ghpaReadConfig('/examples/ghpaConfig.json');
}

document.addEventListener('DOMContentLoaded', ghpaInit);
