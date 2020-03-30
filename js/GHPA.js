/*============================================================================
GitHub Pages Authentication (GHP-Auth or GHPA)

For details on GHPA see:

 - GHPA GitHub repository: https://github.com/scheidelg/ghpa
 
 - Corresponding GHPA website, published through GitHub Pages:
   https://scheidelg.github.io/ghpa or https://ghpa.scheidel.net
   
 - GHPA GitHub repository - README.md:
   https://github.com/scheidelg/ghpa/blob/master/README.md>README.md

The GHPA JavaScript and example HTML contain a large amount of comments,
which you may want to strip out before using on a website.
----------------------------------------------------------------------------*/


/*============================================================================
Declare and define the public variables that configure the GHPA environment,
including the private GitHub organization, repository, and branch from which
we want to retrieve content.

Switch this over to a JSON configuration file later.

------------------------------------------------------------------------------
Global variables are named starting with 'ghpa'.  Local variables aren't.
------------------------------------------------------------------------------
ghpaAuthOnlyFlag              boolean

    Flag whether a web page that calls ghpaRetrieve() should just perform an
    authentication check (e.g., authentication-only) or should load a page
    from the private GitHub repository.  This is set globally in this file
    but can be overridden within an individual web page, for example:

        <head><script>ghpAuthOnlyFlag=true;</script></head>

    True:  authentication-only
    False: load a page from the private GitHub repository (recommended global
           value)

ghpaBranch                    const string

    Name of the repository branch to use when accessing the private GitHub
    repository.

ghpaDefaultHTMLfile           const string

    Name of the file to load if ghpaRetrieve() is called with ghpaFileName
    set to a directory name or from a web page that has a
    window.location.pathname of a directory name.  In both cases, identified
    by the name ending in a '/a' character.

    Typically set to 'index.html'.

ghpaLoginFormFile             const string

    Name of the file to load HTML from to replace the HTML element ID
    ghpaLoginForm.  This can be an absolute or relative path.

ghpaOrg                       const string

    Name of the organization to use when accessing the private GitHub
    repository.

ghpaRepo                      const string

    Name of the repository to use when accessing the private GitHub
    repository.

ghpaSSOFlag                   boolean

    Flag whether a web page that calls ghpaRetrieve() should just use and save
    credentials to be used for single sign-on (SSO).  When SSO is used:

     - after successful authentication to the private GitHub repository, an
       authentication token is saved in memory

     - when attempting to access the private GitHub repository, memory is
       checked for a saved authentication token; if found, the token is used
       instead of prompting the user for authentication credentials

    This is set globally in this file but can be overridden within an
    individual web page, for example:

        <head><script>ghpSSOFlag=false;</script></head>

    True:  SSO is in use (recommended global value)
    False: SSO is not in use

ghpaFilename                  string

    The filename to retrieve from the private GitHub repository.  This can
    optionally be set in the calling web page to specify that a specific
    file should be retrieved instead of just using the
    window.location.pathname of the current browser window.  For example:

        <head><script>ghpaFilename='getthisfile.html';</script></head>

    This is generally *not* set.
----------------------------------------------------------------------------*/
const ghpaOrg = 'sans-blue-team';
const ghpaRepo = 'cdnw2';
const ghpaBranch = 'test';
const ghpaDefaultHTMLfile = 'index.html';
const ghpaLoginFormFile ='/examples/loginform.html';
let ghpaSSOFlag = true;
let ghpaFilename = '';
let ghpaAuthOnlyFlag = false;


/*============================================================================
function ghpaClearSSO
------------------------------------------------------------------------------
Clear the authentication token from memory so that subsequent attempts to
access the private GitHub repository require re-authentication.
------------------------------------------------------------------------------
Arguments: none
------------------------------------------------------------------------------
Return value: none
----------------------------------------------------------------------------*/
function ghpaClearSSO() {
   localStorage.removeItem('ghpaToken');
}


