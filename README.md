# GitHub Pages Authentication (GHP-Authentication or GHPA)

GitHub Pages is a simple way to create and a website to publish content from a public or private GitHub repository. However, GitHub Pages doesn't provide any authentication controls. This means that once GitHub Pages is enabled for a private GitHub repository, all repository content is publicly accessible via the website.

However, we can implement secure web access to a private repository files by creating two separate repositories:

 1. A private repository.

     - Contains content that we want to publish on a web site, but not to the public.

     - GitHub Pages is **not** enabled on the private repository.

     - Access is managed using GitHub's built-in authentication controls.

  2. A public repository.

      - Contains front-end content that is accessible by the public.

      - GitHub Pages **is** enabled on the public repository.

      - Client-side JavaScript leverages GitHub's API to access the private repository, using authentication credentials submitted by the user.
      
    Note: Technically this doesn't need to be a public repository; it can be a private repository with GitHub Pages enbled. For clarity in these notes, I'll continue to refer to this as the 'public' repository.

This is certainly not as robust or full-featured as a web-application firewall (WAF) but it suits my needs:

 - Quick stand-up leveraging GitHub and GitHub Pages.
 
   All that's required is to stand-up the two GitHub repositories, include the GHPA.js on the GitHub Pages web site, and create the files on the private GitHub repository.

 - Low-cost (free).

 - It gave me an excuse to practice JavaScript.

## Getting Started

Step-by-step instructions are in the [GHPA Step-by-Step Instructions](GHPA-Step-by-Step.md) document.

There *are* **absolutely** security considerations that you should keep in mind. See the [GitHub Credential Security with GHPA](GitHub-Credential-Security.md) document.

## Configuration and Features

Configuration of GHPA is controlled by setting JavaScript global variables. Currently this is done by editing the master GHPA.js script; I'm going to switch this over to a JSON configuration file.  Configuration options include:

 - Defining a default GitHub organization, repository, and branch that will be accessed 

See [GHPA Configuration Options](GHPA-Configuration.md) for details.

## Examples



## Additional Documents

 - [GHPA Step-by-Step Instructions](GHPA-Step-by-Step.md)

 - [GitHub Credential Security with GHPA](GitHub-Credential-Security.md)

 - [GHPA Configuration Options](GHPA-Configuration.md)

## References

 1. (ref)

    (url-here)

(add original ghpa basis reference)

---
Content and images © Greg Scheidel
