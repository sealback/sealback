// SPDX-License-Identifier: Apache-2.0
//
// Pure functions wrapping typage (age-encryption). No DOM access.

import {
  Decrypter,
  Encrypter,
  armor,
  generateHybridIdentity,
  generateX25519Identity,
  identityToRecipient,
} from "../third_party/age-encryption.js";

/** @typedef {import("./keys.js").KeyType} KeyType */
/** @typedef {import("../third_party/age-encryption.js").Identity} Identity */

/**
 * Error codes for key files and decryption:
 * - "invalid-key-file": not a Sealback/age key file
 * - "wrong-passphrase": passphrase-protected key file, wrong passphrase
 * - "wrong-key": the ciphertext was not encrypted for this key
 * - "malformed": the ciphertext is damaged or not an age file
 * @typedef {"invalid-key-file" | "wrong-passphrase" | "wrong-key" | "malformed"} CryptoError
 */

/** @typedef {{ identity: string, recipient: string, type: KeyType }} KeyPair */

const AGE_VERSION_LINE = "age-encryption.org/v1";
const ARMOR_BEGIN = "-----BEGIN AGE ENCRYPTED FILE-----";
const ARMOR_END = "-----END AGE ENCRYPTED FILE-----";
const IDENTITY_LINE = /^AGE-SECRET-KEY-(PQ-)?1[0-9A-Z]+$/;

const encoder = new TextEncoder();

/**
 * Generates a new key pair of the given type.
 *
 * @param {KeyType} type
 * @returns {Promise<KeyPair>}
 */
export async function generateKey(type) {
  const identity = type === "mlkem768x25519" ? await generateHybridIdentity() : await generateX25519Identity();
  const recipient = await identityToRecipient(identity);
  return { identity, recipient, type };
}

/**
 * The recipient (public key) of an identity.
 *
 * @param {string} identity
 * @returns {Promise<string>}
 */
export async function recipientOf(identity) {
  return await identityToRecipient(identity);
}

/**
 * The plaintext content of a key file, in the format written by age-keygen.
 *
 * @param {KeyPair} key
 * @param {Date} [created]
 * @returns {string}
 */
export function keyFileContent(key, created = new Date()) {
  const timestamp = created.toISOString().replace(/\.\d{3}Z$/, "Z");
  return `# created: ${timestamp}\n# public key: ${key.recipient}\n${key.identity}\n`;
}

/**
 * Produces the key file: the plain key file content, or, if a passphrase is
 * given, that content encrypted with age's scrypt passphrase mode (binary
 * age format, decryptable with `age -d -i <file>`).
 *
 * @param {KeyPair} key
 * @param {string | null} passphrase
 * @param {{ created?: Date, scryptWorkFactor?: number }} [options]
 *   scryptWorkFactor is for tests only; the application uses typage's default.
 * @returns {Promise<Uint8Array>}
 */
export async function createKeyFile(key, passphrase, options = {}) {
  const content = keyFileContent(key, options.created);
  if (passphrase === null) return encoder.encode(content);
  const e = new Encrypter();
  e.setPassphrase(passphrase);
  if (options.scryptWorkFactor !== undefined) e.setScryptWorkFactor(options.scryptWorkFactor);
  return await e.encrypt(content);
}

/**
 * Encrypts UTF-8 text to a recipient.
 *
 * @param {string} recipient normalized recipient
 * @param {string} text
 * @returns {Promise<{ armored: string, binary: Uint8Array }>}
 */
export async function encryptText(recipient, text) {
  const e = new Encrypter();
  e.addRecipient(recipient);
  const binary = await e.encrypt(text);
  return { armored: armor.encode(binary), binary };
}

/**
 * @param {Uint8Array} bytes
 * @returns {boolean}
 */
function isBinaryAge(bytes) {
  const prefix = encoder.encode(AGE_VERSION_LINE + "\n");
  if (bytes.length < prefix.length) return false;
  return prefix.every((b, i) => bytes[i] === b);
}

/**
 * Converts user input (pasted armored text, or the bytes of a binary or
 * armored .age file) into binary age data. Tolerates what email clients do to
 * armored text: surrounding text, indentation, quoting with ">", and
 * re-wrapped lines.
 *
 * @param {string | Uint8Array} input
 * @returns {Uint8Array | null} null if no age data was found
 */
