// SPDX-License-Identifier: Apache-2.0

import { test } from "node:test";
import assert from "node:assert/strict";
// Independent Bech32 implementation (a dependency of typage) to build test keys.
import { bech32 } from "@scure/base";
import { decodeBech32, detectRecipientType, normalizeRecipientInput } from "../js/keys.js";
import { fixtureRecipient } from "./helpers.js";

const X25519 = fixtureRecipient("x25519");
const PQ = fixtureRecipient("mlkem768x25519");

/**
 * @param {string} hrp
 * @param {number} length payload length in bytes
 */
function encode(hrp, length) {
  const bytes = new Uint8Array(length).map((_, i) => (i * 7 + 3) & 0xff);
  return bech32.encode(hrp, bech32.toWords(bytes), false);
}

test("fixture keys have the expected shape", () => {
  assert.match(X25519, /^age1[a-z0-9]{58}$/);
  assert.match(PQ, /^age1pq1[a-z0-9]+$/);
  assert.equal(PQ.length, 1959);
});

test("detects X25519 and ML-KEM-768 + X25519 keys", () => {
  assert.equal(detectRecipientType(X25519), "x25519");
  assert.equal(detectRecipientType(PQ), "mlkem768x25519");
  assert.deepEqual(normalizeRecipientInput(X25519), { recipient: X25519, type: "x25519" });
  assert.deepEqual(normalizeRecipientInput(PQ), { recipient: PQ, type: "mlkem768x25519" });
});

test("detection uses the decoded HRP, not the string prefix", () => {
  // An X25519 key whose data part happens to start with "mlkem768x25519" is still X25519.
  const decoded = decodeBech32(X25519);
  assert.equal(decoded?.hrp, "age");
  assert.equal(decodeBech32(PQ)?.hrp, "age1pq");
  // Synthetic keys built independently.
  assert.equal(detectRecipientType(encode("age", 32)), "x25519");
  assert.equal(detectRecipientType(encode("age1pq", 1216)), "mlkem768x25519");
});

test("rejects other age recipient types", () => {
  for (const hrp of ["age1tag", "age1yubikey", "age1se", "age1pqx", "age1foo"]) {
    assert.deepEqual(normalizeRecipientInput(encode(hrp, 33)), { error: "unsupported" }, hrp);
  }
  assert.throws(() => detectRecipientType(encode("age1tag", 33)));
});

test("rejects SSH keys as unsupported", () => {
  assert.deepEqual(
    normalizeRecipientInput("ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl"),
    { error: "unsupported" },
  );
});

test("rejects wrong payload length as damaged", () => {
  assert.deepEqual(normalizeRecipientInput(encode("age", 31)), { error: "damaged" });
  assert.deepEqual(normalizeRecipientInput(encode("age1pq", 1215)), { error: "damaged" });
});

test("rejects private keys with a specific error", () => {
  const identity = "AGE-SECRET-KEY-1QYQSZQGPQYQSZQGPQYQSZQGPQYQSZQGPQYQSZQGPQYQSZQGPQYQS3290GG";
  assert.deepEqual(normalizeRecipientInput(identity), { error: "secret-key" });
  assert.deepEqual(normalizeRecipientInput("AGE-SECRET-KEY-PQ-1ABC"), { error: "secret-key" });
});

test("normalizes whitespace and line breaks", () => {
  const wrapped = PQ.replace(/(.{76})/g, "$1\r\n  ");
  assert.notEqual(wrapped, PQ);
  assert.deepEqual(normalizeRecipientInput(`  ${wrapped}\n`), { recipient: PQ, type: "mlkem768x25519" });
  assert.deepEqual(normalizeRecipientInput(X25519.replace(/(.{10})/g, "$1 \t")), {
    recipient: X25519,
    type: "x25519",
  });
});

test("normalizes uppercase keys", () => {
  assert.deepEqual(normalizeRecipientInput(X25519.toUpperCase()), { recipient: X25519, type: "x25519" });
  assert.deepEqual(normalizeRecipientInput(PQ.toUpperCase()), { recipient: PQ, type: "mlkem768x25519" });
});

test("extracts the key from a Sealback link", () => {
  const expected = { recipient: PQ, type: "mlkem768x25519" };
  assert.deepEqual(normalizeRecipientInput(`https://sealback.org/#pubkey=${PQ}`), expected);
  assert.deepEqual(normalizeRecipientInput(`https://sealback.org/#pubkey=${PQ}&title=Martin%20J.`), expected);
  assert.deepEqual(normalizeRecipientInput(`https://sealback.org/#title=Martin&pubkey=${PQ}`), expected);
  assert.deepEqual(normalizeRecipientInput(`#pubkey=${PQ}`), expected);
  // Wrapped by an email client, and in angle brackets.
  const link = `https://sealback.org/#pubkey=${PQ}&title=Martin`;
  assert.deepEqual(normalizeRecipientInput(`<${link.replace(/(.{70})/g, "$1\n")}>`), expected);
});

test("reports truncated keys as damaged", () => {
  assert.deepEqual(normalizeRecipientInput(X25519.slice(0, -1)), { error: "damaged" });
  assert.deepEqual(normalizeRecipientInput(PQ.slice(0, 1000)), { error: "damaged" });
  assert.deepEqual(normalizeRecipientInput(`https://sealback.org/#pubkey=${PQ.slice(0, 1500)}`), {
    error: "damaged",
  });
  // Single changed character.
  const altered = X25519.slice(0, 20) + (X25519[20] === "q" ? "p" : "q") + X25519.slice(21);
  assert.deepEqual(normalizeRecipientInput(altered), { error: "damaged" });
});

test("reports empty input and non-keys", () => {
  assert.deepEqual(normalizeRecipientInput(""), { error: "empty" });
  assert.deepEqual(normalizeRecipientInput("  \n\t "), { error: "empty" });
  assert.deepEqual(normalizeRecipientInput("hello world"), { error: "invalid" });
  assert.deepEqual(normalizeRecipientInput("https://sealback.org/#send"), { error: "invalid" });
  assert.deepEqual(normalizeRecipientInput("https://sealback.org/#pubkey="), { error: "empty" });
});
