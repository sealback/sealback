// SPDX-License-Identifier: Apache-2.0

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createKeyFile,
  decryptText,
  encryptText,
  generateKey,
  keyFileContent,
  readKeyFile,
  stanzaTypes,
  toAgeBytes,
  unlockKeyFile,
} from "../js/crypto.js";
import { detectRecipientType } from "../js/keys.js";

// Low scrypt work factor to keep the tests fast; the app uses typage's default.
const FAST = { scryptWorkFactor: 10 };
const TEXT = "Grüße aus Hamburg! 🦭\nP@ssw0rd: «ñ» 日本語\n";

/** @type {Record<"standard" | "pq", import("../js/crypto.js").KeyPair>} */
const keys = {
  standard: await generateKey("standard"),
  pq: await generateKey("pq"),
};

/**
 * @template T
 * @param {T | { error: string }} result
 * @returns {T}
 */
function ok(result) {
  if (result && typeof result === "object" && "error" in result) {
    assert.fail(`unexpected error: ${result.error}`);
  }
  return /** @type {T} */ (result);
}

for (const type of /** @type {const} */ (["standard", "pq"])) {
  test(`${type}: generated key has the right format`, () => {
    const k = keys[type];
    assert.equal(k.type, type);
    assert.equal(detectRecipientType(k.recipient), type);
    assert.match(k.identity, type === "pq" ? /^AGE-SECRET-KEY-PQ-1/ : /^AGE-SECRET-KEY-1/);
  });

  test(`${type}: round trip encrypt → armor → dearmor → decrypt`, async () => {
    const k = keys[type];
    const { armored, binary } = await encryptText(k.recipient, TEXT);
    assert.match(armored, /^-----BEGIN AGE ENCRYPTED FILE-----\n/);
    assert.match(armored, /\n-----END AGE ENCRYPTED FILE-----\n$/);
    assert.deepEqual(toAgeBytes(armored), binary);
    assert.deepEqual(stanzaTypes(binary), [type === "pq" ? "mlkem768x25519" : "X25519"]);
    assert.equal(ok(await decryptText(k.identity, armored)).text, TEXT);
    assert.equal(ok(await decryptText(k.identity, binary)).text, TEXT);
  });

  test(`${type}: plain key file`, async () => {
    const k = keys[type];
    const created = new Date("2026-11-18T14:02:48.123Z");
    const file = await createKeyFile(k, null, { created });
    const text = new TextDecoder().decode(file);
    assert.equal(text, keyFileContent(k, created));
    assert.equal(text, `# created: 2026-11-18T14:02:48Z\n# public key: ${k.recipient}\n${k.identity}\n`);
    assert.deepEqual(await readKeyFile(file), { kind: "plain", identity: k.identity, type });
  });

  test(`${type}: passphrase-protected key file, correct and wrong passphrase`, async () => {
    const k = keys[type];
    const file = await createKeyFile(k, "correct horse battery staple", FAST);
    assert.deepEqual(stanzaTypes(file), ["scrypt"]);
    assert.deepEqual(await readKeyFile(file), { kind: "protected" });
    assert.deepEqual(await unlockKeyFile(file, "correct horse battery staple"), { identity: k.identity, type });
    assert.deepEqual(await unlockKeyFile(file, "wrong horse battery staple"), { error: "wrong-passphrase" });
    assert.deepEqual(await unlockKeyFile(file, ""), { error: "wrong-passphrase" });
  });
}

test("wrong identity: same type", async () => {
  for (const type of /** @type {const} */ (["standard", "pq"])) {
    const other = await generateKey(type);
    const { armored } = await encryptText(keys[type].recipient, TEXT);
    assert.deepEqual(await decryptText(other.identity, armored), { error: "wrong-key" });
  }
});

test("wrong identity: standard identity against post-quantum ciphertext and vice versa", async () => {
  const toPq = await encryptText(keys.pq.recipient, TEXT);
  const toStandard = await encryptText(keys.standard.recipient, TEXT);
  assert.deepEqual(await decryptText(keys.standard.identity, toPq.armored), { error: "wrong-key" });
  assert.deepEqual(await decryptText(keys.pq.identity, toStandard.armored), { error: "wrong-key" });
});

test("passphrase-encrypted message counts as not for this key", async () => {
  const file = await createKeyFile(keys.standard, "some passphrase", FAST);
  assert.deepEqual(await decryptText(keys.standard.identity, file), { error: "wrong-key" });
});

test("malformed ciphertext", async () => {
  const k = keys.standard;
  const { armored, binary } = await encryptText(k.recipient, TEXT);
  const cases = [
    "",
    "hello",
    "-----BEGIN AGE ENCRYPTED FILE-----\n-----END AGE ENCRYPTED FILE-----\n",
    "-----BEGIN AGE ENCRYPTED FILE-----\n!!!!\n-----END AGE ENCRYPTED FILE-----\n",
    armored.replace("-----END AGE ENCRYPTED FILE-----\n", ""),
    armored.slice(0, 120) + "\n-----END AGE ENCRYPTED FILE-----\n",
    new TextEncoder().encode("age-encryption.org/v1\ngarbage"),
    binary.subarray(0, binary.length - 10),
  ];
  for (const input of cases) {
    assert.deepEqual(await decryptText(k.identity, input), { error: "malformed" }, String(input).slice(0, 40));
  }
  // Payload modified: the key matches, but the content is damaged.
  const flipped = binary.slice();
  flipped[flipped.length - 3] ^= 1;
  assert.deepEqual(await decryptText(k.identity, flipped), { error: "malformed" });
});

test("armored text survives what email clients do to it", async () => {
  const k = keys.pq;
  const { armored } = await encryptText(k.recipient, TEXT);
  const quoted = armored.split("\n").map((l) => `> ${l}  `).join("\r\n");
  const rewrapped = armored.replace(/\n(?!-----END)/g, (m, offset) => (offset % 3 === 0 ? "" : m));
  const indented = armored.split("\n").map((l) => `    ${l}`).join("\n");
  const surrounded = `Hi,\n\nhere it is:\n\n${armored}\nBest,\nAnna`;
  for (const input of [quoted, rewrapped, indented, surrounded]) {
    assert.equal(ok(await decryptText(k.identity, input)).text, TEXT);
  }
});

test("invalid key files", async () => {
  const enc = new TextEncoder();
  const k = keys.standard;
  const cases = [
    "",
    "hello",
    `# public key: ${k.recipient}\n`,
    `${k.identity}\n${keys.pq.identity}\n`, // more than one identity
    k.identity.slice(0, -1), // checksum error
    k.recipient,
  ];
  for (const text of cases) {
    assert.deepEqual(await readKeyFile(enc.encode(text)), { error: "invalid-key-file" }, text.slice(0, 40));
  }
  // An age file that is not passphrase-encrypted is not a key file.
  const { binary } = await encryptText(k.recipient, k.identity);
  assert.deepEqual(await readKeyFile(binary), { error: "invalid-key-file" });
  // A passphrase-protected file whose content is not a key.
  const e = await createKeyFile({ ...k, identity: "not a key" }, "pw", FAST);
  assert.deepEqual(await unlockKeyFile(e, "pw"), { error: "invalid-key-file" });
});

test("key file with CRLF, BOM and extra comments", async () => {
  const k = keys.pq;
  const text = `﻿# created: x\r\n# public key: ${k.recipient}\r\n\r\n  ${k.identity}  \r\n# trailing\r\n`;
  assert.deepEqual(await readKeyFile(new TextEncoder().encode(text)), {
    kind: "plain",
    identity: k.identity,
    type: "pq",
  });
});
