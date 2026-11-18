# Sealback — Implementation Specification

## 1. Purpose

Sealback is a static web tool that lets a non-technical person send a secret (password, API key, short text) back to someone in encrypted form, without installing software, creating an account, or using a backend.

The recipient generates an age key pair, sends the sender a link containing the public key, and receives the encrypted result by ordinary email. Only the holder of the private key can decrypt it. Encryption and decryption happen entirely in the browser.

The recipient chooses between standard encryption (X25519) and post-quantum hybrid encryption (ML-KEM-768 + X25519) depending on how long the secret must stay protected.

Hosted at `https://sealback.org`, source in the GitHub organization `sealback`, licensed under Apache-2.0.

## 2. Principles

- **No backend.** The site is a single static page hosted on GitHub Pages. It makes no network requests after loading.
- **Minimal dependencies.** The only runtime dependency is typage (`age-encryption` on npm). No frameworks, no CSS libraries, no fonts, no analytics.
- **Auditability.** The code served to users is the code in the repository, with no build step for application code. A reviewer should be able to read the whole application in one sitting.
- **Standard format.** All ciphertext and key files use the age format and must be interoperable with the `age` and `rage` CLIs, for both key types supported by them.
- **Simplicity for the sender.** The sender's flow must be usable by someone who has never heard of encryption: open link, paste secret, press a button, send email.

## 3. Threat model

In scope:

- Interception of the email carrying the ciphertext (mitigated: only the private key decrypts).
- "Harvest now, decrypt later" attacks by a future quantum computer on archived links and ciphertext (mitigated: post-quantum hybrid key type, selectable by the recipient and offered as default).
- Substitution of the public key in the link (mitigated: fingerprint shown on both sides, users instructed to compare it over another channel such as phone).
- Theft of the key file (mitigated: passphrase encryption by default).
- Later compromise of the private key (mitigated by procedure: one key pair per exchange, key file deleted after decryption).
- Accidental leakage via browser features or server logs (mitigated: no persistence, link data only in the URL fragment, spellcheck and autocomplete disabled on secret fields, no referrer).

Out of scope:

- A compromised GitHub account, repository or domain serving malicious code. Mitigated only organizationally (branch protection, signed commits, 2FA, verified domain, published release hashes); see section 10.
- A compromised end-user device or browser extension.
- Time-based expiry of ciphertext. This is not achievable without a server; the UI promotes per-exchange keys instead.

## 4. Technology

- Plain HTML, CSS and JavaScript (ES modules), no bundling of application code.
- Type checking via JSDoc annotations and `tsc --checkJs --noEmit` (development only).
- typage is included as a single self-contained ESM file at `third_party/age-encryption.js`, produced by esbuild from the pinned npm version and committed. The file starts with a comment stating the package name, version, the command used to generate it, and the license notices of typage and all bundled dependencies (`@noble/ciphers`, `@noble/curves`, `@noble/hashes`, `@noble/post-quantum`, `@scure/base` as of 0.3.1). The bundle is not minified, so it stays reviewable. Generation must be deterministic (no timestamps, fixed order of license blocks) so CI can compare it byte for byte.
- Pinned typage version: `age-encryption@0.3.1`. Its API used by Sealback: `generateX25519Identity()`, `generateHybridIdentity()`, `identityToRecipient()`, `Encrypter` (`addRecipient`, `setPassphrase`, `setScryptWorkFactor`, `encrypt`), `Decrypter` (`addIdentity`, `addPassphrase`, `decrypt`), `armor.encode`, `armor.decode`. Note that `generateIdentity()` produces an X25519 identity; Sealback always calls the type-specific functions explicitly.
- Type information for the bundled file comes from `third_party/age-encryption.d.ts`, a one-line re-export of `node_modules/age-encryption/dist/index.d.ts`. It is written by `scripts/update-third-party.sh` together with the bundle, so it always follows the pinned version and needs no manual updates. It is used only for type checking and is not deployed.
- Tests with Node's built-in `node:test`. Node.js 24 LTS or later.
- Development dependencies, all pinned to exact versions: `typescript`, `esbuild`, `age-encryption`. Install with `npm ci --ignore-scripts`.
- Interoperability reference: the `age` CLI, version 1.3.0 or later (first version with post-quantum keys, `age-keygen -pq`).

