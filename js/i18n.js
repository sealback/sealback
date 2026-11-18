// SPDX-License-Identifier: Apache-2.0
//
// String tables (en, de) and language selection.
//
// Elements in index.html carry data-i18n="<key>" (text content) and
// data-i18n-attr="<attribute>:<key>,..." (attributes). The English text in
// the HTML is only a fallback; applyTranslations() replaces it. Dynamic
// messages are set through setText(), which stores the key on the element so
// they are re-translated when the language changes.

/** @typedef {"en" | "de"} Lang */

/** @type {Record<string, string>} */
const en = {
  "app.description": "Send a secret back in encrypted form, without software, account or server.",
  "lang.label": "Language",
  "tabs.label": "Mode",
  "tab.receive": "Receive",
  "tab.send": "Send",
  "tab.decrypt": "Decrypt",
  "footer.about": "Sealback encrypts in your browser and sends nothing to any server.",
  "footer.source": "Source code",

  "receive.title": "Receive a secret",
  "receive.intro":
    "Someone needs to send you a password or another secret? Create a key here. A key file is saved on this computer, and you get a link to send to that person. With the link, they encrypt the secret so that only your key file can open it.",
  "receive.oneKey": "Create a new key for each exchange and delete it afterwards.",
  "receive.name.label": "Your name (optional)",
  "receive.name.hint": "Shown to the sender. Anyone who sees the link can read it.",
  "receive.type.legend": "Protection",
  "receive.type.pq": "Post-quantum (recommended for long-lived or highly sensitive data)",
  "receive.type.pq.hint": "Also protects against future quantum computers. The link is about 2,000 characters long.",
  "receive.type.standard": "Standard (shorter link)",
  "receive.type.standard.hint":
    "Secure today, but archived messages could become readable to future quantum computers. Suitable for secrets that are changed soon after the handover.",
  "receive.pass.legend": "Protect the key file",
  "receive.pass.label": "Passphrase",
  "receive.pass2.label": "Repeat passphrase",
  "receive.pass.hint": "At least 12 characters. Tip: use a few random words.",
  "receive.pass.note":
    "If you forget the passphrase, the secret cannot be recovered. You only need to remember it until the secret has arrived.",
  "receive.nopass.label": "Don't protect the key file with a passphrase",
  "receive.nopass.warning": "Without a passphrase, anyone who gets hold of the key file can read the secret.",
  "receive.create": "Create key",
  "receive.working": "Creating key …",
  "receive.error.passShort": "The passphrase must be at least 12 characters long.",
  "receive.error.passMismatch": "The two passphrases do not match.",
  "receive.error.failed": "The key could not be created.",
  "receive.done.title": "Your key file has been downloaded",
  "receive.done.file": "File name: {file}",
  "receive.downloadAgain": "Download key file again",
  "receive.link.label": "Link for the sender",
  "receive.copyLink": "Copy link",
  "receive.compose": "Compose email",
  "receive.mailTooLong": "The link is too long for an email button. Copy it and paste it into an email.",
  "receive.code.label": "Security code",
  "receive.fallback.summary": "If the link doesn't work",
  "receive.fallback.text":
    "Some email programs break long links. In that case, send the public key below instead. The sender opens {url} and pastes or loads it there.",
  "receive.pubkey.label": "Public key",
  "receive.copyPubkey": "Copy public key",
  "receive.downloadPubkey": "Download public key",
  "receive.steps.title": "Next steps",
  "receive.step1": "Send the link to the person who should send you the secret.",
  "receive.step2":
    "When they read the security code to you, compare it with the code above. If it is different, ask them not to send the secret.",
  "receive.step3": "Keep the key file and the passphrase until the secret has arrived. Then open “Decrypt”.",
  "receive.step4": "After decrypting, delete the key file.",
  "receive.new": "Create another key",
  "receive.mail.subject": "Please send me the secret securely",
  "receive.mail.body":
    "Hello,\n\nplease send me the secret using this link:\n\n{link}\n\nOpen the link, paste the secret and click “Encrypt”. Then send me the encrypted text by email.\n\nBefore that, please call me and read me the security code shown on the page.\n\nThank you!",

  "send.title": "Send a secret",
  "send.to": "Recipient:",
  "send.asStated": "(as stated in the link)",
  "send.linkError.title": "This link seems to be damaged.",
  "send.linkError.text":
    "Some email programs break long links. Ask the recipient to send the link again, or paste the complete link or key below.",
  "send.key.label": "Link or public key of the recipient",
  "send.key.hint": "Paste the link or key you received, or load it from a file.",
  "send.key.load": "Load from file",
  "send.protection": "Protection:",
  "send.protection.pq": "Post-quantum",
  "send.protection.standard": "Standard",
  "send.code.label": "Security code:",
  "send.code.hint": "Confirm this code with the recipient by phone before sending sensitive data.",
  "send.secret.label": "Your secret",
  "send.encrypt": "Encrypt",
  "send.working": "Encrypting …",
  "send.error.empty": "Please enter the secret first.",
  "send.error.failed": "Encryption failed.",
  "send.result.label": "Encrypted text — safe to send by normal email:",
  "send.download": "Download as file",
  "send.mail": "Send by email",
  "send.result.note":
    "Paste the encrypted text into an email, or attach the downloaded file. Only the recipient can decrypt it.",
  "send.mail.subject": "Encrypted secret",
  "send.mail.body": "Hello,\n\nhere is the encrypted secret. You can decrypt it with your key file at {url}\n\n{ciphertext}",
  "send.howto.summary": "How does this work?",
  "send.howto.p1":
    "Sealback uses age, an open and widely used encryption format. The link contains the recipient's public key. Your secret is encrypted with it directly in this browser. Only the recipient's private key file can decrypt it.",
  "send.howto.p2":
    "Standard keys use X25519. Post-quantum keys combine ML-KEM-768 with X25519, so the encrypted text stays protected even against future quantum computers.",
  "send.howto.p3":
    "Nothing you enter is sent anywhere. After loading, this page makes no network requests. You decide where the encrypted text goes.",
  "send.ownKey": "Create your own key →",

  "decrypt.title": "Decrypt a secret",
  "decrypt.intro": "Decrypt a secret that was sent to you. Everything happens in this browser.",
  "decrypt.key.label": "Your key file",
  "decrypt.key.drop": "Choose your key file, or drop it here.",
  "decrypt.key.loaded": "Key file loaded: {file}",
  "decrypt.pass.label": "Passphrase of the key file",
  "decrypt.input.label": "Encrypted text",
  "decrypt.input.hint": "Paste the encrypted text from the email, or load the attached .age file.",
  "decrypt.input.load": "Load .age file",
  "decrypt.input.loaded": "File loaded: {file}",
  "decrypt.run": "Decrypt",
  "decrypt.working": "Decrypting …",
  "decrypt.error.noKey": "Please choose your key file first.",
  "decrypt.error.noPass": "Please enter the passphrase of the key file.",
  "decrypt.error.noInput": "Please paste the encrypted text or load the file.",
  "decrypt.result.label": "Decrypted secret",
  "decrypt.hide": "Hide",
  "decrypt.reminder.title": "Done? Please clean up:",
  "decrypt.reminder":
    "Store the secret where it belongs, e.g. in a password manager. Then delete the key file and the email, and change the secret if possible.",

  "common.copy": "Copy",
  "common.copied": "Copied to the clipboard.",
  "common.copyFailed": "Could not copy automatically. The text is selected: press Ctrl+C (or ⌘+C).",
  "common.fileTooLarge": "The file is too large.",

  "error.key.empty": "Please paste a link or public key.",
  "error.key.invalid": "This is not a Sealback link or public key.",
  "error.key.damaged":
    "The key is damaged or incomplete (checksum mismatch). Make sure you copied the complete link or key.",
  "error.key.unsupported": "This type of key is not supported.",
  "error.key.secret-key":
    "This is a private key! Never share it. Ask the recipient for the link or the public key instead.",
  "error.crypto.invalid-key-file": "This is not a valid key file.",
  "error.crypto.wrong-passphrase": "Wrong passphrase.",
  "error.crypto.wrong-key":
    "This text was not encrypted for this key file. Make sure you chose the right key file.",
  "error.crypto.malformed":
    "The encrypted text is damaged or incomplete. Make sure you copied all of it, including the BEGIN and END lines.",
};

