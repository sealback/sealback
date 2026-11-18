// SPDX-License-Identifier: Apache-2.0
//
// Shared DOM helpers: element lookup, copy, download, mailto, messages.

import { setText } from "./i18n.js";

/** Maximum length of a complete mailto: URL (section 6.3/6.4 of the spec). */
export const MAX_MAILTO_LENGTH = 1800;

/** Maximum size of files loaded by the user (keys, ciphertext). */
export const MAX_FILE_SIZE = 1024 * 1024;

/**
 * Returns the element with the given id, checked against the expected type.
 *
 * @template {HTMLElement} T
 * @param {string} id
 * @param {new () => T} type
 * @returns {T}
 */
export function byId(id, type) {
  const el = document.getElementById(id);
  if (!(el instanceof type)) throw new Error(`#${id} is missing or not a ${type.name}`);
  return el;
}

/**
 * @param {HTMLElement} el
 * @param {boolean} visible
 */
export function show(el, visible) {
  el.hidden = !visible;
}

/**
 * Shows a translated message in an element, or hides it if key is null.
 *
 * @param {HTMLElement} el
 * @param {string | null} key
 * @param {Record<string, string>} [params]
 */
export function message(el, key, params) {
  setText(el, key, params);
  el.hidden = key === null;
}

/**
 * Copies text to the clipboard. If the Clipboard API is unavailable or
 * denied, selects the text in the given field so the user can copy it.
 *
 * @param {string} text
 * @param {HTMLTextAreaElement | HTMLInputElement} field shows the same text
 * @returns {Promise<boolean>} true if copied automatically
 */
export async function copyText(text, field) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    field.focus();
    field.select();
    return false;
  }
}

/**
 * Copies text and reports the result in a status element.
 *
 * @param {string} text
 * @param {HTMLTextAreaElement | HTMLInputElement} field
 * @param {HTMLElement} status
 */
export async function copyWithStatus(text, field, status) {
  const ok = await copyText(text, field);
  message(status, ok ? "common.copied" : "common.copyFailed");
}

/**
 * Triggers a download of the given data. The object URL is revoked right
 * after the download has started.
 *
 * @param {Uint8Array | string} data
 * @param {string} filename
 * @param {string} type MIME type
 */
export function download(data, filename, type) {
  const blob = new Blob([typeof data === "string" ? data : new Uint8Array(data)], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.hidden = true;
  document.body.append(a);
  try {
    a.click();
  } finally {
    a.remove();
    // Some browsers read the blob asynchronously after click(); revoking in
    // the same task can cancel the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/**
 * Builds a mailto: URL without recipient address, or returns null if the
 * complete URL would be longer than MAX_MAILTO_LENGTH.
 *
 * @param {string} subject
 * @param {string} body
 * @returns {string | null}
 */
export function mailtoUrl(subject, body) {
  const url =
    `mailto:?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body.replace(/\r?\n/g, "\r\n"))}`;
  return url.length <= MAX_MAILTO_LENGTH ? url : null;
}

/**
 * The address of this page without fragment, e.g. "https://sealback.org/".
 *
 * @returns {string}
 */
export function baseUrl() {
  return location.origin + location.pathname;
}

/**
 * Reads a user-selected file, refusing files larger than MAX_FILE_SIZE.
 *
 * @param {File} file
 * @returns {Promise<Uint8Array | null>}
 */
export async function readFile(file) {
  if (file.size > MAX_FILE_SIZE) return null;
  return new Uint8Array(await file.arrayBuffer());
}

/**
 * Runs an async action while the button is disabled and a working message is
 * shown.
 *
 * @template T
 * @param {HTMLButtonElement} button
 * @param {HTMLElement} status
 * @param {string} workingKey
 * @param {() => Promise<T>} action
 * @returns {Promise<T>}
 */
export async function busy(button, status, workingKey, action) {
  button.disabled = true;
  message(status, workingKey);
  // Let the browser paint the message before CPU-heavy work (scrypt) starts.
  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  try {
    return await action();
  } finally {
    button.disabled = false;
    message(status, null);
  }
}