## 5. Repository structure

Repository: `github.com/sealback/sealback`.

```
/
├── index.html          The single application page
├── CNAME               "sealback.org"
├── css/
│   └── style.css       Hand-written stylesheet (~150–250 lines)
├── js/
│   ├── main.js         Entry point: reads the fragment, selects mode/tab, wires views
│   ├── crypto.js       Pure functions wrapping typage (no DOM access)
│   ├── keys.js         Key type detection and public key normalization (no DOM access)
│   ├── fingerprint.js  Fingerprint derivation (no DOM access)
│   ├── link.js         Building and parsing share links and fragments (no DOM access)
│   ├── i18n.js         String tables (en, de) and language selection
│   ├── ui.js           Shared DOM helpers: copy, download, mailto, status messages
│   ├── view-send.js    DOM logic for the send view
│   ├── view-receive.js DOM logic for the receive view
│   └── view-decrypt.js DOM logic for the decrypt view
├── third_party/
│   ├── age-encryption.js    Bundled typage (deployed)
│   └── age-encryption.d.ts  Type re-export for tsc (generated, not deployed)
├── img/
│   └── logo.svg        Placeholder logo (see section 8), also used as favicon
├── scripts/
│   └── update-third-party.sh  Regenerates both files in third_party/
├── test/
│   ├── *.test.js       node:test suites (see section 9)
│   └── fixtures/       Key files and ciphertexts created with the age CLI,
│                       plus README.md listing the exact commands and age version
├── .github/workflows/
│   ├── ci.yml          Type check, tests, third-party file check
│   └── deploy.yml      Deploy to GitHub Pages on release tag
├── package.json
├── package-lock.json
├── jsconfig.json       Strict checkJs configuration
├── README.md
└── LICENSE             Apache-2.0
```

Logic that does not need the DOM lives in `crypto.js`, `keys.js`, `fingerprint.js` and `link.js` so it can be tested in Node.

## 6. Functional requirements

### 6.1 Page structure and modes

`index.html` contains all views. `main.js` selects the mode from the URL fragment:

| Fragment | Mode | Shown |
|---|---|---|
| `#pubkey=…` (valid) | Link mode | Send view with the key preset, no tabs |
| `#pubkey=…` (invalid or truncated) | Link mode | Send view with an error explaining that the link may have been damaged, and the manual key input (6.4) |
| `#send` | Tab mode | Tabs, "Send" active, manual key input |
| `#decrypt` | Tab mode | Tabs, "Decrypt" active |
| `#receive`, empty, or anything else | Tab mode | Tabs, "Receive" active |

- **Link mode** shows nothing but the sender's task. At the bottom, a small link "Create your own key" navigates to `https://sealback.org/#receive`.
- **Tab mode** shows a header with three tabs: "Receive", "Send", "Decrypt". The active tab is reflected in the fragment, so each tab can be bookmarked and linked (e.g. `https://sealback.org/#send` as the fallback address for senders).
- Changing the fragment (`hashchange`) re-evaluates the mode. Tabs are accessible tab controls (`role="tablist"`, `role="tab"`, `role="tabpanel"`, arrow-key navigation). Switching tabs clears all secret-bearing fields of the tab being left.

### 6.2 Layout sketch

Link mode:

```
[logo] Sealback                                   [DE|EN]
──────────────────────────────────────────────────────────
Send a secret to: Martin (as stated in the link)
Protection: Post-quantum
Security code: 7KQ9 M2XR T8N5 4HCW
  Confirm this code with the recipient by phone before
  sending sensitive data.

Your secret:
┌──────────────────────────────────────────────────────┐
│                                                      │
└──────────────────────────────────────────────────────┘
                                           [ Encrypt ]

(after encryption)
Encrypted text — safe to send by normal email:
┌──────────────────────────────────────────────────────┐
│ -----BEGIN AGE ENCRYPTED FILE-----                   │
└──────────────────────────────────────────────────────┘
[ Copy ]  [ Download as file ]  [ Send by email ]*

▸ How does this work?
                                  Create your own key →

* only shown if the content fits into a mailto: link
```

Tab mode:

