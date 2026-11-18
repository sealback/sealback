// SPDX-License-Identifier: Apache-2.0

import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_NAME_LENGTH, buildLink, cleanName, parseFragment } from "../js/link.js";
import { fixtureRecipient } from "./helpers.js";

const X25519 = fixtureRecipient("x25519");
const PQ = fixtureRecipient("mlkem768x25519");
const BASE = "https://sealback.org/";

test("buildLink without and with name", () => {
  assert.equal(buildLink(BASE, X25519), `${BASE}#pubkey=${X25519}`);
  assert.equal(buildLink(BASE, X25519, ""), `${BASE}#pubkey=${X25519}`);
  assert.equal(buildLink(BASE, X25519, "  "), `${BASE}#pubkey=${X25519}`);
  assert.equal(buildLink(BASE, X25519, "Martin"), `${BASE}#pubkey=${X25519}&name=Martin`);
  assert.equal(buildLink(`${BASE}#receive`, X25519, null), `${BASE}#pubkey=${X25519}`);
});

test("buildLink URL-encodes special characters and round-trips", () => {
  const name = "Jürgen & Co. #1 <b>50%</b> +x=y";
  const link = buildLink(BASE, PQ, name);
  assert.ok(!link.slice(link.indexOf("#") + 1).includes("#"));
  assert.ok(link.includes("&name=J%C3%BCrgen%20%26%20Co.%20%231%20%3Cb%3E50%25%3C%2Fb%3E%20%2Bx%3Dy"));
  const hash = link.slice(link.indexOf("#"));
  assert.deepEqual(parseFragment(hash), { mode: "link", recipient: PQ, type: "mlkem768x25519", name });
});

test("parses #pubkey= without name", () => {
  assert.deepEqual(parseFragment(`#pubkey=${X25519}`), {
    mode: "link",
    recipient: X25519,
    type: "x25519",
    name: null,
  });
});

test("parses #pubkey= with name", () => {
  assert.deepEqual(parseFragment(`#pubkey=${PQ}&name=Martin%20J%C3%A4ger`), {
    mode: "link",
    recipient: PQ,
    type: "mlkem768x25519",
    name: "Martin Jäger",
  });
  assert.deepEqual(parseFragment(`#name=Anna&pubkey=${X25519}`), {
    mode: "link",
    recipient: X25519,
    type: "x25519",
    name: "Anna",
  });
  // Empty name is treated as absent.
  assert.equal(/** @type {any} */ (parseFragment(`#pubkey=${X25519}&name=`)).name, null);
});

test("invalid or truncated pubkey gives a link-mode error", () => {
  assert.deepEqual(parseFragment(`#pubkey=${PQ.slice(0, 1800)}`), { mode: "link", error: "damaged" });
  assert.deepEqual(parseFragment(`#pubkey=${X25519.slice(0, -3)}&name=X`), { mode: "link", error: "damaged" });
  assert.deepEqual(parseFragment("#pubkey="), { mode: "link", error: "empty" });
  assert.deepEqual(parseFragment("#pubkey=hello"), { mode: "link", error: "invalid" });
});

test("view fragments", () => {
  assert.deepEqual(parseFragment("#send"), { mode: "view", view: "send" });
  assert.deepEqual(parseFragment("#receive"), { mode: "view", view: "receive" });
  assert.deepEqual(parseFragment("#decrypt"), { mode: "view", view: "decrypt" });
  assert.deepEqual(parseFragment("decrypt"), { mode: "view", view: "decrypt" });
});

test("empty and unknown fragments open the receive view", () => {
  for (const hash of ["", "#", "#foo", "#Send", "#send&x=1", "#name=Martin", "#%%%"]) {
    assert.deepEqual(parseFragment(hash), { mode: "view", view: "receive" }, hash);
  }
});

test("overlong name is cut to 80 characters", () => {
  const long = "ä".repeat(100);
  const route = /** @type {any} */ (parseFragment(`#pubkey=${X25519}&name=${encodeURIComponent(long)}`));
  assert.equal(route.name, "ä".repeat(MAX_NAME_LENGTH));
  // Counted in code points, so emoji are not split.
  assert.equal(cleanName("🦭".repeat(90)), "🦭".repeat(80));
});

test("name is cleaned of control and bidi characters", () => {
  assert.equal(cleanName("Mar‮tin\u0000\n  X"), "Martin X");
  assert.equal(cleanName("  a \t b  "), "a b");
});
