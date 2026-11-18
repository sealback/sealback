// SPDX-License-Identifier: Apache-2.0

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { LANGS, STRINGS, detectLanguage, setLanguage, t } from "../js/i18n.js";

const root = new URL("../", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");
const js = readdirSync(new URL("js/", root))
  .filter((f) => f.endsWith(".js"))
  .map((f) => readFileSync(new URL(`js/${f}`, root), "utf8"))
  .join("\n");

/** @param {string} s */
const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test("all languages have the same keys", () => {
  const keys = Object.keys(STRINGS.en).sort();
  for (const lang of LANGS) {
    assert.deepEqual(Object.keys(STRINGS[lang]).sort(), keys, lang);
  }
});

test("no empty strings, same placeholders in all languages", () => {
  for (const [key, text] of Object.entries(STRINGS.en)) {
    for (const lang of LANGS) {
      const translated = STRINGS[lang][key] ?? "";
      assert.notEqual(translated.trim(), "", `${lang}: ${key}`);
      assert.deepEqual(placeholders(translated), placeholders(text), `${lang}: ${key}`);
    }
  }
});

test("every key used in index.html exists", () => {
  const used = [
    ...[...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/data-i18n-attr="([^"]+)"/g)].flatMap((m) =>
      (m[1] ?? "").split(",").map((pair) => pair.split(":")[1]),
    ),
  ];
  assert.ok(used.length > 50);
  for (const key of used) assert.ok(key && key in STRINGS.en, `missing key: ${key}`);
});

test("every literal key used in js/ exists", () => {
  // Every string literal that looks like a translation key, in any call.
  const used = [...js.matchAll(/"((?:app|lang|tabs|tab|footer|receive|send|decrypt|common|error)\.[\w.-]+)"/g)]
    .map((m) => m[1])
    // Prefixes completed at runtime, e.g. `error.key.${code}`, are tested below.
    .filter((key) => !key?.endsWith("."));
  assert.ok(used.length > 20);
  for (const key of used) assert.ok(key && key in STRINGS.en, `missing key: ${key}`);
});

test("keys built from error codes exist", () => {
  for (const code of ["empty", "invalid", "damaged", "unsupported", "secret-key"]) {
    assert.ok(`error.key.${code}` in STRINGS.en, code);
  }
  for (const code of ["invalid-key-file", "wrong-passphrase", "wrong-key", "malformed"]) {
    assert.ok(`error.crypto.${code}` in STRINGS.en, code);
  }
  for (const type of ["pq", "standard"]) assert.ok(`send.protection.${type}` in STRINGS.en, type);
});

test("language detection", () => {
  assert.equal(detectLanguage(["de-DE", "en-US"]), "de");
  assert.equal(detectLanguage(["fr-FR", "de-AT"]), "de");
  assert.equal(detectLanguage(["en-GB", "de"]), "en");
  assert.equal(detectLanguage(["fr", "es"]), "en");
  assert.equal(detectLanguage([]), "en");
});

test("translation with placeholders", () => {
  setLanguage("de");
  assert.equal(t("receive.done.file", { file: "x.age" }), "Dateiname: x.age");
  setLanguage("en");
  assert.equal(t("receive.done.file", { file: "x.age" }), "File name: x.age");
  assert.equal(t("no.such.key"), "no.such.key");
});