```
[logo] Sealback                                   [DE|EN]
──────────────────────────────────────────────────────────
  [ Receive ]  [ Send ]  [ Decrypt ]
──────────────────────────────────────────────────────────
(content of the active tab)
```

### 6.3 Receive view (generate key)

1. Explain in two or three sentences what will happen: a key file is created on this computer, and a link is created to send to the person who should send a secret.
2. Optional label field ("Your name"), included in the link for display only.
3. Encryption type selection (radio buttons), **post-quantum selected by default**:
   - "Post-quantum (recommended for long-lived or highly sensitive data)": hybrid ML-KEM-768 + X25519, age type `mlkem768x25519`. Note: the link is about 2,000 characters long.
   - "Standard (shorter link)": X25519. Note: secure today, but archived messages could become readable to future quantum computers; suitable for secrets that are rotated soon after handover.
4. Passphrase protection of the key file, **enabled by default**:
   - Passphrase entered twice; minimum length 12 characters; a short hint recommends a few random words.
   - A checkbox "Don't protect the key file with a passphrase" disables it, showing a warning that anyone who obtains the file can read the secret.
   - A note that a forgotten passphrase makes the received secret unrecoverable, and that the passphrase only needs to be kept until the secret has arrived.
5. Button "Create key". On click:
   - Generate an identity of the selected type with typage.
   - Derive the recipient (public key) and its fingerprint.
   - Produce the key file. Its plaintext content follows `age-keygen` output: `# created: <ISO 8601 timestamp>`, `# public key: <recipient>`, then the identity line, each followed by a newline. By default this content is encrypted with age's scrypt passphrase mode (decryptable by `age -d -i <file>`), using typage's default work factor; without passphrase, the plaintext content is the key file.
6. Trigger the download of the key file named `sealback-key-<YYYY-MM-DD>-<first 4 fingerprint characters>.age` (passphrase-protected) or `.txt` (plain).
7. Show the following only after the download was triggered:
   - The share link with a "Copy link" button.
   - A "Compose email" button (`mailto:` with prefilled subject and localized body containing the link and short instructions for the sender), only if the complete `mailto:` URL is at most 1,800 characters. Otherwise a note that the link must be copied into an email manually.
   - The fingerprint ("Security code").
   - A collapsible "If the link doesn't work" section with the bare public key, a "Copy public key" button, a "Download public key" button (`sealback-pubkey-<first 4 fingerprint characters>.txt`, containing only the recipient string and a trailing newline), and the instruction that the sender can open `https://sealback.org/#send` and paste or load the key there.
   - Instructions: send the link; when the sender reads out the security code, compare it; keep the key file and passphrase until the secret arrives; delete the key file after decryption.
8. Encourage one key per exchange in the UI text.

### 6.4 Send view (encrypt)

1. Determine the recipient:
   - In link mode, from the fragment (6.6).
   - In tab mode, or in link mode with an invalid key: from a manual input that accepts pasted text or a loaded text file. The input accepts either a bare public key or a complete Sealback link; `keys.js` normalizes it (section 6.7). Invalid input shows a specific error (not a key, damaged key / checksum mismatch, unsupported key type).
2. Detect the key type automatically (6.7) and display it as "Protection: Post-quantum" or "Protection: Standard". The sender never chooses the type.
3. Display the recipient label (link mode only, marked as "as stated in the link") and the fingerprint as "Security code", with the instruction to confirm it with the recipient by phone or another channel before sending sensitive data.
4. A textarea for the secret with `autocomplete="off"`, `autocorrect="off"`, `autocapitalize="off"` and `spellcheck="false"`.
5. Button "Encrypt". On click:
   - Encrypt the UTF-8 text to the recipient with typage.
   - Encode the result with age ASCII armor.
   - Clear the secret textarea.
6. Show the armored ciphertext in a read-only field with:
   - "Copy" button (Clipboard API, with a fallback that selects the text). This is the primary action.
   - "Download as file" button producing `sealback-<YYYY-MM-DD>.age` (binary age format).
   - "Send by email" button: a `mailto:` link with subject and body containing the armored ciphertext, without a preset recipient address. Only shown if the complete `mailto:` URL is at most 1,800 characters (in practice mainly for short secrets with standard keys).