/** @type {Record<string, string>} */
const de = {
  "app.description": "Ein Geheimnis verschlüsselt zurückschicken, ohne Software, Konto oder Server.",
  "lang.label": "Sprache",
  "tabs.label": "Modus",
  "tab.receive": "Empfangen",
  "tab.send": "Senden",
  "tab.decrypt": "Entschlüsseln",
  "footer.about": "Sealback verschlüsselt in Ihrem Browser und sendet nichts an einen Server.",
  "footer.source": "Quellcode",

  "receive.title": "Ein Geheimnis empfangen",
  "receive.intro":
    "Jemand soll Ihnen ein Passwort oder ein anderes Geheimnis schicken? Erstellen Sie hier einen Schlüssel. Auf diesem Computer wird eine Schlüsseldatei gespeichert, und Sie erhalten einen Link für diese Person. Mit dem Link verschlüsselt sie das Geheimnis so, dass nur Ihre Schlüsseldatei es öffnen kann.",
  "receive.oneKey": "Erstellen Sie für jeden Austausch einen neuen Schlüssel und löschen Sie ihn danach.",
  "receive.name.label": "Ihr Name (optional)",
  "receive.name.hint": "Wird dem Absender angezeigt. Jeder, der den Link sieht, kann ihn lesen.",
  "receive.type.legend": "Schutz",
  "receive.type.pq": "Post-Quanten (empfohlen für langlebige oder besonders sensible Daten)",
  "receive.type.pq.hint": "Schützt auch vor zukünftigen Quantencomputern. Der Link ist etwa 2.000 Zeichen lang.",
  "receive.type.standard": "Standard (kürzerer Link)",
  "receive.type.standard.hint":
    "Heute sicher, aber archivierte Nachrichten könnten für zukünftige Quantencomputer lesbar werden. Geeignet für Geheimnisse, die bald nach der Übergabe geändert werden.",
  "receive.pass.legend": "Schlüsseldatei schützen",
  "receive.pass.label": "Passphrase",
  "receive.pass2.label": "Passphrase wiederholen",
  "receive.pass.hint": "Mindestens 12 Zeichen. Tipp: Verwenden Sie einige zufällige Wörter.",
  "receive.pass.note":
    "Wenn Sie die Passphrase vergessen, ist das Geheimnis verloren. Sie müssen sie sich nur merken, bis das Geheimnis angekommen ist.",
  "receive.nopass.label": "Schlüsseldatei nicht mit einer Passphrase schützen",
  "receive.nopass.warning": "Ohne Passphrase kann jeder, der an die Schlüsseldatei kommt, das Geheimnis lesen.",
  "receive.create": "Schlüssel erstellen",
  "receive.working": "Schlüssel wird erstellt …",
  "receive.error.passShort": "Die Passphrase muss mindestens 12 Zeichen lang sein.",
  "receive.error.passMismatch": "Die beiden Passphrasen stimmen nicht überein.",
  "receive.error.failed": "Der Schlüssel konnte nicht erstellt werden.",
  "receive.done.title": "Ihre Schlüsseldatei wurde heruntergeladen",
  "receive.done.file": "Dateiname: {file}",
  "receive.downloadAgain": "Schlüsseldatei erneut herunterladen",
  "receive.link.label": "Link für den Absender",
  "receive.copyLink": "Link kopieren",
  "receive.compose": "E-Mail verfassen",
  "receive.mailTooLong":
    "Der Link ist zu lang für eine E-Mail-Schaltfläche. Kopieren Sie ihn und fügen Sie ihn in eine E-Mail ein.",
  "receive.code.label": "Sicherheitscode",
  "receive.fallback.summary": "Falls der Link nicht funktioniert",
  "receive.fallback.text":
    "Manche E-Mail-Programme zerstören lange Links. Schicken Sie dann stattdessen den öffentlichen Schlüssel unten. Der Absender öffnet {url} und fügt ihn dort ein oder lädt ihn.",
  "receive.pubkey.label": "Öffentlicher Schlüssel",
  "receive.copyPubkey": "Öffentlichen Schlüssel kopieren",
  "receive.downloadPubkey": "Öffentlichen Schlüssel herunterladen",
  "receive.steps.title": "Nächste Schritte",
  "receive.step1": "Schicken Sie den Link an die Person, die Ihnen das Geheimnis senden soll.",
  "receive.step2":
    "Wenn sie Ihnen den Sicherheitscode vorliest, vergleichen Sie ihn mit dem Code oben. Weicht er ab, bitten Sie darum, das Geheimnis nicht zu senden.",
  "receive.step3":
    "Bewahren Sie Schlüsseldatei und Passphrase auf, bis das Geheimnis angekommen ist. Öffnen Sie dann „Entschlüsseln“.",
  "receive.step4": "Löschen Sie die Schlüsseldatei nach dem Entschlüsseln.",
  "receive.new": "Weiteren Schlüssel erstellen",
  "receive.mail.subject": "Bitte schicken Sie mir das Geheimnis sicher",
  "receive.mail.body":
    "Hallo,\n\nbitte schicken Sie mir das Geheimnis über diesen Link:\n\n{link}\n\nÖffnen Sie den Link, fügen Sie das Geheimnis ein und klicken Sie auf „Verschlüsseln“. Schicken Sie mir dann den verschlüsselten Text per E-Mail.\n\nBitte rufen Sie mich vorher an und lesen Sie mir den Sicherheitscode vor, der auf der Seite angezeigt wird.\n\nVielen Dank!",

  "send.title": "Ein Geheimnis senden",
  "send.to": "Empfänger:",
  "send.asStated": "(laut Link)",
  "send.linkError.title": "Dieser Link scheint beschädigt zu sein.",
  "send.linkError.text":
    "Manche E-Mail-Programme zerstören lange Links. Bitten Sie den Empfänger, den Link erneut zu schicken, oder fügen Sie den vollständigen Link oder Schlüssel unten ein.",
  "send.key.label": "Link oder öffentlicher Schlüssel des Empfängers",
  "send.key.hint": "Fügen Sie den erhaltenen Link oder Schlüssel ein, oder laden Sie ihn aus einer Datei.",
  "send.key.load": "Aus Datei laden",
  "send.protection": "Schutz:",
  "send.protection.pq": "Post-Quanten",
  "send.protection.standard": "Standard",
  "send.code.label": "Sicherheitscode:",
  "send.code.hint": "Bestätigen Sie diesen Code telefonisch mit dem Empfänger, bevor Sie sensible Daten senden.",
  "send.secret.label": "Ihr Geheimnis",
  "send.encrypt": "Verschlüsseln",
  "send.working": "Wird verschlüsselt …",
  "send.error.empty": "Bitte geben Sie zuerst das Geheimnis ein.",
  "send.error.failed": "Die Verschlüsselung ist fehlgeschlagen.",
  "send.result.label": "Verschlüsselter Text – kann per normaler E-Mail verschickt werden:",
  "send.download": "Als Datei herunterladen",
  "send.mail": "Per E-Mail senden",
  "send.result.note":
    "Fügen Sie den verschlüsselten Text in eine E-Mail ein, oder hängen Sie die heruntergeladene Datei an. Nur der Empfänger kann ihn entschlüsseln.",
  "send.mail.subject": "Verschlüsseltes Geheimnis",
  "send.mail.body":
    "Hallo,\n\nhier ist das verschlüsselte Geheimnis. Sie können es mit Ihrer Schlüsseldatei unter {url} entschlüsseln.\n\n{ciphertext}",
  "send.howto.summary": "Wie funktioniert das?",
  "send.howto.p1":
    "Sealback verwendet age, ein offenes und verbreitetes Verschlüsselungsformat. Der Link enthält den öffentlichen Schlüssel des Empfängers. Damit wird Ihr Geheimnis direkt in diesem Browser verschlüsselt. Nur die private Schlüsseldatei des Empfängers kann es entschlüsseln.",
  "send.howto.p2":
    "Standard-Schlüssel verwenden X25519. Post-Quanten-Schlüssel kombinieren ML-KEM-768 mit X25519, sodass der verschlüsselte Text auch gegen zukünftige Quantencomputer geschützt bleibt.",
  "send.howto.p3":
    "Nichts, was Sie eingeben, wird irgendwohin gesendet. Nach dem Laden stellt diese Seite keine Netzwerkanfragen. Sie entscheiden, wohin der verschlüsselte Text geht.",
  "send.ownKey": "Eigenen Schlüssel erstellen →",

  "decrypt.title": "Ein Geheimnis entschlüsseln",
  "decrypt.intro": "Entschlüsseln Sie ein Geheimnis, das Ihnen geschickt wurde. Alles geschieht in diesem Browser.",
  "decrypt.key.label": "Ihre Schlüsseldatei",
  "decrypt.key.drop": "Wählen Sie Ihre Schlüsseldatei aus, oder ziehen Sie sie hierher.",
  "decrypt.key.loaded": "Schlüsseldatei geladen: {file}",
  "decrypt.pass.label": "Passphrase der Schlüsseldatei",
  "decrypt.input.label": "Verschlüsselter Text",
  "decrypt.input.hint":
    "Fügen Sie den verschlüsselten Text aus der E-Mail ein, oder laden Sie die angehängte .age-Datei.",
  "decrypt.input.load": ".age-Datei laden",
  "decrypt.input.loaded": "Datei geladen: {file}",
  "decrypt.run": "Entschlüsseln",
  "decrypt.working": "Wird entschlüsselt …",
  "decrypt.error.noKey": "Bitte wählen Sie zuerst Ihre Schlüsseldatei aus.",
  "decrypt.error.noPass": "Bitte geben Sie die Passphrase der Schlüsseldatei ein.",
  "decrypt.error.noInput": "Bitte fügen Sie den verschlüsselten Text ein oder laden Sie die Datei.",
  "decrypt.result.label": "Entschlüsseltes Geheimnis",
  "decrypt.hide": "Ausblenden",
  "decrypt.reminder.title": "Fertig? Bitte aufräumen:",
  "decrypt.reminder":
    "Speichern Sie das Geheimnis dort, wo es hingehört, z. B. in einem Passwortmanager. Löschen Sie dann die Schlüsseldatei und die E-Mail, und ändern Sie das Geheimnis, wenn möglich.",

  "common.copy": "Kopieren",
  "common.copied": "In die Zwischenablage kopiert.",
  "common.copyFailed":
    "Automatisches Kopieren nicht möglich. Der Text ist markiert: Drücken Sie Strg+C (oder ⌘+C).",
  "common.fileTooLarge": "Die Datei ist zu groß.",

  "error.key.empty": "Bitte fügen Sie einen Link oder öffentlichen Schlüssel ein.",
  "error.key.invalid": "Das ist kein Sealback-Link und kein öffentlicher Schlüssel.",
  "error.key.damaged":
    "Der Schlüssel ist beschädigt oder unvollständig (Prüfsumme falsch). Achten Sie darauf, den vollständigen Link oder Schlüssel zu kopieren.",
  "error.key.unsupported": "Diese Art von Schlüssel wird nicht unterstützt.",
  "error.key.secret-key":
    "Das ist ein privater Schlüssel! Geben Sie ihn niemals weiter. Bitten Sie den Empfänger stattdessen um den Link oder den öffentlichen Schlüssel.",
  "error.crypto.invalid-key-file": "Das ist keine gültige Schlüsseldatei.",
  "error.crypto.wrong-passphrase": "Falsche Passphrase.",
  "error.crypto.wrong-key":
    "Dieser Text wurde nicht für diese Schlüsseldatei verschlüsselt. Prüfen Sie, ob Sie die richtige Schlüsseldatei gewählt haben.",
  "error.crypto.malformed":
    "Der verschlüsselte Text ist beschädigt oder unvollständig. Achten Sie darauf, alles zu kopieren, einschließlich der Zeilen BEGIN und END.",
};

