# GitHub Credential Security with GHPA

There are multiple options, from a security perspective, for using GitHub Pages Authorization (GHPA). We don't get into all the details of GitHub security but here's are some relevant options and recommendations with a bit of explanation.

 1. Best: Use GHPA as a GitHub Application for a secure implementation..

 2. Use a GitHub organization<sup>[\[1\]](#1)</sup> as the owner of the private GitHub repository.

    If an organization owns the private GitHub repository, then you'll be able to grant users granular access to and create machine user accounts for your repository.

 3. If an organization owns the private GitHub repository, then assign granular access to users of the repository.
 
     Organizations can grant individual GitHub users granular access - including read-only access - to a repository.<sup>[\[2\]](#2)</sup> If an individual's credentials are compromised, then those compromised credentials will only have the specific access that you granted.

     Do this regardless of whether users access th GHPA-enabled website with their regular GitHub user accounts or machine user accounts.

 4. If an organization owns the private GitHub repository, then consider creating a read-only machine user account<sup>[\[3\]](#3)</sup> for each user.

    Granular access protects your content but still potentially exposes the user's GitHub credentials to a client-side exploit. If those credentials are for the user's regular GitHub user account, then compromised credentials grant the attacker the full acccess of the user's regular GitHub user account.

    A machine user account is created by the organization owning the repository and is specific to that repository. If a user only uses a machine user account to access the private GitHub repository via the GHPA-enabled website, then compromised credentials will (at least as it relates to GHPA) only grant the attacker access to that one repository.

    However:

     - Machine user accounts are only available to GitHub organizations.

     - This increases the administrative burden on you as the repository administrator.

     - From an end-user perspective, this increases the number of credentials the user has to manage. They'll need to use their assigned machine user account with the GHPA-enabled website, and their regular GitHub credentials for regular GitHub access.

 5. Require the use of GitHub personal access tokens<sup>[\[4\]](#4)</sup> to access the GHPA-enabled website.

    Users can create GitHub personal access tokens to use with their GitHub accounts. Each personal access token can be granted limited scope (i.e., privileges), which limits the damage that can be caused by compromised credentials. Personal access tokens can be individually revoked at any time, which **can** limit the damage caused by compromised credentials.

    Personal access tokens with a user's regular GitHub account is still better than authenticating with the user's regular GitHub password, and the cost (i.e., hassle of using a 40-character personal access token string) is generally worth the benefit. Remember: *If an attacker compromises a GitHub user's regular user account name and password, then the attacker will be able to login to GitHub as the user.*

    You can encourage use of GitHub personal access tokens by enabling the GHPA 'ghpaTokensOnlyFlag' option ('encourage' instead of 'require' because a user could potentially set a password of 40 hexadecimal characters).

 6. When creating a GitHub personal access token, make sure that your users limit the scope of the token.
 
    Unfortunately, the minimum scope required to read content from a private GitHub repository is *repo*.<sup>[\[5\]](#5)</sup> This scope grants 'full control of private repositories' which also includes full control of public repositories. *In the event of compromised credentials, the attacker will have access to all the public and private repositories to which the user has access*.

 7. Ask your users to enable MFA on their GitHub accounts.
 
    This is a good general practice. For GHPA specifically, this prevents the use of regular GitHub passwords and pushes users toward GitHub personal access tokens.

## Some Additional Details

In the absence of operating as a GitHub application, GHPA operates by prompting the user for their GitHub authentication credentials and using those credentials in GitHub API requests. The intent is that GHPA will only *read* the *requested* files from the *specified* private repository. However, the user has to trust that GHPA isn't going to do anything else with the credentials - either intentionally or through a compromise of the GHPA-enabled web site.

Additionally, GHPA implements single sign-on (SSO) functionality so that the user doesn't have to re-enter their credentials every time they refresh or access a new webpage. This is implemented by storing the authentication credentials in sessionStorage<sup>[\[6\]](#6)</sup>. This means that if the GHPA-enabled web site were compromised such that an attacker could run arbitrary JavaScript on the user's worksation (e.g., through cross-site scripting \[XSS\]), then the attacker could potentially browse the contents of sessionStorage and retrieve the GitHub credentials. At that point, the attacker take any action permitted to those credentials.

There are a few (minor) mitigating factors already built into the web browser DOM, GitHub and GitHub Pages, and GHPA:

 - sessionStorage is subject to 'same-origin policy'.<sup>[\[7\]](#7)</sup>

   This means there's a separate storage area for each origin (combination of website domain, protocol, and port). A successful XSS attack that runs malicious JavaScript will only be able to access that page's sessionStorage.

 - sessionStorage is cleared when the page session ends.

   This means if you close the browser window, sessionStorage is automatically cleared. Data in sessionStorage is not available across browser tabs, windows, or sessions.

   This also means that a user accessing a GHPA-enabled website must authenticate once per browser window.

 - GHPA encrypts the GitHub credentials before being saved to sessionStorage.<sup>[\[8](#8),[9\]](#9)</sup>

    This protects against casual browsing of sessionStorage to see the user ID and password (or personal access token string) in plaintext or base64-encoded text.

    *However, it does not prevent an attacker from retrieving the encryption key from memory and decrypting the GitHub credentials.* Being able to use the credentials across page reloads necessarily means saving the credentials - including decryption key data - somewhere that is accessible by the page and isn't cleared when the page is reloaded or replaced. And the steps needed to retrieve the decryption key data are readily available in the JavaScript code - which the user can access from browser memory or by accessing the GitHub-enabled website themselves.

 - GHPA's default configuration discourages use of a user's regular GitHub password, with the 'ghpaTokensOnlyFlag' option.

   This is implemented through a basic check of whether the presented 'password' matches the format for a GitHub personal access token<sup>[\[4\]](#4)</sup> string; and if not then refusing to authenticate to GitHub.

   Personal access token strings are 40 hexadecimal characters. A user could potentially use 40 hexadecimal characters string as their regular password, but I'm thinking odds are low.

 - GitHub is deprecating the use of API password authentication. This will be fully deprecated by November 2020.<sup>[\[12\]](#12)</sup>

 - GitHub accounts that have multifactor authentication (MFA) enabled - hopefully, all of them - won't be able to use their regular password to authenticate through GHPA.

 - GHPA doesn't save the GitHub credentials to sessionStorage until after successful authentication.

   This means that if a user attempts to authenticate with their regular GitHub password and fails - for whatever reason, including the deprecation of API password authentication, use of MFA, GHPA catching that a user attempted to present their regular GitHub password - then the credentials aren't persistent.

## References

 1. <a id="1"></a>Types of GitHub accounts / Organization Accounts

    https://help.github.com/en/github/getting-started-with-github/types-of-github-accounts#organization-accounts

 2. <a id="2"></a>Repository permission levels for an organization

    https://help.github.com/en/github/setting-up-and-managing-organizations-and-teams/repository-permission-levels-for-an-organization

 3. <a id="3"></a>Managing Deploy Keys / Machine users

    https://developer.github.com/v3/guides/managing-deploy-keys/#machine-users

 4. <a id="4"></a>Creating a personal access token for the command line

    https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line

 5. <a id="5"></a>Understanding scopes for OAuth Apps

    https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/

 6. <a id="6"></a>Windows.sessionstorage

    https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage

 7. <a id="7"></a>Same-origin Policy

    https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy

 8. <a id="8"></a>Web Crypto API

    https://developer.mozilla.org/en-US/docs/Web/API/Crypto

 9. <a id="9"></a>Web Crypto API Examples
 
    https://mdn.github.io/dom-examples/web-crypto/

 10. <a id="10"></a>GitHub Gist: crypto-aes.gcm.js by Chris Veness<p>"Uses the SubtleCrypto interface of the Web Cryptography API to encrypt and decrypt text using AES-GCM (AES Galois counter mode)."</p><p>An excellent and succinct set of examples.</p><p>https://gist.github.com/chrisveness/43bcda93af9f646d083fad678071b90a</p

 11. <a id="11"></a>Web Cryptography API Examples by Daniel Roesler<p>Another good set of examples for using the Web Crtypography API.</p><p>https://github.com/diafygi/webcrypto-examples</p>

 12. <a id="12"></a>GitHub Deprecation of API Password Authentication<p>https://developer.github.com/changes/2020-02-14-deprecating-password-auth/</p>