7. A note that the encrypted text is safe to send by normal email, either pasted into the message or as the downloaded file attached.
8. A collapsible "How does this work?" section with a short technical explanation (age, key types, nothing leaves the browser except what the user sends).

Version 1 supports text only. File encryption is a possible later extension.

### 6.5 Decrypt view

1. Key file input (file picker and drag and drop). Supports both key types, plain or passphrase-protected; the type is detected from the file content. If the file is passphrase-protected, ask for the passphrase.
2. Ciphertext input: a textarea for armored text, or a file picker for a `.age` file.
3. Button "Decrypt". Decrypt locally and show the plaintext in a read-only field with a "Copy" button and a "Hide" button that clears it.
4. After successful decryption, show the reminder: store the secret where it belongs (e.g. a password manager), then delete the key file and the email, and rotate the secret if possible.
5. Error messages must distinguish: invalid key file, wrong passphrase, ciphertext not encrypted for this key, malformed ciphertext.
   - typage throws generic errors, so `crypto.js` must not classify them by message text. Instead:
     - Key file: `crypto.js` reads the age header itself (version line and `-> <type>` stanza lines, after removing armor if present). A header with a single `scrypt` stanza means passphrase-protected; plain text containing exactly one `AGE-SECRET-KEY-1…` or `AGE-SECRET-KEY-PQ-1…` line (besides comments and blank lines) means plain; anything else is an invalid key file.
     - Decryption: after the real identity (or passphrase), a "sentinel" identity is added through typage's public `Identity` interface. It never matches and only records that it was called. typage tries identities in order and stops at the first match, so a failed decryption that reached the sentinel means the key did not match (not encrypted for this key, or wrong passphrase for a key file). A failure without reaching the sentinel means the file is damaged (malformed ciphertext, or invalid key file). Missing armor, broken armor or an unparsable header is reported as malformed before decrypting.
   - Pasted armored text is accepted with surrounding text, indentation, `>` quoting and re-wrapped lines, as email clients produce them.
   - `crypto.js` returns these categories as error codes; the view maps them to localized messages.

### 6.6 Share link format

```
https://sealback.org/#pubkey=<age recipient>&name=<URL-encoded label>
```

- Parameters are carried in the fragment only, so they never reach the server, its logs, or intermediate proxies.
- `pubkey` is required for link mode. The parameter name makes clear to technical readers that the value is a public, non-secret key.
- `name` is optional, rendered as text only (never as HTML). After decoding, control and formatting characters (including bidirectional overrides) are removed, whitespace is collapsed, and the result is cut to 80 code points.
- Other fragments: `#send`, `#receive`, `#decrypt` (section 6.1).
- `link.js` provides `buildLink(baseUrl, recipient, name)` and `parseFragment(hash)` returning one of `{ mode: "link", recipient, name }`, `{ mode: "link", error }`, `{ mode: "tab", tab: "send" | "receive" | "decrypt" }`.

### 6.7 Key types and normalization

Supported recipient types:

| Type | age name | Recipient prefix | Identity prefix |
|---|---|---|---|
| Standard | X25519 | `age1` (Bech32 HRP `age`) | `AGE-SECRET-KEY-1` |
| Post-quantum | `mlkem768x25519` | `age1pq1` (Bech32 HRP `age1pq`) | `AGE-SECRET-KEY-PQ-1` |

(Prefixes verified against typage 0.3.1 and `age` 1.3.)

- Type detection must use the decoded Bech32 HRP, not a plain string prefix check, since `age1pq1…` also begins with `age1`.
- `keys.js` contains its own small Bech32 decoder. It must not apply Bech32's 90-character length limit, because post-quantum recipients are about 1,950 characters long. Mixed-case input is rejected by Bech32 rules; normalization lowercases first.
- After decoding, the payload length is checked per type (32 bytes for X25519, 1,216 bytes for `mlkem768x25519`).
- Recipient types other than these two are rejected, e.g. `age1tag1…`, plugin recipients such as `age1yubikey1…`, and SSH public keys.
- `keys.js` exports `normalizeRecipientInput(text)`: trims the input, removes all whitespace and line breaks (email clients wrap long strings), extracts the `pubkey` parameter if the input is a Sealback link, lowercases the result, and validates it including the Bech32 checksum. Returns `{ recipient, type }` or `{ error }` with one of: `empty`, `invalid` (not an age public key), `damaged` (checksum or length wrong, e.g. a truncated link), `unsupported` (another key type), `secret-key` (a private key was pasted; the UI warns that it must never be shared).
- `keys.js` exports `detectRecipientType(recipient)` returning `"standard"` or `"pq"`.