/** @type {Record<Lang, Record<string, string>>} */
export const STRINGS = { en, de };

/** @type {readonly Lang[]} */
export const LANGS = ["en", "de"];

/** @type {Lang} */
let current = "en";

/**
 * Picks the first supported language from the browser's preferences.
 *
 * @param {readonly string[]} preferred e.g. navigator.languages
 * @returns {Lang}
 */
export function detectLanguage(preferred) {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split("-")[0];
    const lang = LANGS.find((l) => l === base);
    if (lang !== undefined) return lang;
  }
  return "en";
}

/** @returns {Lang} */
export function getLanguage() {
  return current;
}

/** @param {Lang} lang */
export function setLanguage(lang) {
  current = lang;
}

/**
 * Translates a key, replacing {placeholders} with params.
 *
 * @param {string} key
 * @param {Record<string, string>} [params]
 * @returns {string}
 */
export function t(key, params = {}) {
  const text = STRINGS[current][key] ?? en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (m, name) => params[name] ?? m);
}

/**
 * Sets an element's text from a translation key and remembers the key, so
 * applyTranslations() can re-translate it. A null key clears the text.
 *
 * @param {HTMLElement} el
 * @param {string | null} key
 * @param {Record<string, string>} [params]
 */
export function setText(el, key, params) {
  if (key === null) {
    delete el.dataset["i18n"];
    delete el.dataset["i18nParams"];
    el.textContent = "";
    return;
  }
  el.dataset["i18n"] = key;
  if (params) el.dataset["i18nParams"] = JSON.stringify(params);
  else delete el.dataset["i18nParams"];
  el.textContent = t(key, params);
}

/**
 * Translates all marked elements below root, and the document language and
 * title.
 *
 * @param {Document} doc
 */
export function applyTranslations(doc) {
  doc.documentElement.lang = current;
  for (const el of doc.querySelectorAll("[data-i18n]")) {
    if (!(el instanceof HTMLElement)) continue;
    const key = el.dataset["i18n"] ?? "";
    const raw = el.dataset["i18nParams"];
    /** @type {Record<string, string> | undefined} */
    const params = raw === undefined ? undefined : JSON.parse(raw);
    el.textContent = t(key, params);
  }
  for (const el of doc.querySelectorAll("[data-i18n-attr]")) {
    for (const pair of (el.getAttribute("data-i18n-attr") ?? "").split(",")) {
      const [attr, key] = pair.split(":");
      if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
    }
  }
}
