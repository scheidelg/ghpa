# GitHub Credential Security with GHPA

There are multiple options, from a security perspective, to use GitHub Pages Authorization (GHPA). There are some mitigating factors for even the worst option but here's the bottom line.

 - Use GHPA as a GitHub Application for a secure implementation.

 - Next best, use GHPA with machine accounts.

    - You'll need to create a machine account for each user that will access the private Github repository via the GHPA-enabled website.

    - The machine account will be separate from the user's standard GitHub account, increasing the number of credentials the user has to manage.

    - The machine account will have read-only access to just a specific private GitHub repository; it will not have access to the user's regular GitHub account.
 
 - Next best, use GHPA with GitHub personal access tokens<sup>[\[1\]](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line)</sup>

    - Users can use their regular GitHub user ID.
 
    - Each user will need to create a personal access token with a limited scope.

    - The minimum scope required to read content from a private GitHub repository is *repo*. This scope grants 'full control of private repositories' which also includes full control of public repositories. *In the event of compromised credentials, the attacker will be able to read all public and private repositories to which the user has access*.

    - Make sure the GHPA 'ghpaTokensOnlyFlag' is enabled to discourage the use of regular GitHub passwords.

 - Next best (and the worst), use GHPA with the user's regular user ID and password.

    - Users can use their regular GitHub user ID.

    - *In the event of compromised credentials, the attacker will be able to act as the user on GitHub including everything that the user would be able to do by logging directly into GitHub.*

## The Details

In the absence of operating as a GitHub application, GHPA operates by prompting the user for their GitHub authentication credentials and using those credentials in GitHub API requests. The intent is that GHPA will only *read* the *requested* files from the *specified* private repository. However, the user has to trust that GHPA isn't going to do anything else with the credentials - either intentionally or through a compromise of the GHPA-enabled web site.

Additionally, GHPA implements single sign-on (SSO) functionality so that the user doesn't have to re-enter their credentials every time they refresh or access a new webpage. This is implemented by storing the authentication credentials in sessionStorage<sup>[\[2\]](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)</sup>. This means that if the GHPA-enabled web site were compromised such that an attacker could run arbitrary JavaScript on the user's worksation (e.g., through cross-site scripting \[XSS\]), then the attacker could potentially browse the contents of sessionStorage and retrieve the GitHub credentials. At that point, the attacker take any action permitted to those credentials.

There are a few (minor) mitigating factors already built into the web browser DOM, GitHub and GiHut Pages, and GHPA:

 - sessionStorage is subject to "same-origin policy."<sup>[\[3\]](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)</sup>

   This means there's a separate storage area for each origin (combination of website domain, protocol, and port). A successful XSS attack that runs malicious JavaScript will only be able to access that page's sessionStorage.

 - sessionStorage is cleared when the page session ends.

   This means if you close the browser window (or tab), sessionStorage is automatically cleared. Data in sessionStorage is not available across browser sessions.

   This also means that a user accessing a GHPA-enabled website must authenticate once per browser window.

 - GHPA encrypts the GitHub credentials before being saved to sessionStorage.<sup>[\[4\]](https://developer.mozilla.org/en-US/docs/Web/API/Crypto),[\[5\]](https://developer.mozilla.org/en-US/docs/Web/API/Crypto)</sup>

    This protects against casual browsing of sessionStorage to see the user ID and password (or personal access token string) in plaintext or base64-encoded text.

    *However, it does not prevent an attacker from retrieving the encryption key from memory and decrypting the GitHub credentials.* Being able to use the credentials across page reloads necessarily means saving the credentials - including decryption key data - somewhere that is accessible by the page and isn't cleared when the page is reloaded or replaced. And the steps needed to retrieve the decryption key data are readily available in the JavaScript code - which the user can access from browser memory or by accessing the GitHub-enabled website themselves.

 - GHPA's default configuration discourages use of a user's regular GitHub password, through 'ghpaTokensOnlyFlag' option.

   This is implemented through a basic check of whether the presented 'password' matches the format for a GitHub personal access token string, which is to say a string of 40 hexadecimal characters; and if not refusing to authenticate to GitHub.

   A user could potentially use 40 hexadecimal characters string as their regular password, but I'm thinking odds are low.

 - GitHub is deprecating the use API password authentication. This will be fully deprecated by November 2020.<sup>[\[7\]](https://developer.github.com/changes/2020-02-14-deprecating-password-auth/)</sup>

 - GitHub accounts that have multifactor authentication (MFA) enabled won't be able to use their regular password to authenticate through GHPA.

 - GHPA doesn't save the GitHub credentials to sessionStorage until after successful authentication.

   This means that if a user attempts to authenticate with their regular GitHub password and fails - for whatever reason, including the deprecation of API password authentication, use of MFA, GHPA catching that a user attempted to present their regular GitHub password - then the credentials aren't persistent.

There are some additional actions - some related to the points listed above - that can be taken to migitate some risks:

 - Ask your users to enable MFA on their GitHub accounts.
 
   This is a good general practice. For GHPA specifically, this prevents the use of regular GitHub passwords and pushes users toward GitHub personal access tokens.

 - Use GHPA as a GitHub Application for a secure implementation.

 - If not using GHPA as a GitHub Application, then use GitHub machine accounts instead of regular GitHub user accounts for authentication to the private GitHub repository access via GHPA.

 - If not using GHPA as a GitHub Application and not using GitHub machine accounts, then encourage use of GitHub personal access tokens by enabling the GHPA 'ghpaTokensOnlyFlag' option ('encourage' instead of 'require' because a user could potentially set a password of 40 hexadecimal characters).

 - When creating a GitHub personal access token, make sure that your users limite the scope of the token.

   Unfortunately, the minimum scope required to read content from a private GitHub repository is *repo*. This scope grants 'full control of private repositories' which also includes full control of public repositories. *In the event of compromised credentials, the attacker will be able to read all public and private repositories to which the user has access*.

## References

 1. 'Creating a personal access token for the command line' on GitHub.com

    https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line

 2. Windows.sessionstorage

    https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage

 3. Same-origin Policy

    https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy

 4. Web Crypto API

    https://developer.mozilla.org/en-US/docs/Web/API/Crypto

 5. Web Crypto API Examples
 
    https://mdn.github.io/dom-examples/web-crypto/

 6. GitHub Gist: crypto-aes.gcm.js by Chris Veness
 
    "Uses the SubtleCrypto interface of the Web Cryptography API to encrypt and decrypt text using AES-GCM (AES Galois counter mode)."
 
    I didn't use this directly did find this to be an excellent and succinct set of examples.
    
    https://gist.github.com/chrisveness/43bcda93af9f646d083fad678071b90a

 7. GitHub Deprecation of API Password Authentication

    https://developer.github.com/changes/2020-02-14-deprecating-password-auth/
