// SPDX-License-Identifier: Apache-2.0
//
// Key fingerprint derivation. No DOM access.
//
// SHA-256 over the UTF-8 bytes of the normalized (lowercase) recipient; the
// first 80 bits are encoded as 16 characters of Crockford base32.

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * @param {string} recipient normalized recipient string
 * @returns {Promise<string>} 16 uppercase Crockford base32 characters
 */
export async function fingerprint(recipient) {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(recipient)),
  );
  let out = "";
  let acc = 0;
  let bits = 0;
  for (const byte of digest.subarray(0, 10)) {
    acc = ((acc << 8) | byte) & 0xfff;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += CROCKFORD[(acc >>> bits) & 31];
    }
  }
  return out;
}

/**
 * Groups a fingerprint in blocks of four: "7KQ9 M2XR T8N5 4HCW" for display,
 * or with "-" for file names: "7KQ9-M2XR-T8N5-4HCW".
 *
 * @param {string} code
 * @param {string} [separator]
 * @returns {string}
 */
export function formatFingerprint(code, separator = " ") {
  return code.toUpperCase().match(/.{1,4}/g)?.join(separator) ?? "";
}
