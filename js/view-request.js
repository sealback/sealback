// SPDX-License-Identifier: Apache-2.0
//
// DOM logic for the request view: generate a key pair and download the key
// file, or load an existing key file; then show the share link.

import { createKeyFile, generateKey, readKeyFile, recipientOf, unlockKeyFile } from "./crypto.js";
import { fingerprint, formatFingerprint } from "./fingerprint.js";
import { setText, t } from "./i18n.js";
import { buildLink } from "./link.js";
import {
  baseUrl,
  busy,
  byId,
  copyWithStatus,
  download,
  mailtoUrl,
  message,
  readFile,
  show,
} from "./ui.js";

/** @typedef {import("./keys.js").KeyType} KeyType */

const MIN_PASSPHRASE_LENGTH = 12;

function elements() {
  return {
    form: byId("request-form", HTMLDivElement),
    type: byId("request-type", HTMLSelectElement),
    typeHint: byId("request-type-hint", HTMLParagraphElement),
    passFields: byId("request-pass-fields", HTMLDivElement),
    pass: byId("request-pass", HTMLInputElement),
    pass2: byId("request-pass2", HTMLInputElement),
    protect: byId("request-protect", HTMLInputElement),
    noPassWarning: byId("request-nopass-warning", HTMLParagraphElement),
    create: byId("request-create", HTMLButtonElement),
    status: byId("request-status", HTMLParagraphElement),
    error: byId("request-error", HTMLParagraphElement),
    existingFile: byId("request-existing-file", HTMLInputElement),
    existingStatus: byId("request-existing-status", HTMLParagraphElement),
    existingPassField: byId("request-existing-pass-field", HTMLDivElement),
    existingPass: byId("request-existing-pass", HTMLInputElement),
    existingUnlock: byId("request-existing-unlock", HTMLButtonElement),
    existingWorking: byId("request-existing-working", HTMLParagraphElement),
    existingError: byId("request-existing-error", HTMLParagraphElement),
    result: byId("request-result", HTMLDivElement),
    doneTitle: byId("request-done-title", HTMLHeadingElement),
    file: byId("request-file", HTMLParagraphElement),
    downloadAgain: byId("request-download-again", HTMLButtonElement),
    link: byId("request-link", HTMLTextAreaElement),
    copyLink: byId("request-copy-link", HTMLButtonElement),
    mail: byId("request-mail", HTMLAnchorElement),
    mailTooLong: byId("request-mail-too-long", HTMLParagraphElement),
    copyStatus: byId("request-copy-status", HTMLParagraphElement),
    code: byId("request-code", HTMLElement),
    fallbackText: byId("request-fallback-text", HTMLParagraphElement),
    pubkey: byId("request-pubkey", HTMLTextAreaElement),
    copyPubkey: byId("request-copy-pubkey", HTMLButtonElement),
    downloadPubkey: byId("request-download-pubkey", HTMLButtonElement),
    newKey: byId("request-new", HTMLButtonElement),
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

/**
 * A passphrase-protected key file loaded by the user, kept until it is
 * unlocked. (Plain key files show their link right away.)
 * @type {{ name: string, bytes: Uint8Array } | null}
 */
let existing = null;

/** The public key shown in the result, and its fingerprint. */
let shown = { recipient: "", code: "" };

export function init() {
  e = elements();
  e.type.addEventListener("change", showTypeHint);
  showTypeHint(); // the browser may restore a previous selection on reload
  e.protect.addEventListener("change", showPassphraseFields);
  showPassphraseFields(); // the browser may restore the checkbox state on reload
  e.create.addEventListener("click", () => void createKey());
  e.existingFile.addEventListener("change", () => {
    const file = e.existingFile.files?.[0];
    e.existingFile.value = "";
    if (file) void loadExisting(file);
  });
  e.existingUnlock.addEventListener("click", () => void unlockExisting());
  e.existingPass.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") void unlockExisting();
  });
  e.downloadAgain.addEventListener("click", () => {
    if (keyFile) download(keyFile.bytes, keyFile.name, keyFile.type);
  });
  e.copyLink.addEventListener(
    "click",
    () => void copyWithStatus(e.link.value, e.link, e.copyStatus),
  );
  e.copyPubkey.addEventListener(
    "click",
    () => void copyWithStatus(e.pubkey.value, e.pubkey, e.copyStatus),
  );
  e.downloadPubkey.addEventListener("click", () => {
    download(
      `${shown.recipient}\n`,
      `sealback-pubkey-${formatFingerprint(shown.code, "-")}.txt`,
      "text/plain",
    );
  });
  e.newKey.addEventListener("click", () => {
    reset();
    e.type.focus();
  });
}

/** Shows the description of the selected encryption type only. */
function showTypeHint() {
  setText(e.typeHint, `request.type.${selectedType()}.hint`);
}

/** @returns {KeyType} */
function selectedType() {
  return e.type.value === "x25519" ? "x25519" : "mlkem768x25519";
}

/** Shows the passphrase fields, or the warning if protection is turned off. */
function showPassphraseFields() {
  show(e.passFields, e.protect.checked);
  show(e.noPassWarning, !e.protect.checked);
  if (!e.protect.checked) clearPassphrases();
}

