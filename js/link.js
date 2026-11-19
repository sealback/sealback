// SPDX-License-Identifier: Apache-2.0
//
// Building and parsing share links and URL fragments. No DOM access.
//
// Link format: https://sealback.org/#pubkey=<age recipient>
// Everything is carried in the fragment, so it never reaches a server. The
// link carries nothing but the key: any label in it could be set by anyone,
// and would suggest an authenticity that only the key fingerprint provides.

import { normalizeRecipientInput } from "./keys.js";

/** @typedef {import("./keys.js").KeyType} KeyType */
/** @typedef {import("./keys.js").KeyError} KeyError */
/** @typedef {"home" | "request" | "send" | "decrypt"} View */

/**
 * @typedef {{ mode: "link", recipient: string, type: KeyType }
 *   | { mode: "link", error: KeyError }
 *   | { mode: "view", view: View }} Route
 */

/** Views that have their own fragment; everything else opens "home". */
/** @type {readonly View[]} */
export const VIEWS = ["request", "send", "decrypt"];

/**
 * @param {string} baseUrl e.g. "https://sealback.org/"; an existing fragment is dropped
 * @param {string} recipient normalized recipient
 * @returns {string}
 */
export function buildLink(baseUrl, recipient) {
  return `${baseUrl.split("#")[0]}#pubkey=${recipient}`;
}

/**
 * @param {string} hash location.hash, with or without the leading "#"
 * @returns {Route}
 */
export function parseFragment(hash) {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  const view = VIEWS.find((v) => v === fragment);
  if (view !== undefined) return { mode: "view", view };

  const params = new URLSearchParams(fragment);
  const pubkey = params.get("pubkey");
  if (pubkey === null) return { mode: "view", view: "home" };

  const key = normalizeRecipientInput(pubkey);
  if ("error" in key) return { mode: "link", error: key.error };
  // Other parameters are ignored.
  return { mode: "link", recipient: key.recipient, type: key.type };
}
