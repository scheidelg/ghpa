/*============================================================================
Attempt to retrieve authentication credentials from memory and - if SSO is
enabled - use them to retrieve content from the private GitHub repository.

If SSO is enabled, authentication credentials can be retrieved from memory,
and the private GitHub repository file can be retrieved; then the page content
is replaced with the retrieved content.

Otherwise, the login form is loaded and (if there was a failed attempt to load
content) a status message displayed.
   
This script file needs to be loaded within (ideally at the bottom of) the
<body>; otherwise it will generate an error when it tries to modify elements
within the <body> that haven't yet been loaded.
----------------------------------------------------------------------------*/
function ghpaLoadPage() {

/* Attempt to retrieve GitHub authentication credentials from localStorage.
 *
 * This is horribly insecure because any JavaScript on the page can access
 * localStorage.  This is only for testing / proof-of-concept purpsoes; I need
 * to (1) switch to sessionStorage and (2) use an encrypted storage
 * mechanism.
 *
 * Also need to enable support for OAuth. */
const ghpaExistingAuth = JSON.parse(localStorage.getItem('ghpaToken'));

/* If SSO is enabled and we have existing authentication credentials to use,
 * then attempt to retrieve content from the private GitHub repository. */
if (!(ghpaSSOFlag && ghpaExistingAuth && ghpaRetrieve(ghpaExistingAuth))) {

    /* If any of:
     *  - SSO isn't enabled;
     *
     *  - we don't have existing authentication credentials to use; or
     *
     *  - SSO was enabled and we do have existing authentication credentials,
     *    but we weren't able to retrieve content from the private GitHub
     *    repository
     *
     * then make sure the element ghpaPrompt  is displayed and load the login
     * form. */
    
    /* Enable display of the element ghpaPrompt.  In JavaScript, we can set
     * an elements 'style.display' property back to it's default by setting it
     * to a null string. */
    document.getElementById("ghpaPrompt").style.display = "";

    /* Load the login form and replace the HTML of the element
     * ghpaLoginForm. */
    fetch("/loginform.html").then(function (response) {
        return response.text();
    }).then(function (data) {
        document.getElementById("ghpaLoginForm").innerHTML = data;
    });
}
}
