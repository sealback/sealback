// SPDX-License-Identifier: Apache-2.0
//
// Building and parsing share links and URL fragments. No DOM access.
//
// Link format: https://sealback.org/#pubkey=<age recipient>&name=<label>
// Everything is carried in the fragment, so it never reaches a server.

import { normalizeRecipientInput } from "./keys.js";

/** @typedef {import("./keys.js").KeyType} KeyType */
/** @typedef {import("./keys.js").KeyError} KeyError */
/** @typedef {"send" | "receive" | "decrypt"} Tab */

/**
 * @typedef {{ mode: "link", recipient: string, type: KeyType, name: string | null }
 *   | { mode: "link", error: KeyError }
 *   | { mode: "tab", tab: Tab }} Route
 */

/** Maximum length of the name label, in Unicode code points. */
export const MAX_NAME_LENGTH = 80;

/** @type {readonly Tab[]} */
export const TABS = ["receive", "send", "decrypt"];

/**
 * Normalizes a name label: removes control and formatting characters (which
 * includes bidirectional overrides that could make the label misleading),
 * collapses whitespace, trims and limits the length.
 *
 * @param {string} name
 * @returns {string}
 */
export function cleanName(name) {
  const cleaned = name
    .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return [...cleaned].slice(0, MAX_NAME_LENGTH).join("").trim();
}

/**
 * @param {string} baseUrl e.g. "https://sealback.org/"; an existing fragment is dropped
 * @param {string} recipient normalized recipient
 * @param {string | null | undefined} [name] optional label shown to the sender
 * @returns {string}
 */
export function buildLink(baseUrl, recipient, name) {
  const base = baseUrl.split("#")[0];
  let link = `${base}#pubkey=${recipient}`;
  const label = name == null ? "" : cleanName(name);
  if (label !== "") link += `&name=${encodeURIComponent(label)}`;
  return link;
}

/**
 * @param {string} hash location.hash, with or without the leading "#"
 * @returns {Route}
 */
export function parseFragment(hash) {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  const tab = TABS.find((t) => t === fragment);
  if (tab !== undefined) return { mode: "tab", tab };

  const params = new URLSearchParams(fragment);
  const pubkey = params.get("pubkey");
  if (pubkey === null) return { mode: "tab", tab: "receive" };

  const key = normalizeRecipientInput(pubkey);
  if ("error" in key) return { mode: "link", error: key.error };

  const rawName = params.get("name");
  const name = rawName === null ? "" : cleanName(rawName);
  return { mode: "link", recipient: key.recipient, type: key.type, name: name === "" ? null : name };
}
