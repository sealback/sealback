// SPDX-License-Identifier: Apache-2.0
//
// DOM logic for the receive view: generate a key pair, download the key file,
// show the share link.

import { createKeyFile, generateKey } from "./crypto.js";
import { fingerprint, formatFingerprint } from "./fingerprint.js";
import { setText, t } from "./i18n.js";
import { buildLink } from "./link.js";
import { baseUrl, busy, byId, copyWithStatus, download, localDate, mailtoUrl, message, show } from "./ui.js";

/** @typedef {import("./keys.js").KeyType} KeyType */

const MIN_PASSPHRASE_LENGTH = 12;

function elements() {
  return {
    form: byId("receive-form", HTMLDivElement),
    name: byId("receive-name", HTMLInputElement),
    typePq: byId("receive-type-pq", HTMLInputElement),
    passFields: byId("receive-pass-fields", HTMLDivElement),
    pass: byId("receive-pass", HTMLInputElement),
    pass2: byId("receive-pass2", HTMLInputElement),
    noPass: byId("receive-nopass", HTMLInputElement),
    noPassWarning: byId("receive-nopass-warning", HTMLParagraphElement),
    create: byId("receive-create", HTMLButtonElement),
    status: byId("receive-status", HTMLParagraphElement),
    error: byId("receive-error", HTMLParagraphElement),
    result: byId("receive-result", HTMLDivElement),
    doneTitle: byId("receive-done-title", HTMLHeadingElement),
    file: byId("receive-file", HTMLParagraphElement),
    downloadAgain: byId("receive-download-again", HTMLButtonElement),
    link: byId("receive-link", HTMLTextAreaElement),
    copyLink: byId("receive-copy-link", HTMLButtonElement),
    mail: byId("receive-mail", HTMLAnchorElement),
    mailTooLong: byId("receive-mail-too-long", HTMLParagraphElement),
    copyStatus: byId("receive-copy-status", HTMLParagraphElement),
    code: byId("receive-code", HTMLElement),
    fallbackText: byId("receive-fallback-text", HTMLParagraphElement),
    pubkey: byId("receive-pubkey", HTMLTextAreaElement),
    copyPubkey: byId("receive-copy-pubkey", HTMLButtonElement),
    downloadPubkey: byId("receive-download-pubkey", HTMLButtonElement),
    newKey: byId("receive-new", HTMLButtonElement),
  };
}

/** @type {ReturnType<typeof elements>} */
let e;

/**
 * The generated key file, kept only for "Download again" while this view is
 * active. It is passphrase-encrypted unless the user opted out.
 * @type {{ bytes: Uint8Array, name: string, type: string } | null}
 */
let keyFile = null;

/** The recipient and its fingerprint of the last created key. */
let created = { recipient: "", code: "" };

export function init() {
  e = elements();
  e.noPass.addEventListener("change", () => {
    show(e.passFields, !e.noPass.checked);
    show(e.noPassWarning, e.noPass.checked);
    if (e.noPass.checked) clearPassphrases();
  });
  e.create.addEventListener("click", () => void createKey());
  e.downloadAgain.addEventListener("click", () => {
    if (keyFile) download(keyFile.bytes, keyFile.name, keyFile.type);
  });
  e.copyLink.addEventListener("click", () => void copyWithStatus(e.link.value, e.link, e.copyStatus));
  e.copyPubkey.addEventListener("click", () => void copyWithStatus(e.pubkey.value, e.pubkey, e.copyStatus));
  e.downloadPubkey.addEventListener("click", () => {
    download(`${created.recipient}\n`, `sealback-pubkey-${created.code.slice(0, 4)}.txt`, "text/plain");
  });
  e.newKey.addEventListener("click", () => {
    reset();
    e.name.focus();
  });
}

function clearPassphrases() {
  e.pass.value = "";
  e.pass2.value = "";
}

/** @returns {string | null | undefined} passphrase, null for none, undefined if invalid */
function readPassphrase() {
  if (e.noPass.checked) return null;
  const pass = e.pass.value;
  if ([...pass].length < MIN_PASSPHRASE_LENGTH) {
    message(e.error, "receive.error.passShort");
    e.pass.focus();
    return undefined;
  }
  if (pass !== e.pass2.value) {
    message(e.error, "receive.error.passMismatch");
    e.pass2.focus();
    return undefined;
  }
  return pass;
}

async function createKey() {
  message(e.error, null);
  const passphrase = readPassphrase();
  if (passphrase === undefined) return;
  /** @type {KeyType} */
  const type = e.typePq.checked ? "pq" : "standard";
  try {
    await busy(e.create, e.status, "receive.working", async () => {
      const key = await generateKey(type);
      const code = await fingerprint(key.recipient);
      const bytes = await createKeyFile(key, passphrase);
      const ext = passphrase === null ? "txt" : "age";
      keyFile = {
        bytes,
        name: `sealback-key-${localDate()}-${code.slice(0, 4)}.${ext}`,
        type: passphrase === null ? "text/plain" : "application/octet-stream",
      };
      created = { recipient: key.recipient, code };
    });
  } catch {
    message(e.error, "receive.error.failed");
    return;
  } finally {
    clearPassphrases();
  }
  if (!keyFile) return;
  download(keyFile.bytes, keyFile.name, keyFile.type);
  showResult();
}

function showResult() {
  e.link.value = buildLink(baseUrl(), created.recipient, e.name.value);
  e.pubkey.value = created.recipient;
  e.code.textContent = formatFingerprint(created.code);
  setText(e.file, "receive.done.file", { file: keyFile?.name ?? "" });
  show(e.downloadAgain, keyFile !== null);
  message(e.copyStatus, null);
  show(e.form, false);
  show(e.result, true);
  refresh();
  e.doneTitle.focus();
}

/** Re-renders language-dependent values (mailto texts, URLs). */
export function refresh() {
  if (e.result.hidden) return;
  setText(e.fallbackText, "receive.fallback.text", { url: `${baseUrl()}#send` });
  const url = mailtoUrl(t("receive.mail.subject"), t("receive.mail.body", { link: e.link.value }));
  if (url !== null) e.mail.href = url;
  show(e.mail, url !== null);
  show(e.mailTooLong, url === null);
}

/** Returns the view to the empty form. */
function reset() {
  clear();
  e.name.value = "";
  e.typePq.checked = true;
  e.noPass.checked = false;
  show(e.passFields, true);
  show(e.noPassWarning, false);
  e.link.value = "";
  e.pubkey.value = "";
  e.code.textContent = "";
  created = { recipient: "", code: "" };
  show(e.result, false);
  show(e.form, true);
}

/**
 * Clears secret-bearing state: passphrases and the key file. The link and
 * security code are not secret and stay visible.
 */
export function clear() {
  clearPassphrases();
  keyFile = null;
  show(e.downloadAgain, false);
  message(e.error, null);
  message(e.status, null);
  message(e.copyStatus, null);
}