### 6.8 Fingerprint ("Security code")

- Input: the normalized recipient string (lowercase).
- Compute SHA-256 over its UTF-8 bytes using the Web Crypto API.
- Take the first 10 bytes (80 bits) of the hash and encode them with Crockford base32 (alphabet `0123456789ABCDEFGHJKMNPQRSTVWXYZ`) as exactly 16 characters, 5 bits per character, most significant bit first. 80 bits divide evenly into 16 characters, so no padding is needed and every character carries the full 5 bits.
- Display in uppercase, grouped as 4-4-4-4 (e.g. `7KQ9 M2XR T8N5 4HCW`). `fingerprint.js` also exports `formatFingerprint(code): string` for the grouping.
- No key stretching is used, to keep the derivation simple and free of parameters. Rationale for the length: substituting the key requires an attacker to find a different valid key whose code matches the victim's code, at a cost of about 2^80 SHA-256 computations (millions of GPU-years), and to do so after seeing the victim's link and before the sender opens it. Since keys are per exchange, nothing can be precomputed.
- Crockford base32 is used because it is compact, case-insensitive and avoids ambiguous characters, which suits reading the code aloud over the phone.
- The same derivation applies to both key types.
- `fingerprint.js` exports `fingerprint(recipient): Promise<string>`.

## 7. Security requirements

- **Content Security Policy** via `<meta http-equiv="Content-Security-Policy">` (GitHub Pages cannot set headers):
  `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; form-action 'none'; base-uri 'none'`
