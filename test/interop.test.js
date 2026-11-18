// SPDX-License-Identifier: Apache-2.0
//
// Interoperability with the age CLI: the fixtures in test/fixtures/ were
// created with age (see test/fixtures/README.md) and must decrypt here.

import { test } from "node:test";
import assert from "node:assert/strict";
import { decryptText, readKeyFile, unlockKeyFile } from "../js/crypto.js";
import { fixtureBytes, fixtureText } from "./helpers.js";

const PLAINTEXT = fixtureText("plaintext.txt");
const PASSPHRASE = "correct horse battery staple";

for (const type of /** @type {const} */ (["x25519", "mlkem768x25519"])) {
  test(`${type}: plain key file from age-keygen decrypts age CLI messages`, async () => {
    const key = await readKeyFile(fixtureBytes(`${type}-key.txt`));
    assert.ok("kind" in key && key.kind === "plain");
    assert.equal(key.type, type);
    for (const name of [`${type}-message.age`, `${type}-message.armored.age`]) {
      assert.deepEqual(await decryptText(key.identity, fixtureBytes(name)), { text: PLAINTEXT }, name);
    }
    assert.deepEqual(await decryptText(key.identity, fixtureText(`${type}-message.armored.age`)), {
      text: PLAINTEXT,
    });
  });

  // Uses age's default scrypt work factor (18), so this takes a moment.
  test(`${type}: passphrase-protected key file from age -p`, async () => {
    const file = fixtureBytes(`${type}-key.protected.age`);
    assert.deepEqual(await readKeyFile(file), { kind: "protected" });
    const plain = await readKeyFile(fixtureBytes(`${type}-key.txt`));
    assert.ok("kind" in plain && plain.kind === "plain");
    assert.deepEqual(await unlockKeyFile(file, PASSPHRASE), { identity: plain.identity, type });
  });
}
