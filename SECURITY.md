# Security policy

Sealback is used to transmit confidential information, so we take security reports seriously.
Thank you for helping to keep it safe.

## Supported versions

Only the version currently deployed at https://sealback.org (the latest release) is supported.
Fixes are released as a new version and deployed there.

## Reporting a vulnerability

Please do **not** report vulnerabilities in public issues.

- Preferred: use GitHub's private vulnerability reporting via
  [Report a vulnerability](https://github.com/sealback/sealback/security/advisories/new).
- Alternatively: send an email to info at libre dot solar with "Sealback security" in the subject.

Please include a description of the problem, the steps to reproduce it, the affected version or
commit, and the browser you used. Do not include real confidential information or private keys of
other people.

We aim to acknowledge reports within one week, to keep you informed about the progress, and to
publish a fix and a security advisory as soon as possible. We are happy to credit you in the
advisory unless you prefer to stay anonymous. Please give us reasonable time to fix the issue before
disclosing it publicly.

## Scope

In scope:

- the code in this repository and the site deployed from it at https://sealback.org;
- anything that could reveal plaintext, keys or passphrases to anyone other than the intended
  recipient, for example cross-site scripting, content injection via the link, weaknesses in the
  Content Security Policy, data persisting in the browser, or flaws in how keys, fingerprints or
  messages are handled;
- differences between the deployed files and a release (see the SHA256SUMS attached to each
  release).

Out of scope here, but welcome at the respective project:

- the cryptography of the age format and its implementation typage: please report those to
  [FiloSottile/typage](https://github.com/FiloSottile/typage) or
  [age](https://github.com/FiloSottile/age), and let us know so we can update;
- GitHub Pages hosting infrastructure: report to [GitHub](https://bounty.github.com/).

Not considered vulnerabilities: attacks that require a compromised device or browser, malicious
browser extensions, or a recipient who does not check the key fingerprint as described in the
app.
