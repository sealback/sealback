// SPDX-License-Identifier: Apache-2.0
//
// DOM logic for the send view: determine the recipient (from the link or
// manual input), encrypt the secret, offer the ciphertext.

import { encryptText } from "./crypto.js";
import { fingerprint, formatFingerprint } from "./fingerprint.js";
import { setText, t } from "./i18n.js";
import { normalizeRecipientInput } from "./keys.js";
import { baseUrl, busy, byId, copyWithStatus, download, localDate, mailtoUrl, message, readFile, show } from "./ui.js";

/** @typedef {import("./keys.js").KeyType} KeyType */
/** @typedef {import("./link.js").Route} Route */

function elements() {
  return {
    linkError: byId("send-link-error", HTMLDivElement),
    manual: byId("send-manual", HTMLDivElement),
    key: byId("send-key", HTMLTextAreaElement),
    keyFile: byId("send-key-file", HTMLInputElement),
    keyError: byId("send-key-error", HTMLParagraphElement),
    recipient: byId("send-recipient", HTMLDivElement),
    to: byId("send-to", HTMLParagraphElement),
    name: byId("send-name", HTMLElement),
    protection: byId("send-protection", HTMLElement),
    code: byId("send-code", HTMLElement),
    secret: byId("send-secret", HTMLTextAreaElement),
    encrypt: byId("send-encrypt", HTMLButtonElement),
    status: byId("send-status", HTMLParagraphElement),
    error: byId("send-error", HTMLParagraphElement),
    result: byId("send-result", HTMLDivElement),
    output: byId("send-output", HTMLTextAreaElement),
    copy: byId("send-copy", HTMLButtonElement),
    download: byId("send-download", HTMLButtonElement),
    mail: byId("send-mail", HTMLAnchorElement),
    copyStatus: byId("send-copy-status", HTMLParagraphElement),
  };
}

/** @type {ReturnType<typeof elements>} */
let e;

/** @type {{ recipient: string, type: KeyType } | null} */
let current = null;

/** Binary ciphertext for "Download as file". */
/** @type {Uint8Array | null} */
let ciphertext = null;

/** Incremented on every recipient change, to drop outdated fingerprint results. */
let generation = 0;

export function init() {
  e = elements();
  e.key.addEventListener("input", () => void checkManualKey(false));
  e.keyFile.addEventListener("change", () => void loadKeyFile());
  e.encrypt.addEventListener("click", () => void encrypt());
  e.copy.addEventListener("click", () => void copyWithStatus(e.output.value, e.output, e.copyStatus));
  e.download.addEventListener("click", () => {
    if (ciphertext) download(ciphertext, `sealback-${localDate()}.age`, "application/octet-stream");
  });
}

/**
 * Link mode: recipient from the URL fragment, or an error with manual input.
 *
 * @param {Extract<Route, { mode: "link" }>} route
 */
export function showLink(route) {
  clear();
  if ("error" in route) {
    show(e.linkError, true);
    show(e.manual, true);
    e.key.value = "";
    message(e.keyError, null);
    void setRecipient(null, null);
  } else {
    show(e.linkError, false);
    show(e.manual, false);
    void setRecipient({ recipient: route.recipient, type: route.type }, route.name);
  }
}

/** #send: manual key input (fallback when a link is damaged or too long). */
export function showManual() {
  clear();
  show(e.linkError, false);
  show(e.manual, true);
  void checkManualKey(false);
}

/** @param {boolean} reportEmpty */
async function checkManualKey(reportEmpty) {
  const result = normalizeRecipientInput(e.key.value);
  if ("error" in result) {
    const quiet = result.error === "empty" && !reportEmpty;
    message(e.keyError, quiet ? null : `error.key.${result.error}`);
    await setRecipient(null, null);
  } else {
    message(e.keyError, null);
    if (current?.recipient !== result.recipient) await setRecipient(result, null);
  }
}

async function loadKeyFile() {
  const file = e.keyFile.files?.[0];
  e.keyFile.value = "";
  if (!file) return;
  const bytes = await readFile(file);
  if (bytes === null) {
    message(e.keyError, "common.fileTooLarge");
    return;
  }
  e.key.value = new TextDecoder().decode(bytes);
  await checkManualKey(true);
}

/**
 * @param {{ recipient: string, type: KeyType } | null} key
 * @param {string | null} name label from the link, link mode only
 */
async function setRecipient(key, name) {
  const gen = ++generation;
  current = key;
  clearResult();
  if (key === null) {
    show(e.recipient, false);
    return;
  }
  const code = await fingerprint(key.recipient);
  if (gen !== generation) return;
  e.name.textContent = name ?? "";
  show(e.to, name !== null);
  setText(e.protection, `send.protection.${key.type}`);
  e.code.textContent = formatFingerprint(code);
  show(e.recipient, true);
}

async function encrypt() {
  message(e.error, null);
  if (current === null) return;
  const text = e.secret.value;
  if (text.trim() === "") {
    message(e.error, "send.error.empty");
    e.secret.focus();
    return;
  }
  const recipient = current.recipient;
  try {
    const result = await busy(e.encrypt, e.status, "send.working", () => encryptText(recipient, text));
    e.secret.value = "";
    e.output.value = result.armored;
    ciphertext = result.binary;
  } catch {
    message(e.error, "send.error.failed");
    return;
  }
  message(e.copyStatus, null);
  show(e.result, true);
  refresh();
  e.copy.focus();
}

/** Re-renders language-dependent values (mailto text). */
export function refresh() {
  if (e.result.hidden || e.output.value === "") return;
  const url = mailtoUrl(
    t("send.mail.subject"),
    t("send.mail.body", { url: `${baseUrl()}#decrypt`, ciphertext: e.output.value }),
  );
  if (url !== null) e.mail.href = url;
  show(e.mail, url !== null);
}

function clearResult() {
  e.output.value = "";
  ciphertext = null;
  e.mail.href = "mailto:";
  show(e.result, false);
  message(e.copyStatus, null);
}

/** Clears the secret and the result. */
export function clear() {
  e.secret.value = "";
  clearResult();
  message(e.error, null);
  message(e.status, null);
}