function clearPassphrases() {
  e.pass.value = "";
  e.pass2.value = "";
}

/** @returns {string | null | undefined} passphrase, null for none, undefined if invalid */
function readPassphrase() {
  if (!e.protect.checked) return null;
  const pass = e.pass.value;
  if ([...pass].length < MIN_PASSPHRASE_LENGTH) {
    message(e.error, "request.error.passShort");
    e.pass.focus();
    return undefined;
  }
  if (pass !== e.pass2.value) {
    message(e.error, "request.error.passMismatch");
    e.pass2.focus();
    return undefined;
  }
  return pass;
}

async function createKey() {
  message(e.error, null);
  const passphrase = readPassphrase();
  if (passphrase === undefined) return;
  const type = selectedType();
  try {
    await busy(e.create, e.status, "request.working", async () => {
      const key = await generateKey(type);
      const code = await fingerprint(key.recipient);
      const bytes = await createKeyFile(key, passphrase);
      const ext = passphrase === null ? "txt" : "age";
      keyFile = {
        bytes,
        name: `sealback-key-${formatFingerprint(code, "-")}.${ext}`,
        type: passphrase === null ? "text/plain" : "application/octet-stream",
      };
      shown = { recipient: key.recipient, code };
    });
  } catch {
    message(e.error, "request.error.failed");
    return;
  } finally {
    clearPassphrases();
  }
  if (!keyFile) return;
  download(keyFile.bytes, keyFile.name, keyFile.type);
  setText(e.doneTitle, "request.done.title");
  setText(e.file, "request.done.file", { file: keyFile.name });
  showResult();
}

/** @param {File} file */
async function loadExisting(file) {
  message(e.existingError, null);
  existing = null;
  e.existingPass.value = "";
  show(e.existingPassField, false);
  const bytes = await readFile(file);
  if (bytes === null) {
    message(e.existingStatus, null);
    message(e.existingError, "common.fileTooLarge");
    return;
  }
  const result = await readKeyFile(bytes);
  if ("error" in result) {
    message(e.existingStatus, null);
    message(e.existingError, `error.crypto.${result.error}`);
    return;
  }
  if (result.kind === "plain") {
    message(e.existingStatus, null);
    await showExisting(await recipientOf(result.identity), file.name);
    return;
  }
  existing = { name: file.name, bytes };
  message(e.existingStatus, "decrypt.key.loaded", { file: file.name });
  show(e.existingPassField, true);
  e.existingPass.focus();
}

async function unlockExisting() {
  message(e.existingError, null);
  if (existing === null) return;
  if (e.existingPass.value === "") {
    message(e.existingError, "decrypt.error.noPass");
    e.existingPass.focus();
    return;
  }
  const loaded = existing;
  const passphrase = e.existingPass.value;
  e.existingPass.value = "";
  const recipient = await busy(
    e.existingUnlock,
    e.existingWorking,
    "request.existing.working",
    async () => {
      const unlocked = await unlockKeyFile(loaded.bytes, passphrase);
      if ("error" in unlocked) {
        message(e.existingError, `error.crypto.${unlocked.error}`);
        return null;
      }
      return await recipientOf(unlocked.identity);
    },
  );
  if (recipient === null) {
    e.existingPass.focus();
    return;
  }
  await showExisting(recipient, loaded.name);
}

/**
 * Shows the result for an existing key: its link, without a download.
 *
 * @param {string} recipient
 * @param {string} fileName
 */
async function showExisting(recipient, fileName) {
  shown = { recipient, code: await fingerprint(recipient) };
  existing = null;
  keyFile = null;
  setText(e.doneTitle, "request.existing.title");
  setText(e.file, "request.existing.file", { file: fileName });
  message(e.existingStatus, null);
  show(e.existingPassField, false);
  showResult();
}

function showResult() {
  e.link.value = buildLink(baseUrl(), shown.recipient);
  e.pubkey.value = shown.recipient;
  e.code.textContent = formatFingerprint(shown.code);
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
  setText(e.fallbackText, "request.fallback.text", { url: `${baseUrl()}#send` });
  const url = mailtoUrl(t("request.mail.subject"), t("request.mail.body", { link: e.link.value }));
  if (url !== null) e.mail.href = url;
  show(e.mail, url !== null);
  show(e.mailTooLong, url === null);
}

/** Returns the view to the empty form. */
function reset() {
  clear();
  e.type.value = "mlkem768x25519";
  showTypeHint();
  e.protect.checked = true;
  showPassphraseFields();
  e.link.value = "";
  e.pubkey.value = "";
  e.code.textContent = "";
  shown = { recipient: "", code: "" };
  show(e.result, false);
  show(e.form, true);
}

/**
 * Clears secret-bearing state: passphrases and key files. The link and the
 * key fingerprint are not secret and stay visible.
 */
export function clear() {
  clearPassphrases();
  keyFile = null;
  existing = null;
  e.existingFile.value = "";
  e.existingPass.value = "";
  show(e.existingPassField, false);
  show(e.downloadAgain, false);
  for (const el of [
    e.error,
    e.status,
    e.copyStatus,
    e.existingStatus,
    e.existingError,
    e.existingWorking,
  ]) {
    message(el, null);
  }
}
