// SPDX-License-Identifier: Apache-2.0
//
// Guards the security requirements of the spec (section 7) against
// regressions by scanning the application code for forbidden constructs.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const root = new URL("../", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");
/** Legal pages: static HTML without scripts. */
const LEGAL = ["imprint.html", "privacy.html", "impressum.html", "datenschutz.html"];
const pages = ["index.html", ...LEGAL].map((name) => ({
  name,
  text: readFileSync(new URL(name, root), "utf8"),
}));
const jsFiles = readdirSync(new URL("js/", root))
  .filter((f) => f.endsWith(".js"))
  .map((f) => ({ name: `js/${f}`, text: readFileSync(new URL(`js/${f}`, root), "utf8") }));
const sources = [...pages, ...jsFiles];

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
 * Attributes of every <tag> in a page, independent of formatting
 * (attribute order, line breaks, self-closing slash).
 *
 * @param {string} name tag name
 * @param {string} [page] HTML text, index.html by default
 * @returns {Record<string, string>[]}
 */
function tags(name, page = html) {
  return [...page.matchAll(new RegExp(`<${name}\\b([^>]*)>`, "g"))].map((m) =>
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

const CSP =
  "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; form-action 'none'; base-uri 'none'";

test("every page has the required CSP and referrer policy", () => {
  for (const { name, text } of pages) {
    const meta = tags("meta", text);
    assert.ok(
      meta.some((t) => t["http-equiv"] === "Content-Security-Policy" && t["content"] === CSP),
      name,
    );
    assert.ok(
      meta.some((t) => t["name"] === "referrer" && t["content"] === "no-referrer"),
      name,
    );
  }
});

test("no inline scripts, styles, event handlers or forms", () => {
  for (const { name, text } of pages) {
    for (const m of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      assert.match(m[1] ?? "", /\bsrc=/, `${name}: script without src`);
      assert.equal((m[2] ?? "").trim(), "", `${name}: inline script content`);
    }
    assert.doesNotMatch(text, /<style\b/, name);
    assert.doesNotMatch(text, /\sstyle=/, name);
    assert.doesNotMatch(text, /\son[a-z]+=/, name);
    assert.doesNotMatch(text, /<form\b/, name);
    assert.doesNotMatch(text, /javascript:/, name);
  }
});

test("legal pages contain no scripts", () => {
  for (const { name, text } of pages.filter((p) => LEGAL.includes(p.name))) {
    assert.doesNotMatch(text, /<script\b/, name);
  }
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

test("only local resources are loaded; external links use https", () => {
  for (const { name, text } of pages) {
    for (const m of text.matchAll(/<([a-z]+)\b[^>]*\s(?:src|srcset|href)="([^"]+)"/g)) {
      const [, tag, url = ""] = m;
      if (tag === "a") {
        assert.ok(!/^[a-z]+:/i.test(url) || /^https:\/\/|^mailto:$/.test(url), `${name}: ${url}`);
        continue;
      }
      assert.doesNotMatch(url, /^[a-z]+:|^\/\//i, `${name}: external resource: ${url}`);
    }
  }
});

test("links to local pages point to existing files", () => {
  for (const { name, text } of pages) {
    for (const m of text.matchAll(/\shref="([^"#:]+\.html)"/g)) {
      const target = m[1] ?? "";
      assert.ok(LEGAL.includes(target) || target === "index.html", `${name}: ${target}`);
    }
  }
});
