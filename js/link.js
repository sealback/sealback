// SPDX-License-Identifier: Apache-2.0
//
// Building and parsing share links and URL fragments. No DOM access.
//
// Link format: https://sealback.org/#pubkey=<age recipient>&title=<title>
// Everything is carried in the fragment, so it never reaches a server.

import { normalizeRecipientInput } from "./keys.js";

/** @typedef {import("./keys.js").KeyType} KeyType */
/** @typedef {import("./keys.js").KeyError} KeyError */
/** @typedef {"request" | "send" | "decrypt"} View */

/**
 * @typedef {{ mode: "link", recipient: string, type: KeyType, title: string | null }
 *   | { mode: "link", error: KeyError }
 *   | { mode: "view", view: View }} Route
 */

/** Maximum length of the title, in Unicode code points. */
export const MAX_TITLE_LENGTH = 80;

/** @type {readonly View[]} */
export const VIEWS = ["request", "send", "decrypt"];

/**
 * Normalizes a title: removes control and formatting characters (which
 * includes bidirectional overrides that could make the label misleading),
 * collapses whitespace, trims and limits the length.
 *
 * @param {string} title
 * @returns {string}
 */
export function cleanTitle(title) {
  const cleaned = title
    .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return [...cleaned].slice(0, MAX_TITLE_LENGTH).join("").trim();
}

/**
 * @param {string} baseUrl e.g. "https://sealback.org/"; an existing fragment is dropped
 * @param {string} recipient normalized recipient
 * @param {string | null | undefined} [title] optional title shown to the sender
 * @returns {string}
 */
export function buildLink(baseUrl, recipient, title) {
  const base = baseUrl.split("#")[0];
  let link = `${base}#pubkey=${recipient}`;
  const label = title == null ? "" : cleanTitle(title);
  if (label !== "") link += `&title=${encodeURIComponent(label)}`;
  return link;
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
  if (pubkey === null) return { mode: "view", view: "request" };

  const key = normalizeRecipientInput(pubkey);
  if ("error" in key) return { mode: "link", error: key.error };

  const rawTitle = params.get("title");
  const title = rawTitle === null ? "" : cleanTitle(rawTitle);
  return { mode: "link", recipient: key.recipient, type: key.type, title: title === "" ? null : title };
}
