// SPDX-License-Identifier: Apache-2.0
//
// DOM logic for the decrypt view: load the key file, unlock it if needed,
// decrypt the ciphertext.

import { decryptText, readKeyFile, unlockKeyFile } from "./crypto.js";
import { busy, byId, copyWithStatus, message, readFile, show } from "./ui.js";

/** @typedef {import("./crypto.js").CryptoError} CryptoError */

function elements() {
  return {
    drop: byId("decrypt-drop", HTMLLabelElement),
    keyFile: byId("decrypt-key-file", HTMLInputElement),
    keyStatus: byId("decrypt-key-status", HTMLParagraphElement),
    passField: byId("decrypt-pass-field", HTMLDivElement),
    pass: byId("decrypt-pass", HTMLInputElement),
    input: byId("decrypt-input", HTMLTextAreaElement),
    inputFile: byId("decrypt-input-file", HTMLInputElement),
    inputStatus: byId("decrypt-input-status", HTMLParagraphElement),
    run: byId("decrypt-run", HTMLButtonElement),
    status: byId("decrypt-status", HTMLParagraphElement),
    error: byId("decrypt-error", HTMLParagraphElement),
    result: byId("decrypt-result", HTMLDivElement),
    output: byId("decrypt-output", HTMLTextAreaElement),
    copy: byId("decrypt-copy", HTMLButtonElement),
    hide: byId("decrypt-hide", HTMLButtonElement),
    copyStatus: byId("decrypt-copy-status", HTMLParagraphElement),
  };
}

/** @type {ReturnType<typeof elements>} */
let e;

/**
 * The loaded key file. For a plain file, the identity is read directly; for
 * a protected file, only the encrypted bytes are kept until decryption.
 * @type {{ kind: "plain", identity: string } | { kind: "protected", bytes: Uint8Array } | null}
 */
let key = null;

/** Binary ciphertext loaded from a file (armored files go into the textarea). */
/** @type {Uint8Array | null} */
let loadedCiphertext = null;

export function init() {
  e = elements();
  e.keyFile.addEventListener("change", () => {
    const file = e.keyFile.files?.[0];
    e.keyFile.value = "";
    if (file) void loadKey(file);
  });
  for (const type of ["dragenter", "dragover"]) {
    e.drop.addEventListener(type, (ev) => {
      ev.preventDefault();
      e.drop.classList.add("over");
    });
  }
  for (const type of ["dragleave", "drop"]) {
    e.drop.addEventListener(type, () => e.drop.classList.remove("over"));
  }
  e.drop.addEventListener("drop", (ev) => {
    ev.preventDefault();
    const file = ev.dataTransfer?.files[0];
    if (file) void loadKey(file);
  });
  e.inputFile.addEventListener("change", () => {
    const file = e.inputFile.files?.[0];
    e.inputFile.value = "";
    if (file) void loadCiphertext(file);
  });
  e.input.addEventListener("input", () => {
    loadedCiphertext = null;
    message(e.inputStatus, null);
  });
  e.run.addEventListener("click", () => void run());
  e.copy.addEventListener("click", () => void copyWithStatus(e.output.value, e.output, e.copyStatus));
  e.hide.addEventListener("click", hideResult);
}

/** @param {File} file */
async function loadKey(file) {
  message(e.error, null);
  key = null;
  show(e.passField, false);
  e.pass.value = "";
  const bytes = await readFile(file);
  if (bytes === null) {
    message(e.keyStatus, null);
    message(e.error, "common.fileTooLarge");
    return;
  }
  const result = await readKeyFile(bytes);
  if ("error" in result) {
    message(e.keyStatus, null);
    message(e.error, `error.crypto.${result.error}`);
    return;
  }
  key = result.kind === "plain" ? { kind: "plain", identity: result.identity } : { kind: "protected", bytes };
  message(e.keyStatus, "decrypt.key.loaded", { file: file.name });
  show(e.passField, key.kind === "protected");
  if (key.kind === "protected") e.pass.focus();
}

/** @param {File} file */
async function loadCiphertext(file) {
  message(e.error, null);
  const bytes = await readFile(file);
  if (bytes === null) {
    message(e.error, "common.fileTooLarge");
    return;
  }
  const text = new TextDecoder().decode(bytes);
  if (text.includes("-----BEGIN AGE ENCRYPTED FILE-----")) {
    e.input.value = text;
    loadedCiphertext = null;
  } else {
    e.input.value = "";
    loadedCiphertext = bytes;
  }
  message(e.inputStatus, "decrypt.input.loaded", { file: file.name });
}

async function run() {
  message(e.error, null);
  hideResult();
  if (key === null) {
    message(e.error, "decrypt.error.noKey");
    return;
  }
  if (key.kind === "protected" && e.pass.value === "") {
    message(e.error, "decrypt.error.noPass");
    e.pass.focus();
    return;
  }
  const input = loadedCiphertext ?? e.input.value;
  if (typeof input === "string" && input.trim() === "") {
    message(e.error, "decrypt.error.noInput");
    e.input.focus();
    return;
  }
  const k = key;
  const passphrase = e.pass.value;
  /** @type {{ text: string } | { error: CryptoError }} */
  let result;
  try {
    result = await busy(e.run, e.status, "decrypt.working", async () => {
      let identity;
      if (k.kind === "plain") {
        identity = k.identity;
      } else {
        const unlocked = await unlockKeyFile(k.bytes, passphrase);
        if ("error" in unlocked) return unlocked;
        identity = unlocked.identity;
      }
      return await decryptText(identity, input);
    });
  } catch {
    result = { error: "malformed" };
  }
  if ("error" in result) {
    message(e.error, `error.crypto.${result.error}`);
    if (result.error === "wrong-passphrase") {
      e.pass.value = "";
      e.pass.focus();
    }
    return;
  }
  e.pass.value = "";
  e.output.value = result.text;
  message(e.copyStatus, null);
  show(e.result, true);
  e.output.focus();
}

function hideResult() {
  e.output.value = "";
  show(e.result, false);
  message(e.copyStatus, null);
}

/** Clears key, passphrase, ciphertext and plaintext. */
export function clear() {
  key = null;
  loadedCiphertext = null;
  e.keyFile.value = "";
  e.inputFile.value = "";
  e.pass.value = "";
  e.input.value = "";
  show(e.passField, false);
  hideResult();
  message(e.keyStatus, null);
  message(e.inputStatus, null);
  message(e.error, null);
  message(e.status, null);
}

/** Nothing language-dependent beyond translated messages. */
export function refresh() {}
