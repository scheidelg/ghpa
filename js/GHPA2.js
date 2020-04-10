function ghpaReadConfig(configFile) {
    const jsonData = fetch(configFile)
    .then(function (response) {
        if (!response.ok) {
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
