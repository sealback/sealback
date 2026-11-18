// SPDX-License-Identifier: Apache-2.0
//
// Key type detection and public key normalization. No DOM access.
//
// age recipients are Bech32 strings (BIP 173, not Bech32m). Post-quantum
// recipients are about 1,960 characters long, so this decoder deliberately
// does not apply Bech32's 90-character limit.

/** @typedef {"x25519" | "mlkem768x25519"} KeyType */

/**
 * Error codes of normalizeRecipientInput:
 * - "empty": nothing entered
 * - "invalid": not an age public key at all
 * - "damaged": looks like an age public key, but the checksum or length is wrong
 *   (typically a truncated or altered link)
 * - "unsupported": a valid key of a type Sealback does not support
 * - "secret-key": the input is a private key, which must never be shared
 * @typedef {"empty" | "invalid" | "damaged" | "unsupported" | "secret-key"} KeyError
 */

/** @typedef {{ recipient: string, type: KeyType }} NormalizedKey */

const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

/** Bech32 HRP and payload length in bytes per supported key type. */
const TYPES = /** @type {const} */ ([
  { type: "x25519", hrp: "age", length: 32 },
  // ML-KEM-768 encapsulation key (1,184 bytes) followed by X25519 key (32 bytes).
  { type: "mlkem768x25519", hrp: "age1pq", length: 1216 },
]);

/**
 * @param {number[]} values
 * @returns {number}
 */
function polymod(values) {
  let chk = 1;
  for (const v of values) {
    const top = chk >>> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((top >>> i) & 1) chk ^= /** @type {number} */ (GENERATOR[i]);
    }
  }
  return chk >>> 0;
}

/**
 * @param {string} hrp
 * @returns {number[]}
 */
function hrpExpand(hrp) {
  const out = [];
  for (let i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) >> 5);
  out.push(0);
  for (let i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) & 31);
  return out;
}

/**
 * Decodes a lowercase Bech32 string without length limit.
 *
 * Returns null if the string is not syntactically Bech32 (no separator,
 * characters outside the charset), and { hrp, bytes: null } if the syntax is
 * fine but the checksum or padding is wrong.
 *
 * @param {string} s
 * @returns {{ hrp: string, bytes: Uint8Array | null } | null}
 */
export function decodeBech32(s) {
  const pos = s.lastIndexOf("1");
  if (pos < 1 || s.length - pos - 1 < 6) return null;
  const hrp = s.slice(0, pos);
  for (let i = 0; i < hrp.length; i++) {
    const c = hrp.charCodeAt(i);
    if (c < 33 || c > 126) return null;
  }
  /** @type {number[]} */
  const words = [];
  for (const ch of s.slice(pos + 1)) {
    const v = CHARSET.indexOf(ch);
    if (v === -1) return null;
    words.push(v);
  }
  if (polymod([...hrpExpand(hrp), ...words]) !== 1) return { hrp, bytes: null };

  // Convert 5-bit words (without the 6 checksum words) to bytes.
  const data = words.slice(0, -6);
  const bytes = new Uint8Array(Math.floor((data.length * 5) / 8));
  let acc = 0;
  let bits = 0;
  let n = 0;
  for (const w of data) {
    acc = (acc << 5) | w;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes[n++] = (acc >>> bits) & 0xff;
    }
  }
  // At most 4 padding bits, and they must be zero.
  if (bits >= 5 || (acc & ((1 << bits) - 1)) !== 0) return { hrp, bytes: null };
  return { hrp, bytes };
}

/**
 * Validates a normalized (lowercase, no whitespace) recipient string.
 *
 * @param {string} s
 * @returns {NormalizedKey | { error: KeyError }}
 */
function validate(s) {
  if (s === "") return { error: "empty" };
  if (s.startsWith("age-secret-key-")) return { error: "secret-key" };
  if (/^(ssh-|ecdsa-|sk-)/.test(s)) return { error: "unsupported" };
  if (!s.startsWith("age1")) return { error: "invalid" };

  const decoded = decodeBech32(s);
  if (decoded === null) return { error: "damaged" };
  const { hrp, bytes } = decoded;
  if (bytes === null) return { error: "damaged" };
  for (const t of TYPES) {
    if (hrp === t.hrp) {
      if (bytes.length !== t.length) return { error: "damaged" };
      return { recipient: s, type: t.type };
    }
  }
  // Valid Bech32 with another age HRP, e.g. age1tag, age1yubikey (plugins).
  return { error: "unsupported" };
}

/**
 * Extracts the pubkey parameter if the input is a Sealback link (or just its
 * fragment), otherwise returns the input unchanged.
 *
 * @param {string} s whitespace-free input
 * @returns {string}
 */
function extractFromLink(s) {
  const hash = s.indexOf("#");
  const query = hash === -1 ? s : s.slice(hash + 1);
  if (!/(^|&)pubkey=/i.test(query)) return s;
  const params = new URLSearchParams(query);
  for (const [k, v] of params) {
    if (k.toLowerCase() === "pubkey") return v;
  }
  return s;
}

/**
 * Normalizes user input that should contain an age public key: either the bare
 * key or a complete Sealback link. Email clients often wrap long strings, so
 * all whitespace is removed. Bech32 is case-insensitive, so the result is
 * lowercased.
 *
 * @param {string} text
 * @returns {NormalizedKey | { error: KeyError }}
 */
export function normalizeRecipientInput(text) {
  let s = text.replace(/\s+/g, "");
  // Email clients and chat apps sometimes wrap links in angle brackets.
  if (s.startsWith("<") && s.endsWith(">")) s = s.slice(1, -1);
  s = extractFromLink(s).replace(/\s+/g, "").toLowerCase();
  return validate(s);
}

/**
 * Returns the type of a valid, normalized recipient.
 *
 * @param {string} recipient
 * @returns {KeyType}
 * @throws {Error} if the recipient is not a valid supported key
 */
export function detectRecipientType(recipient) {
  const result = validate(recipient);
  if ("error" in result) throw new Error(`invalid recipient: ${result.error}`);
  return result.type;
}
