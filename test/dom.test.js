// SPDX-License-Identifier: Apache-2.0
//
// Every element the views look up with byId("…", HTMLXxxElement) must exist in
// index.html with a matching tag. byId() throws at startup otherwise, which
// breaks the whole page, and the type checker cannot see it.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const root = new URL("../", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");
const js = readdirSync(new URL("js/", root))
  .filter((f) => f.endsWith(".js"))
  .map((f) => ({ name: f, text: readFileSync(new URL(`js/${f}`, root), "utf8") }));

/** Tag names accepted for each element type; HTMLElement accepts any. */
/** @type {Record<string, string[]>} */
const TAGS = {
  HTMLAnchorElement: ["a"],
  HTMLButtonElement: ["button"],
  HTMLDetailsElement: ["details"],
  HTMLDivElement: ["div"],
  HTMLHeadingElement: ["h1", "h2", "h3", "h4", "h5", "h6"],
  HTMLInputElement: ["input"],
  HTMLLabelElement: ["label"],
  HTMLParagraphElement: ["p"],
  HTMLSelectElement: ["select"],
  HTMLSpanElement: ["span"],
  HTMLTextAreaElement: ["textarea"],
};

/** @returns {Map<string, string>} id → tag name */
function idsInHtml() {
  const ids = new Map();
  for (const m of html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*\sid="([^"]+)"/g)) {
    const [, tag, id] = m;
    if (tag && id) {
      assert.ok(!ids.has(id), `duplicate id in index.html: ${id}`);
      ids.set(id, tag);
    }
  }
  return ids;
}

test("every byId() lookup matches an element in index.html", () => {
  const ids = idsInHtml();
  let count = 0;
  for (const { name, text } of js) {
    for (const m of text.matchAll(/byId\(\s*(["`])([^"`]+)\1\s*,\s*(\w+)\s*\)/g)) {
      const [, , id, type] = m;
      if (!id || !type || id.includes("${")) continue; // ids built at runtime, see below
      count++;
      const tag = ids.get(id);
      assert.ok(tag, `${name}: #${id} not found in index.html`);
      if (type !== "HTMLElement") {
        const allowed = TAGS[type];
        assert.ok(allowed, `${name}: unknown element type ${type}`);
        assert.ok(allowed.includes(tag), `${name}: #${id} is <${tag}>, expected ${type}`);
      }
    }
  }
  assert.ok(count > 50, `only ${count} lookups found`);
});

test("ids built at runtime exist", () => {
  const ids = idsInHtml();
  for (const view of ["home", "request", "send", "decrypt"]) {
    assert.equal(ids.get(`panel-${view}`), "section", `panel-${view}`);
  }
  for (const tab of ["request", "decrypt"]) {
    assert.equal(ids.get(`tab-${tab}`), "button", `tab-${tab}`);
  }
});
