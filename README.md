# Sealback

**Request confidential information, end-to-end encrypted.**

Sealback lets you ask someone for a password, access data or other confidential information and get it
back encrypted by ordinary email, without software, accounts or a server. It runs at
[sealback.org](https://sealback.org).

1. **You create a key.** Sealback creates a key file for you, which you keep, and a link that you
   send to the person who has the information.
2. **They encrypt.** The other person opens the link, enters the information and sends the
   encrypted result back to you, for example by email.
3. **You decrypt.** You open Sealback again, provide your key file and read the information.

Everything happens in the browser. Sealback is a static website: it has no backend, stores nothing
and makes no network requests after loading. Keys and messages use the
[age](https://age-encryption.org) format, so you can also decrypt with the `age` command-line tool.

## What Sealback protects against, and what not

Sealback protects against:

- **Intercepted email.** Only the holder of the key file can decrypt the message. The email
  provider, anyone reading the mailbox later, and Sealback itself cannot.
- **A swapped link.** Someone who can alter the link could substitute their own key. Both sides
  therefore see a key fingerprint (e.g. `PFHM 7TCP M85R 7GHD`). Compare it over another channel, such
  as a phone call, before sending anything important.
- **A stolen key file.** The key file is protected with a passphrase by default.
- **Future quantum computers.** Encrypted emails may be archived and attacked years later
  ("harvest now, decrypt later"). The default key type is quantum safe (see below).
- **Leaks through the browser or server logs.** Nothing is stored in the browser; the key is in the
  part of the link after `#`, which browsers never send to the server; fields for confidential
  information have spellcheck and autocomplete disabled; and the site sends no referrer.

Sealback does not protect against:

- **A compromised device or browser** (malware, malicious browser extensions) on either side.
- **A compromised website.** If the code served at sealback.org were replaced, it could leak data.
  This is mitigated organizationally (branch protection, signed commits, 2FA, a verified domain) and
  can be checked: see [Verifying the deployed site](#verifying-the-deployed-site).
- **Later loss of the key.** There is no expiry for encrypted messages. Anyone who later obtains the
  key file and its passphrase can decrypt every message sent to that key. Using a new key for each
  request limits the damage to one message; delete a key file once you expect no more messages.

### Key types

| Key type                           | Link length       | When to choose it                                                                                               |
| ---------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| Quantum Safe (ML-KEM-768 + X25519) | ~2,000 characters | Default. For long-lived or particularly sensitive information.                                                  |
| Elliptic curve (X25519)            | ~100 characters   | When a short link matters and the information is changed soon after the handover, such as a temporary password. |

The quantum-safe type is hybrid: it stays secure as long as either of the two algorithms is unbroken.

## How to use it

### Requesting information

1. Open [sealback.org](https://sealback.org) and choose **Request information**.
2. Choose the key type and a passphrase, then choose **Create key**. The key file
   (`sealback-key-<fingerprint>.age`) is downloaded. Keep it and the passphrase safe: without them,
   nobody can decrypt the information, including you.
3. Send the link to the person who has the information, by email or another way.
4. If possible, compare the key fingerprint with them over another channel, such as a phone call.

You can reuse a key for further requests: under **Already have a key file?**, choose **Open key
file** to get its link again.

**If the link doesn't work:** some email programs break long links. Send the public key instead (it
is shown below the link, as text or as a file). The other person opens
[sealback.org/#send](https://sealback.org/#send) and pastes or loads it there.

### Sending information

1. Open the link you received.
2. Compare the key fingerprint with the person who asked, if possible.
3. Enter the information and choose **Encrypt**.
4. Send the encrypted message back: choose **Send by email** to open it in your email program, copy
   it, or download it as a file (`sealback-message-<fingerprint>.age`).

### Decrypting

Open [sealback.org](https://sealback.org), choose **Decrypt information** and provide your key file and the
encrypted message (paste the text from the email, or load the file). If the key file is protected,
you are asked for the passphrase. The decryption page discards everything after 10 minutes of
inactivity.

### Decrypting with the `age` command-line tool

Key files and messages are standard age files, so you can decrypt without the browser. You need
[age](https://github.com/FiloSottile/age) **1.3.0 or later** (the first version that supports
quantum-safe keys).

```sh
age -d -i sealback-key-XXXX-XXXX-XXXX-XXXX.age message.age
```

This works for passphrase-protected key files (`.age`, `age` asks for the passphrase) and for
unprotected ones (`.txt`), and for messages saved from an email as text as well as for downloaded
files. In the other direction, Sealback decrypts messages that were encrypted with `age -r` to the
public key of a Sealback key.

## Comparison with link-based secret tools

Tools like [Yopass](https://yopass.se) or [PrivateBin](https://privatebin.info) work the other
way round: the sender encrypts, the ciphertext is stored on a server, and the decryption key is in
the link. Whoever gets the link can read the secret, until it expires. Sealback stores nothing on a
server, and the link contains only the recipient's _public_ key: whoever intercepts the link or the
message cannot decrypt anything. Only the private key in the recipient's key file can.

## Security

Please report vulnerabilities privately, not in public issues: use GitHub's
[private vulnerability reporting](https://github.com/sealback/sealback/security/advisories/new) or
the email address in [SECURITY.md](SECURITY.md), which also describes the scope and how reports are
handled.

The design keeps the code that needs to be trusted small and checkable:

- **Established cryptography.** All cryptography comes from [typage](https://github.com/FiloSottile/typage),
  the TypeScript implementation of age by its author, bundled unminified in
  [`third_party/age-encryption.js`](third_party/age-encryption.js). CI rebuilds the bundle from the
  pinned npm version and checks that it matches byte for byte.
- **No build step for application code.** The files served at sealback.org are the files in this
  repository. There is no framework and no other runtime dependency.
- **Strict Content Security Policy.** The page may only load its own scripts, styles and images, and
  cannot connect to any server (`connect-src 'none'`). It uses no cookies or other browser storage.
- **Automated checks** guard these rules against regressions: a test scans the code for forbidden
  APIs (`innerHTML`, `eval`, `fetch`, storage APIs, …) and checks the security headers of every page.

### Verifying the deployed site

Each release has a `SHA256SUMS` file with the hashes of all deployed files. The paths are the same as
in the repository, so you can check both the website and the source code against it:

```sh
TAG=v1.0.0   # the release to check
curl -fsSLO "https://github.com/sealback/sealback/releases/download/$TAG/SHA256SUMS"

# 1. The website serves exactly these files:
mkdir site
while read -r _ file; do
  curl -fsS --create-dirs -o "site/$file" "https://sealback.org/$file"
done < SHA256SUMS
(cd site && sha256sum -c ../SHA256SUMS)

# 2. The files are the ones in the tagged source code:
git clone --branch "$TAG" --depth 1 https://github.com/sealback/sealback.git src
(cd src && sha256sum -c ../SHA256SUMS)
```

On macOS, use `shasum -a 256 -c` instead of `sha256sum -c`.

## Self-hosting

Sealback is a set of static files, so you can host your own instance on any web server, also in a
subdirectory (all paths are relative). Links created on your instance point to your instance. Keys,
links and messages are compatible between instances, since they all use the age format.

**Files.** Copy these files from a release, after checking them against its `SHA256SUMS` (see
[Verifying the deployed site](#verifying-the-deployed-site)):

```sh
git clone --branch v1.0.0 --depth 1 https://github.com/sealback/sealback.git
cd sealback
mkdir -p /var/www/sealback/third_party
cp -R index.html css js img /var/www/sealback/
cp third_party/age-encryption.js /var/www/sealback/third_party/
```

No build step and no `npm install` is needed. `CNAME` is only used by GitHub Pages.

**Legal pages.** `imprint.html`, `privacy.html`, `impressum.html` and `datenschutz.html` contain the
legal details of the operator of sealback.org and must not be used for your instance. Replace them
with your own pages (the app footer links to these file names, set in `js/i18n.js`), or remove the
links if your instance does not need them.

**Name and logo.** The Apache License covers the code, but grants no rights to the Sealback name
and logo (section 6 of the license). To avoid confusing users, we ask operators of other instances
to:

- make clear that their instance is independent and not operated by the Sealback project. The app
  does this automatically: on any host other than sealback.org, the footer shows "Independent
  instance, not operated by the Sealback project. Official site: sealback.org". Please keep this
  notice;
- describe their instance as "based on Sealback" rather than as "Sealback" alone, and link to this
  project;
- not use the name or logo in a way that suggests their instance is the official service, for
  example in its domain name.

**Requirements for the server:**

- **HTTPS** (or `localhost` for testing). Browsers provide the Web Crypto API, which Sealback uses
  for key fingerprints, only to secure origins. Opening `index.html` directly as a file does not
  work either, because browsers do not load ES modules from `file://` URLs.
- `.js` files must be served with a JavaScript MIME type (`text/javascript`); most servers do this
  by default.

**Recommended HTTP headers.** The Content Security Policy is set in a `<meta>` tag because GitHub
Pages cannot set headers. If your server can, also send it as a header. Only the header form
supports `frame-ancestors`, which prevents other sites from embedding Sealback in a frame
(clickjacking). For nginx:

```nginx
add_header Content-Security-Policy "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'" always;
add_header Strict-Transport-Security "max-age=31536000" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer" always;
```

Access logs contain the visitor's IP address and the requested file, but never the part of the link
after `#`, so they do not contain public keys or messages.

**Updates.** Watch the [releases](https://github.com/sealback/sealback/releases) and the
[security advisories](https://github.com/sealback/sealback/security/advisories) of this repository,
and update your instance when a new version is published.

## Development

Requirements: Node.js 24 or later.

```sh
npm ci --ignore-scripts   # install the development tools (no install scripts)
npm run serve             # serve the site at http://localhost:8000
npm test                  # unit and interoperability tests
npm run check             # type check (JSDoc + TypeScript)
npm run format            # format all files with Prettier
```

The application is plain HTML, CSS and JavaScript (ES modules) in `index.html`, `css/` and `js/`.
The full specification is in [SPEC.md](SPEC.md).

### Updating typage

1. Bump the exact version of `age-encryption` in `package.json`.
2. Run `npm install --ignore-scripts`.
3. Run `npm run update-third-party` to regenerate `third_party/`.
4. Review the diff of `third_party/age-encryption.js`, and check that the API used by Sealback
   (listed in [SPEC.md](SPEC.md), section 4) is unchanged.
5. Run `npm run check` and `npm test`.

### Releasing

Pushing a version tag (`git tag -s v1.0.0 && git push origin v1.0.0`) runs all checks, deploys the
site to GitHub Pages and creates a GitHub release with the `SHA256SUMS` file.

## License

Sealback is licensed under the [Apache License 2.0](LICENSE).

### Third-party licenses

The bundled [`third_party/age-encryption.js`](third_party/age-encryption.js) contains the following
packages. Their full license texts are included at the top of that file.

| Package                                                                | Version | License      |
| ---------------------------------------------------------------------- | ------- | ------------ |
| [age-encryption (typage)](https://github.com/FiloSottile/typage)       | 0.3.1   | BSD-3-Clause |
| [@noble/ciphers](https://github.com/paulmillr/noble-ciphers)           | 2.4.0   | MIT          |
| [@noble/curves](https://github.com/paulmillr/noble-curves)             | 2.4.0   | MIT          |
| [@noble/hashes](https://github.com/paulmillr/noble-hashes)             | 2.4.0   | MIT          |
| [@noble/post-quantum](https://github.com/paulmillr/noble-post-quantum) | 0.5.4   | MIT          |
| [@scure/base](https://github.com/paulmillr/scure-base)                 | 2.4.0   | MIT          |

The GitHub mark in the footer is the Octicons "mark-github" icon (MIT License, GitHub Inc.).

[Imprint](https://sealback.org/imprint.html) · [Privacy policy](https://sealback.org/privacy.html)