- No inline scripts or inline styles; no `eval`; no `innerHTML` with any user-controlled or URL-derived data.
- `<meta name="referrer" content="no-referrer">`.
- No persistence of keys, passphrases, secrets or ciphertext: no localStorage, sessionStorage, IndexedDB, cookies or service worker.
- Generated object URLs for downloads are revoked immediately after use.
- Secret, passphrase and plaintext fields are cleared after use, on tab switch, and on `pagehide`.
- No `<form>` submissions; all actions via button click handlers.
- Generated keys come exclusively from typage, which uses `crypto.getRandomValues`.
- A test scans `index.html` and `js/` for forbidden constructs (`innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, `localStorage`, `sessionStorage`, `indexedDB`, `document.cookie`, `serviceWorker`, `fetch`, `XMLHttpRequest`, inline `<script>` content, `style=` attributes) to guard against regressions.
- Because `style-src 'self'` forbids style attributes, all elements exist in the static HTML; JavaScript only toggles the `hidden` attribute and CSS classes and sets `textContent`.

## 8. User interface

- Single centered column, max width ~40rem, system font stack, large readable form controls.
- Long values (links, public keys, ciphertext) are shown in read-only fields with `word-break: break-all`, never as running text.
- Light and dark mode via `prefers-color-scheme`.
- Usable on mobile screens.
- Accessible: proper labels for all inputs, visible focus states, sufficient contrast, status and error messages announced via `aria-live`.
- Languages: English and German. Default from `navigator.language`, with a visible language toggle. All strings in `i18n.js`; no strings hard-coded in HTML except as fallback. The `mailto:` texts are localized too.
- Tone of UI text: plain, short, no technical terms in primary text of the send view (no "age", "X25519", "ML-KEM", "public key" except in the manual key input label); such details appear only in the "How does this work?" section.
- **Logo brief:** a seal (the animal) seen from behind, looking into the screen, optionally wearing a hat. Simple flat SVG, recognizable at favicon size (32×32), works in light and dark mode. Implementation may use a simple placeholder; the final logo is designed separately.

## 9. Testing

`node --test` must cover:

- Round trip for both key types: generate identity → encrypt text → armor → dearmor → decrypt, including non-ASCII text.
- Passphrase-protected identity files for both key types: create, then decrypt with correct and incorrect passphrase.
- Decryption with the wrong identity fails with the expected error category, including a standard identity against a post-quantum ciphertext and vice versa.
- Key type detection: standard, post-quantum, other age recipient types rejected, strings that merely begin with `age1` but have a different HRP.
- Normalization: bare key, key with whitespace and line breaks inserted, uppercase key, full Sealback link (with and without `name`), truncated key (checksum error), empty input.
- Fingerprint: known test vectors for both key types, stability, leading zeros preserved (16 characters), grouping. Test vectors are computed independently of `fingerprint.js` (e.g. with `sha256sum` and a short script whose command is recorded in the test file).
- Fragment parsing: `#pubkey=` with and without `name`, invalid or truncated `pubkey`, `#send`, `#receive`, `#decrypt`, empty fragment, unknown fragment, overlong `name`, URL-encoding of special characters.
- Interoperability: fixtures created with the `age` CLI (≥ 1.3.0) for both key types, plain and passphrase-protected key files, armored and binary ciphertext, decrypt in tests; `test/fixtures/README.md` records the commands and `age` version. The README documents how to verify the reverse direction manually.
- i18n: the `en` and `de` tables have identical key sets, and every `data-i18n` key used in `index.html` exists.
- Security scan as described in section 7.
- Tests may lower the scrypt work factor to keep the suite fast; the application always uses typage's default.

## 10. Hosting, CI and release

- GitHub Pages with custom domain `sealback.org` (`CNAME` file in the deployed content), "Enforce HTTPS" enabled.
- Domain verified in the `sealback` organization's GitHub settings to prevent takeover by other accounts. Recommended at the registrar: CAA record and DNSSEC.
- `ci.yml` on every push and pull request: `npm ci --ignore-scripts`, `tsc --noEmit` (checkJs, strict), `node --test`, and regeneration of both files in `third_party/` with a check that they match the committed files byte for byte (`git diff --exit-code third_party/`).
- `deploy.yml`: deploys `index.html`, `CNAME`, `css/`, `js/`, `third_party/age-encryption.js` and `img/` to GitHub Pages when a version tag `v*` is pushed (`actions/upload-pages-artifact`, `actions/deploy-pages`). The workflow computes SHA-256 hashes of all deployed files into `SHA256SUMS` and attaches it to the GitHub release.
- All third-party actions in both workflows are pinned to full commit SHAs.
- Repository settings (documented in README, not enforced by code): branch protection on `main`, required signed commits, 2FA required for all organization members.

## 11. License

- Sealback is licensed under Apache-2.0 (`LICENSE` file, SPDX header `// SPDX-License-Identifier: Apache-2.0` in every source file).
- The bundled file keeps the original license notices of typage and its bundled dependencies; the README lists them under "Third-party licenses".

## 12. README contents

- What Sealback does and does not protect against (summary of section 3), including when to choose post-quantum.
- How to use it as recipient and as sender, including the `#send` fallback when a link is damaged.
- How to decrypt with the `age` CLI instead of the browser (`age -d -i key.age message.age`), with the minimum `age` version that supports post-quantum keys (1.3.0).
- How to verify that the deployed site matches a release (compare published hashes).
- How to update the bundled typage file: bump the exact version in `package.json`, `npm install --ignore-scripts`, run `scripts/update-third-party.sh`, review the diff of `third_party/`, check that the API listed in section 4 is unchanged, and run the tests.
- Comparison with link-based secret tools (e.g. Yopass, PrivateBin): those store ciphertext on a server and put the key in the link; Sealback stores nothing and only the recipient's private key can decrypt.
- Third-party licenses.

## 13. Acceptance criteria

- The page works from a local static server (`python3 -m http.server`) and on `https://sealback.org` without errors in the browser console, including under the CSP.
- The browser's network panel shows no requests other than loading the site's own files.
- Fragment routing behaves as in the table in section 6.1.
- For both key types and both passphrase settings: a secret encrypted in the send view decrypts in the decrypt view and with the `age` CLI; a message encrypted with the `age` CLI to a Sealback key decrypts in the decrypt view.
- A post-quantum link pasted into the manual key input with line breaks inserted is accepted and yields the same fingerprint as the original.
- Both language versions are complete.
- CI passes, including the third-party file reproducibility check.

## 14. Open decisions

- Final logo (see brief in section 8).
