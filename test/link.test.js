// SPDX-License-Identifier: Apache-2.0

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLink, parseFragment } from "../js/link.js";
import { fixtureRecipient } from "./helpers.js";

const X25519 = fixtureRecipient("x25519");
const PQ = fixtureRecipient("mlkem768x25519");
const BASE = "https://sealback.org/";

test("buildLink", () => {
  assert.equal(buildLink(BASE, X25519), `${BASE}#pubkey=${X25519}`);
  assert.equal(buildLink(`${BASE}#request`, PQ), `${BASE}#pubkey=${PQ}`);
});

test("buildLink round-trips through parseFragment", () => {
  for (const [recipient, type] of /** @type {const} */ ([[X25519, "x25519"], [PQ, "mlkem768x25519"]])) {
    const link = buildLink(BASE, recipient);
    assert.deepEqual(parseFragment(link.slice(link.indexOf("#"))), { mode: "link", recipient, type });
  }
});

test("parses #pubkey=", () => {
  assert.deepEqual(parseFragment(`#pubkey=${X25519}`), { mode: "link", recipient: X25519, type: "x25519" });
  assert.deepEqual(parseFragment(`pubkey=${PQ}`), { mode: "link", recipient: PQ, type: "mlkem768x25519" });
});

test("other parameters are ignored", () => {
  for (const hash of [`#pubkey=${X25519}&title=Martin`, `#name=Anna&pubkey=${X25519}`, `#pubkey=${X25519}&x=%3Cb%3E`]) {
    assert.deepEqual(parseFragment(hash), { mode: "link", recipient: X25519, type: "x25519" }, hash);
  }
});

test("URL-encoded and wrapped keys in the fragment are accepted", () => {
  const encoded = encodeURIComponent(X25519.toUpperCase());
  assert.deepEqual(parseFragment(`#pubkey=${encoded}`), { mode: "link", recipient: X25519, type: "x25519" });
  assert.deepEqual(parseFragment(`#pubkey=${PQ.replace(/(.{80})/g, "$1%0A")}`), {
    mode: "link",
    recipient: PQ,
    type: "mlkem768x25519",
  });
});

test("invalid or truncated pubkey gives a link-mode error", () => {
  assert.deepEqual(parseFragment(`#pubkey=${PQ.slice(0, 1800)}`), { mode: "link", error: "damaged" });
  assert.deepEqual(parseFragment(`#pubkey=${X25519.slice(0, -3)}`), { mode: "link", error: "damaged" });
  assert.deepEqual(parseFragment("#pubkey="), { mode: "link", error: "empty" });
  assert.deepEqual(parseFragment("#pubkey=hello"), { mode: "link", error: "invalid" });
});

test("view fragments", () => {
  assert.deepEqual(parseFragment("#send"), { mode: "view", view: "send" });
  assert.deepEqual(parseFragment("#request"), { mode: "view", view: "request" });
  assert.deepEqual(parseFragment("#decrypt"), { mode: "view", view: "decrypt" });
  assert.deepEqual(parseFragment("decrypt"), { mode: "view", view: "decrypt" });
});

test("empty and unknown fragments open the request view", () => {
  for (const hash of ["", "#", "#foo", "#Send", "#send&x=1", "#title=Martin", "#receive", "#%%%"]) {
    assert.deepEqual(parseFragment(hash), { mode: "view", view: "request" }, hash);
  }
});
