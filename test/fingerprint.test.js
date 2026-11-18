// SPDX-License-Identifier: Apache-2.0

import { test } from "node:test";
import assert from "node:assert/strict";
import { fingerprint, formatFingerprint } from "../js/fingerprint.js";
import { fixtureRecipient } from "./helpers.js";

// Test vectors computed independently with Python:
//
//   import hashlib
//   A = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
//   def fp(s):
//       n = int.from_bytes(hashlib.sha256(s.encode()).digest()[:10], "big")
//       return "".join(A[(n >> (75 - 5 * i)) & 31] for i in range(16))
const VECTORS = {
  x25519: "63PE7JM1BY1ASMNM",
  mlkem768x25519: "PFHM7TCPM85R7GHD",
};

test("known vectors for both key types", async () => {
  assert.equal(await fingerprint(fixtureRecipient("x25519")), VECTORS.x25519);
  assert.equal(await fingerprint(fixtureRecipient("mlkem768x25519")), VECTORS.mlkem768x25519);
});

test("is stable and 16 Crockford base32 characters", async () => {
  const r = fixtureRecipient("mlkem768x25519");
  const a = await fingerprint(r);
  assert.equal(await fingerprint(r), a);
  assert.match(a, /^[0-9A-HJKMNP-TV-Z]{16}$/);
});

test("keeps leading zeros", async () => {
  // fp("zero-991") starts with two zero characters (first 10 bits zero).
  assert.equal(await fingerprint("zero-991"), "00JP1XRH1ZANZNVP");
});

test("different keys give different codes", async () => {
  assert.notEqual(await fingerprint(fixtureRecipient("x25519")), await fingerprint(fixtureRecipient("mlkem768x25519")));
});

test("groups as 4-4-4-4", () => {
  assert.equal(formatFingerprint("63PE7JM1BY1ASMNM"), "63PE 7JM1 BY1A SMNM");
  assert.equal(formatFingerprint("00jp1xrh1zanznvp"), "00JP 1XRH 1ZAN ZNVP");
});