export function toAgeBytes(input) {
  if (input instanceof Uint8Array) {
    if (isBinaryAge(input)) return input;
    input = new TextDecoder().decode(input);
  }
  const begin = input.indexOf(ARMOR_BEGIN);
  if (begin === -1) return null;
  const end = input.indexOf(ARMOR_END, begin + ARMOR_BEGIN.length);
  if (end === -1) return null;
  const body = input
    .slice(begin + ARMOR_BEGIN.length, end)
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s>]+/, "").replace(/\s+$/, ""))
    .join("");
  if (body === "") return null;
  const lines = body.match(/.{1,64}/g) ?? [];
  try {
    return armor.decode(`${ARMOR_BEGIN}\n${lines.join("\n")}\n${ARMOR_END}\n`);
  } catch {
    return null;
  }
}

/**
 * Returns the stanza types (first argument of each "-> " line) of an age
 * header, or null if the header cannot be parsed.
 *
 * @param {Uint8Array} bytes binary age file
 * @returns {string[] | null}
 */
export function stanzaTypes(bytes) {
  const lines = new TextDecoder("latin1").decode(bytes.subarray(0, 64 * 1024)).split("\n");
  if (lines[0] !== AGE_VERSION_LINE) return null;
  /** @type {string[]} */
  const types = [];
  for (const line of lines.slice(1)) {
    if (line.startsWith("--- ")) return types;
    if (line.startsWith("-> ")) {
      const type = line.slice(3).split(" ")[0];
      if (!type) return null;
      types.push(type);
    }
  }
  return null;
}

/**
 * Parses the plaintext content of a key file.
 *
 * @param {string} text
 * @returns {Promise<{ identity: string, type: KeyType } | null>}
 */
async function parsePlainKeyFile(text) {
  const lines = text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("#"));
  if (lines.length !== 1) return null;
  const identity = /** @type {string} */ (lines[0]);
  if (!IDENTITY_LINE.test(identity)) return null;
  try {
    await identityToRecipient(identity); // validates checksum and length
  } catch {
    return null;
  }
  return { identity, type: identity.startsWith("AGE-SECRET-KEY-PQ-1") ? "mlkem768x25519" : "x25519" };
}

/**
 * Reads a key file and determines whether it is plain or passphrase-protected.
 *
 * @param {Uint8Array} bytes
 * @returns {Promise<{ kind: "plain", identity: string, type: KeyType }
 *   | { kind: "protected" }
 *   | { error: CryptoError }>}
 */
export async function readKeyFile(bytes) {
  const age = toAgeBytes(bytes);
  if (age !== null) {
    const types = stanzaTypes(age);
    if (types !== null && types.length === 1 && types[0] === "scrypt") return { kind: "protected" };
    return { error: "invalid-key-file" };
  }
  const plain = await parsePlainKeyFile(new TextDecoder().decode(bytes));
  if (plain === null) return { error: "invalid-key-file" };
  return { kind: "plain", ...plain };
}

/**
 * An identity that never matches, added after the real identity or
 * passphrase. typage tries identities in order and stops at the first one
 * that unwraps the file key, so if the sentinel is called, the real one did
 * not match (wrong key or wrong passphrase). If decryption fails without the
 * sentinel being called, the file itself is damaged. This avoids classifying
 * typage's errors by their message text.
 *
 * @returns {{ identity: Identity, wasCalled: () => boolean }}
 */
function sentinel() {
  let called = false;
  return {
    identity: {
      unwrapFileKey() {
        called = true;
        return null;
      },
    },
    wasCalled: () => called,
  };
}

/**
 * Decrypts a passphrase-protected key file.
 *
 * @param {Uint8Array} bytes
 * @param {string} passphrase
 * @returns {Promise<{ identity: string, type: KeyType } | { error: CryptoError }>}
 */
export async function unlockKeyFile(bytes, passphrase) {
  const age = toAgeBytes(bytes);
  if (age === null) return { error: "invalid-key-file" };
  const d = new Decrypter();
  d.addPassphrase(passphrase);
  const s = sentinel();
  d.addIdentity(s.identity);
  let text;
  try {
    text = await d.decrypt(age, "text");
  } catch {
    return { error: s.wasCalled() ? "wrong-passphrase" : "invalid-key-file" };
  }
  const plain = await parsePlainKeyFile(text);
  return plain ?? { error: "invalid-key-file" };
}

/**
 * Decrypts age ciphertext (armored text or binary) to UTF-8 text.
 *
 * @param {string} identity
 * @param {string | Uint8Array} input
 * @returns {Promise<{ text: string } | { error: CryptoError }>}
 */
export async function decryptText(identity, input) {
  const age = toAgeBytes(input);
  if (age === null || stanzaTypes(age) === null) return { error: "malformed" };
  const d = new Decrypter();
  d.addIdentity(identity);
  const s = sentinel();
  d.addIdentity(s.identity);
  try {
    return { text: await d.decrypt(age, "text") };
  } catch {
    return { error: s.wasCalled() ? "wrong-key" : "malformed" };
  }
}
