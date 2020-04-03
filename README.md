# GitHub Pages Authentication (GHP-Authentication or GHPA)

Authenticated access to GitHub private repository content via a GitHub Pages website.
_____
GitHub Pages is a simple way to create a website to publish content from a public or private GitHub repository. However, GitHub Pages doesn't provide any authentication controls. This means that once GitHub Pages is enabled for a private GitHub repository, all repository content is publicly accessible via the website.

However, it is possible to implement secure web access to a private repository files.  We can creaset two separate repositories:

 1. A private repository.

     - Contains content that we want to publish on a website, but not to the public.

     - GitHub Pages is **not** enabled on the private repository.

     - Access is managed using GitHub's built-in authentication controls.

  2. A public repository.

      - Contains front-end content that is accessible by the public.

      - GitHub Pages **is** enabled on the public repository.

      - Client-side JavaScript leverages GitHub's API to access the private repository, using authentication credentials submitted by the user.
      
> Note: Technically this doesn't need to be a public repository; it can be a private repository with GitHub Pages enbled. For clarity in these notes, I'll continue to refer to this as the 'public' repository.

Whenever a web page is accessed on the GitHub Pages website, GHPA can automatically attempt to load and render a corresponding page from the private repository. The first time the private repository is accessed the user can be presented with a form to provide authentication credentials; if desired, subsequent attempts to retrieve content from the private repository (or private repositories) can reuse those credentials to achive a single sign-on (SSO) effect.

This is certainly not as robust or full-featured as a web-application firewall (WAF) but it suits my needs:

 - Quick stand-up leveraging GitHub and GitHub Pages.
 
   All that's required is to stand-up the two GitHub repositories, include the GHPA.js on the GitHub Pages website, and create the files on the private GitHub repository.

 - Secure-enough for my needs (see the [GitHub Credential Security with GHPA](GitHub-Credential-Security.md) document).

 - Low-cost (free aside from the time invested in creating GHPA).

 - It gave me an excuse to practice JavaScript.

## Getting Started

Step-by-step instructions are in the [GHPA Step-by-Step Instructions](GHPA-Step-by-Step.md) document.

There **are absolutely** security considerations that you should keep in mind. See the [GitHub Credential Security with GHPA](GitHub-Credential-Security.md) document.

## Configuration and Features

Configuration of GHPA is controlled by setting JavaScript global variables. Currently this is done by editing the master GHPA.js script; I'm going to switch this over to a JSON configuration file.  Global configuration options include:

 - Identifying the primary GitHub organization, repository, and branch that will be accessed for private content.
 
 - Identifying the default file name (e.g., 'index.html') that will be retrieved from the private repository if a user browses to an empty directory on the GitHub Pages site.

 - Identifying a standard login form that can be modified once and rendered on multiple pages on the GitHub Pages site.

 - Enabling or disabling single sign-on (SSO) (see the [GitHub Credential Security with GHPA](GitHub-Credential-Security.md) document).

 - Identifying whether content loaded from the private repository should replace the entire web page, or just the body (i.e., inside the '<body>/<body>' tags) of the existing web page.

Configuration options that can be set for individual GitHub Pages web pages include:

 - Overriding the configured GitHub organization, repository, and branch.

   This means that a single GHPA-enabled website can render content from multiple private repositories.

 - A specific private repository file can be loaded (instead of one that matches the name of the GitHub Pages web page).

 - Overriding the configured option to replace the entire web page vs. just the web page's body with the content loaded from the private repository.

See [GHPA Configuration Options](GHPA-Configuration.md) for details.

Also of note:

 - General website content that - for example, an initial index.html, style sheets, standard header and footers, error pages - or content that doesn't need to be secured can be on the GitHub Pages website and don't need to be mirrored in any way on the private repository.

 - A custom 404 page can be created on the GitHub Pages website and used to load and render files from the private repository.

   This means that you don't have to create a 'stub file' on the GitHub Pages website for every file in the private repository.

## Examples

In order to illustrate how GHPA can be used I created three repositories:

 - ghpa-private-1

   This is actually a public repository but illustrates the concept of a private repository with secured files. The repository does not have GitHub Pages enabled and contains a small number of sample files.

   https://github.com/scheidelg/ghpa-private-1

 - ghpa-private-2

   This is actually a public repository but illustrates the concept of a separate private repository with additional secured files. The repository does not have GitHub Pages enabled and contains a sample file.

   https://github.com/scheidelg/ghpa-private-2

 - ghpa

   This is a public repository that has GitHub Pages enabled and illustrates the concept of a frontend website that is used to render content retrieved from one or more private repositories. Multiple examples are provided to illustrate the different scenarios and options. The website is configured to use ghpa-private-1 as the primary private repository but has an example that specifically retrieves content from ghpa-private-2. 

   https://github.com/scheidelg/ghpa-private-1
   https://scheidelg.github.io/ghpa
   https://ghpa.scheidel.net/

## Credit

I created GHPA because I wanted to authenticated access controls for content published via GitHub Pages but couldn't find a suitable tool or GitHub Pages feature. While looking for that feature, I came across a web page [Github Pages and authentication, we are not that far](https://rmannibucau.metawerx.net/post/github-pages-authentication) by Romain Manni-Bucau[\[1\]](https://rmannibucau.metawerx.net/post/github-pages-authentication). That web page presented the basic concept of combining a public GitHub Pages website with authenticated access to a private repository; that concept was the kernel that grew into GHPA.

## Additional Documents

 - [GHPA Step-by-Step Instructions](GHPA-Step-by-Step.md)

 - [GitHub Credential Security with GHPA](GitHub-Credential-Security.md)

 - [GHPA Configuration Options](GHPA-Configuration.md)

## References

 1. 'Github Pages and authentication, we are not that far' by Romain Manni-Bucau, 2019.12.11
 
    https://rmannibucau.metawerx.net/post/github-pages-authentication

---
Content and images © Greg Scheidel
