// SPDX-License-Identifier: Apache-2.0
//
// Guards the security requirements of the spec (section 7) against
// regressions by scanning the application code for forbidden constructs.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const root = new URL("../", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");
const jsFiles = readdirSync(new URL("js/", root))
  .filter((f) => f.endsWith(".js"))
  .map((f) => ({ name: `js/${f}`, text: readFileSync(new URL(`js/${f}`, root), "utf8") }));
const sources = [{ name: "index.html", text: html }, ...jsFiles];

const FORBIDDEN = [
  /\binnerHTML\b/,
  /\bouterHTML\b/,
  /\binsertAdjacentHTML\b/,
  /\bdocument\.write/,
  /\beval\s*\(/,
  /\bnew\s+Function\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bindexedDB\b/,
  /\bdocument\.cookie\b/,
  /\bserviceWorker\b/,
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\b/,
  /\bsendBeacon\b/,
  /\bEventSource\b/,
];

test("no forbidden APIs in index.html and js/", () => {
  for (const { name, text } of sources) {
    for (const pattern of FORBIDDEN) {
      assert.doesNotMatch(text, pattern, `${name} contains ${pattern}`);
    }
  }
});

test("every source file has an SPDX header", () => {
  for (const { name, text } of sources) {
    assert.match(text, /SPDX-License-Identifier: Apache-2\.0/, name);
  }
});

test("index.html has the required CSP and referrer policy", () => {
  assert.ok(
    html.includes(
      `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; form-action 'none'; base-uri 'none'">`,
    ),
  );
  assert.ok(html.includes(`<meta name="referrer" content="no-referrer">`));
});

test("index.html has no inline scripts, styles, event handlers or forms", () => {
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    assert.match(m[1] ?? "", /\bsrc=/, "script without src");
    assert.equal((m[2] ?? "").trim(), "", "inline script content");
  }
  assert.doesNotMatch(html, /<style\b/);
  assert.doesNotMatch(html, /\sstyle=/);
  assert.doesNotMatch(html, /\son[a-z]+=/);
  assert.doesNotMatch(html, /<form\b/);
  assert.doesNotMatch(html, /javascript:/);
});

test("secret fields disable spellcheck and autocorrection", () => {
  for (const id of ["send-secret", "send-key", "decrypt-input"]) {
    const tag = html.match(new RegExp(`<textarea id="${id}"[^>]*>`))?.[0] ?? "";
    for (const attr of ['autocomplete="off"', 'autocorrect="off"', 'autocapitalize="off"', 'spellcheck="false"']) {
      assert.ok(tag.includes(attr), `${id} lacks ${attr}`);
    }
  }
  for (const id of ["receive-pass", "receive-pass2", "decrypt-pass"]) {
    const tag = html.match(new RegExp(`<input id="${id}"[^>]*>`))?.[0] ?? "";
    assert.ok(tag.includes('type="password"'), id);
    assert.ok(tag.includes('spellcheck="false"'), id);
  }
});

test("only local resources are referenced", () => {
  for (const m of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) {
    const url = m[1] ?? "";
    if (url === "https://github.com/sealback/sealback" || url.startsWith("#") || url === "mailto:") continue;
    assert.doesNotMatch(url, /^[a-z]+:|^\/\//i, `external resource: ${url}`);
  }
});
