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

/**
 * Attributes of every <tag> in index.html, independent of formatting
 * (attribute order, line breaks, self-closing slash).
 *
 * @param {string} name tag name
 * @returns {Record<string, string>[]}
 */
function tags(name) {
  return [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, "g"))].map((m) =>
    Object.fromEntries(
      [...(m[1] ?? "").matchAll(/([a-z-]+)(?:="([^"]*)")?/g)].map((a) => [a[1], a[2] ?? ""]),
    ),
  );
}

/**
 * @param {string} name tag name
 * @param {string} id
 */
function tagById(name, id) {
  const tag = tags(name).find((t) => t["id"] === id);
  assert.ok(tag, `<${name} id="${id}"> not found`);
  return tag;
}

test("index.html has the required CSP and referrer policy", () => {
  const meta = tags("meta");
  assert.ok(
    meta.some(
      (t) =>
        t["http-equiv"] === "Content-Security-Policy" &&
        t["content"] ===
          "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; form-action 'none'; base-uri 'none'",
    ),
  );
  assert.ok(meta.some((t) => t["name"] === "referrer" && t["content"] === "no-referrer"));
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
    const tag = tagById("textarea", id);
    assert.equal(tag["autocomplete"], "off", id);
    assert.equal(tag["autocorrect"], "off", id);
    assert.equal(tag["autocapitalize"], "off", id);
    assert.equal(tag["spellcheck"], "false", id);
  }
  for (const id of ["request-pass", "request-pass2", "decrypt-pass", "request-existing-pass"]) {
    const tag = tagById("input", id);
    assert.equal(tag["type"], "password", id);
    assert.equal(tag["spellcheck"], "false", id);
  }
});

test("only local resources are referenced", () => {
  for (const m of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) {
    const url = m[1] ?? "";
    if (url === "https://github.com/sealback/sealback" || url.startsWith("#") || url === "mailto:")
      continue;
    assert.doesNotMatch(url, /^[a-z]+:|^\/\//i, `external resource: ${url}`);
  }
});
