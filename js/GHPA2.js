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
    });
    
    let x=1;
}

ghpaReadConfig('/examples/ghpaConfig.json');