/*============================================================================
function ghpaLoadPage
------------------------------------------------------------------------------
Attempt to retrieve authentication credentials from memory and - if SSO is
enabled - use them to retrieve content from the private GitHub repository.

If:

 - SSO is enabled,
  - authentication credentials can be retrieved from memory, and
  - the private GitHub repository file can be retrieved

then the page content is replaced with the retrieved content.

Otherwise, the login form is loaded and (if there was a failed attempt to load
content) a status message displayed.
   
This function needs to be called within the <body> of the calling web page;
otherwise it will generate an error when it tries to modify elements within
the <body> that haven't yet been loaded.  The recommended method is to use
the 'onload' method.  For example:

    <body onload='ghpaLoadPage()'>

Another option is to run the script within - preferably at the bottom of - the
<body>.  For example:

    <body>
        HTML goes here.
        
        <!-- ideally this should be at the bottom of the <body> -->
        <script>ghpaLoadPage();</script>
    </body>
------------------------------------------------------------------------------
Arguments: none
------------------------------------------------------------------------------
Return value: none
----------------------------------------------------------------------------*/
function ghpaLoadPage() {
    let loginFormSourceFile;
 
    /* Attempt to retrieve GitHub authentication credentials from
     * localStorage.
     *
     * This is horribly insecure because any JavaScript on the page can access
     * localStorage.  This is only for testing / proof-of-concept purpsoes; I
     * need to (1) switch to sessionStorage and (2) use an encrypted storage
     * mechanism.
     *
     * Also need to enable support for OAuth. */
    const ghpaExistingAuth = JSON.parse(localStorage.getItem('ghpaToken'));

    /* If SSO is enabled and we have existing authentication credentials to
     * use, then attempt to retrieve content from the private GitHub
     * repository. */
    if (!(ghpaSSOFlag && ghpaExistingAuth && ghpaRetrieve(ghpaExistingAuth))) {

        /* If any of:
         *  - SSO isn't enabled;
         *
         *  - we don't have existing authentication credentials to use; or
         *
         *  - SSO was enabled and we do have existing authentication
         *    credentials, but we weren't able to retrieve content from the
         *    private GitHub repository
         *
         * then make sure the element ghpaPrompt  is displayed and load the
         * login form. */

        /* Enable display of the element ghpaPrompt.  In JavaScript, we can
         * set an elements 'style.display' property back to it's default by
         * setting it to a null string. */
        document.getElementById("ghpaPrompt").style.display = "";

        /* Check the element ghpaLoginForm to see if it has a custom data
         * attribute specifying which login form to use. */
        loginFormSourceFile = document.getElementById("ghpaLoginForm").getAttribute("data-loginFormSourceFile");

        /* Load the login form and replace the HTML of the element
         * ghpaLoginForm. */
        fetch(ghpaLoginFormFile).then(function (response) {
            return response.text();
        }).then(function (data) {
            document.getElementById("ghpaLoginForm").innerHTML = data;
        });
    }
}


/*============================================================================
function ghpaRetrieve(form)
------------------------------------------------------------------------------
Attempt to authenticate to and retrieve content from the private GitHub
repository.

If authentication is successful and ghpaSSOFlag is true, then save credentials
in memory for later use.

If content can be retrieved and ghpaAuthOnlyFlag is false, then update the
content on the calling web page.

If there are any errors, update HTML on the calling web page to display the
error message.

This function can be called either from ghpaLoadPage() or directly from a web
page.  For the latter case, the most common use would be to call as part of
the submit action on a form.  For example:

    <form onsubmit="event.preventDefault(); ghpaRetrieve(this);">
------------------------------------------------------------------------------
Arguments

form                          form element

    The form element must have two input fields:

     - An id of 'ghpaLogin' to hold the user's login name.

     - An  id of 'ghpaPassword' to hold the user's password.
------------------------------------------------------------------------------
Return Value

true:  received an HTML response code of 200 when retrieving the content
       from the private GitHub repository

false: did *not* receive an HTML response code of 200
----------------------------------------------------------------------------*/
function ghpaRetrieve(form) {

    let fetchResponse=0; // really the only reason we need this is so that we can do a final check at the end, outside of the scope of the fetch request
    
    /* Extract the login and password that were passed to this function
     * (either from the authentication form or retrieved from
     * localStorage). */
    const login = form.username || form.querySelector('#ghpaLogin').value;
    const password = form.token || form.querySelector('#ghpaPassword').value;

    /* The ghpaFilename variable is initially defined in the ghpaConfig.js
     * file, and set to an emptry string.  The calling page can optionally
     * specify the private page to load by setting the value of the variable.
     *
     * If the variable is set to an empty string then retrieve the pathname of
     * the URL for the current window; if the variable is set to a non-empty
     * string, the use the current value. */
    if (ghpaFilename === '') {
        ghpaFilename = window.location.pathname;
    }

    /* If the pathname for the file to retrieve is empty or ends with a '/'
     * character, then append the default HTML file name that was set in the
     * ghpaDefaultHTMLfile variable (usually via the ghpaConfig.js file). */
    if (ghpaFilename == '' || ghpaFilename.slice(ghpaFilename.length -1) == '/') {
        ghpaFilename = ghpaFilename + ghpaDefaultHTMLfile
    }
    
    /* If the filename begins with a '/' character then remove that character.
     * Two notes:
     *
     *  - Every window.location.pathname should start with a '/' character, so
     *    this will always match unless (a) a calling page specifically sets
     *    the ghpaFilename variable without a leading '/', or (b) an edge
     *    case in a browser.
     *
     *  - Strictly speaking this shouldn't be necessary because the GitHub API
     *    is smart enough to deal with GET requests that contain '//'
     *    sequences. But, it's just a few lines of code and I think it's
     *    better to keep the GET request cleaner. */
    if (ghpaFilename.slice(0, 1) == '/') {
        ghpaFilename = ghpaFilename.slice(1)
    }

    /* Create the authentication token using the login and password that were
     * passed to this function. */
    const token = btoa(`${login}:${password}`);
    
    // Craft the GitHub GET request to retrieve the specified file.
    const request = new Request(
        `https://api.github.com/repos/${ghpaOrg}/${ghpaRepo}/contents/${ghpaFilename}?ref=${ghpaBranch}`,
        {
            method: 'GET',
            credentials: 'omit',
            headers: {
                Accept: 'application/json',
                Authorization: `Basic ${token}`
            },
        }
    );

    // send the GitHub GET request and process the results
    fetch(request).then(function (response) {
        /* If we received a response code that indicates successful
         * authentication, and we're using SSO, then store credentials for
         * later use. */
        if (ghpaSSOFlag && (response.status == 200 || response.status == 404)) {
            localStorage.setItem('ghpaToken', JSON.stringify({ username: login, token: password }));
        }

        /* If we're performing an authentication-only check and we were able
         * to authenticate, then display an appropriate message.
         *
         * Note that when performing an authentication-only check, a
         * response.status of 404 is really what we want, as it indicates
         * that authentication was successful but the specified file
         * ghpaFilename doesn't exist in the private repository.  If we get a
         * response.status of 202 then it means that the specified file does
         * exist in the private repository - which doesn't make sense for an
         * authentication-only check, since there's no reason to have a
         * corresponding file in the private repository.
         *
         * If we have a static file in the private repository that we want to
         * display after a successful login, then just retrieve that without
         * setting ghpaAuthOnlyFlag. */
        if (ghpaAuthOnlyFlag && (response.status == 200 || response.status == 404)) {
            /* Updating document.getElementById("ghpaAuthMessage").innerHTML
             * instead of document.body.innerHTML to avoid a Javascript error
             * if the content wasn't successfully retrieved. */
             document.getElementById("ghpaAuthMessage").innerHTML = `Confirmed GitHub authentication to ${ghpaOrg} / ${ghpaRepo} / ${ghpaBranch} as ${login}.` + (ghpaSSOFlag ? " Credentials saved for SSO." : "");

            /* Hide the login form (if it's currently displayed).  Once
             * the user successfully logs in, we don't want to confuse
             * them by still presenting a login form. */
            document.getElementById("ghpaLoginForm").style.display = "none";

        /* If we successfully retrieved the contents and we are not performing
         * an authentication-only check, then display the retrieved
         * content. */
        } else if (response.status == 200 && ! ghpaAuthOnlyFlag) {        
            response.json().then(function (json) { // 5
                const content = json.encoding === 'base64' ? atob(json.content) : json.content;

                // 6
                const startIdx = content.indexOf('<body');
                document.body.innerHTML = content.substring(
                    content.indexOf('>', startIdx) + 1,
                    content.indexOf('</body>'));

            });

        /* If we didn't successfully retrieve the content, then display an
         * appropriate error message. */
        } else if (response.status != 200) {
            /* Define a variable to build the message to display, so that we
             * can just have one instance in this section where we set the
             * message. */
            let authMessage = '';
            
            /* Updating document.getElementById("ghpaAuthMessage").innerHTML
             * instead of document.body.innerHTML to avoid a Javascript error
             * if the content wasn't successfully retrieved. */

            /* If this is an authentication-only check and the response code
             * was *not* 404 (file not found), then display an error message
             * specific to 'authentication failed. */
            if (ghpaAuthOnlyFlag && response.status != 404) {
                authMessage = `Failed to authenticate to ${ghpaOrg} / ${ghpaRepo} / ${ghpaBranch} as ${login} (status: ${response.status}).`;

            /* If this was an attempt to actually retrieve content (i.e., not
             * an authentication-only check), then display a generic error
             * message.
             *
             * Note: We can check present error-specific messages here if
             * desired; either inside this 'else' or through a series of
             * additional 'else if' statements. */
            } else {
                authMessage = `Failed to load ${ghpaOrg} / ${ghpaRepo} / ${ghpaBranch} / ${ghpaFilename} as ${login} (status: ${response.status}).`;
            }
        
            document.getElementById("ghpaAuthMessage").innerHTML = authMessage;
        }
        
        /* Save response.status so that we can check the response status
         * outside of the response function (i.e., at the end when we're
         * setting a return value for this entire function. */
        fetchResponse=response.status;
    });

    /* We're generally calling this from one of two places:
     *
     *  (a) On submission of an HTML form where we've prevented the default
     *      form action from firing.
     *
     *      In this case it doesn't really matter what we return from this
     *      function... but we should return *something.*
     *
     *  (b) From ghpaLoadPage.js when both SSO is enabled and authentication
     *      credentials are in localStorage.
     *
     *      In this case we want to return true/false to identify whether
     *      content was successfully loaded.  That way the loading script code
     *      can determine whether any additional action needs to be taken such
     *      as displaying a prompt and/or an error message, or presenting the
     *      login form.
     */
    return (fetchResponse == 200);
}
