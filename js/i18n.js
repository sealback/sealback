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
  "app.description":
    "Request confidential information and get it back encrypted, without software, account or server.",
  "app.title": "Sealback – sealed on the way back",
  "app.slogan": "Sealed on the way back",
  "app.home": "Sealback – start over",
  "lang.label": "Language",
  "tabs.label": "Mode",
  "tab.request": "Request",
  "tab.decrypt": "Decrypt",
  "footer.about": "Sealback encrypts in your browser and sends nothing to any server.",
  "footer.source": "Source code",
  "home.title": "Get confidential information back, encrypted",
  "home.intro":
    "Do you need a password, access data or other confidential information from someone? Sealback creates a key and a link for that person. They encrypt the information in their browser, and only your key file can open it again.",
  "home.how.title": "How it works",
  "home.how.1": "Create a key. The key file is saved on your computer, and you get a link.",
  "home.how.2":
    "Send the link to the person who has the information. They encrypt it and email it back to you.",
  "home.how.3": "Open Sealback again, choose “Decrypt information” and open your key file.",
  "home.features.title": "Why Sealback?",
  "home.feature.1": "Nothing leaves your browser",
  "home.feature.1.text":
    "Encryption and decryption happen on your device. Sealback has no server that stores or sees your information.",
  "home.feature.2": "No account, no installation",
  "home.feature.2.text":
    "Works in any modern browser, for you and for the person who sends you the information.",
  "home.feature.3": "Quantum Safe",
  "home.feature.3.text":
    "Optional hybrid encryption with ML-KEM-768 and X25519 protects the information even against future quantum computers.",
  "home.feature.4": "Open standard",
  "home.feature.4.text":
    "Messages use the age encryption format, so they can also be decrypted with the age command-line tool.",
  "home.feature.5": "Open source",
  "home.feature.5.text": "The complete code is public and can be reviewed by anyone.",
  "home.feature.6": "Free and without tracking",
  "home.feature.6.text": "No costs, no ads, no analytics, no cookies.",
  "home.request": "Request information",
  "home.request.hint": "Create a key and a link for the person who has the information.",
  "home.decrypt": "Decrypt information",
  "home.decrypt.hint": "Received encrypted information? Open your key file and decrypt it.",

  "request.title": "Request confidential information",
  "request.intro":
    "Create a key for your request. The key file is saved on your computer, and you get a link for the person who has the information.",
  "request.oneKey":
    "A new key for each request is safest. For recurring exchanges with the same person, you can keep the key and use it again.",
  "request.type.label": "Encryption",
  "request.type.mlkem768x25519": "Quantum Safe (ML-KEM-768 + X25519)",
  "request.type.mlkem768x25519.hint":
    "Recommended. Stays secure even against future quantum computers, so it suits long-lived or highly sensitive information. The link is about 2,000 characters long.",
  "request.type.x25519": "Elliptic curve (X25519)",
  "request.type.x25519.hint":
    "Shorter link (about 100 characters). Secure today, but archived messages could become readable to future quantum computers. Suitable for information that is changed soon after the handover, such as a temporary password.",
  "request.protect.label": "Protect the key file with a passphrase",
  "request.pass.label": "Passphrase",
  "request.pass2.label": "Repeat passphrase",
  "request.pass.hint": "At least 12 characters. Tip: use a few random words.",
  "request.pass.note":
    "If you forget the passphrase, information sent to this key cannot be recovered.",
  "request.nopass.warning":
    "Without a passphrase, anyone who gets hold of the key file can read the information.",
  "request.create": "Create key",
  "request.working": "Creating key …",
  "request.error.passShort": "The passphrase must be at least 12 characters long.",
  "request.error.passMismatch": "The two passphrases do not match.",
  "request.error.failed": "The key could not be created.",
  "request.existing.heading": "Already have a key file?",
  "request.existing.hint":
    "Open a key file you created earlier to show its link again, e.g. for another request to the same person. No new key is created.",
  "request.existing.choose": "Open key file",
  "request.existing.unlock": "Unlock",
  "request.existing.working": "Reading key file …",
  "request.existing.title": "Link for your existing key",
  "request.existing.file": "Key file: {file}",
  "request.done.title": "Your key file has been downloaded",
  "request.done.file": "File name: {file}",
  "request.downloadAgain": "Download key file again",
  "request.link.label": "Link for the sender",
  "request.copyLink": "Copy link",
  "request.compose": "Compose email",
  "request.mailTooLong":
    "The link is too long for an email button. Copy it and paste it into an email.",
  "request.code.label": "Key fingerprint",
  "request.fallback.summary": "If the link doesn't work",
  "request.fallback.text":
    "Some email programs break long links. In that case, send the public key below instead. The sender opens {url} and pastes or loads it there.",
  "request.pubkey.label": "Public key",
  "request.copyPubkey": "Copy public key",
  "request.downloadPubkey": "Download public key",
  "request.steps.title": "Next steps",
  "request.step1": "Send the link to the person who should send you the information.",
  "request.step2":
    "When they read the key fingerprint to you, compare it with the one above. If it is different, ask them not to send the information.",
  "request.step3":
    "Keep the key file and the passphrase. When the information arrives, open “Decrypt”.",
  "request.step4": "Delete the key file when you no longer expect information with it.",
  "request.new": "Create another key",
  "request.mail.subject": "Please send me the information securely",
  "request.mail.body":
    "Hello,\n\nplease send me the information using this link:\n\n{link}\n\nOpen the link, paste the information and click “Encrypt”. Then send me the encrypted text by email.\n\nBefore that, please call me and read me the key fingerprint shown on the page.\n\nThank you!",

  "send.title": "Send confidential information",
  "send.intro":
    "The information is encrypted in your browser before you send it. Only the person who requested it can decrypt it.",
  "send.linkError.title": "This link seems to be damaged.",
  "send.linkError.text":
    "Some email programs break long links. Ask the recipient to send the link again, or paste the complete link or key below.",
  "send.key.label": "Link or public key of the recipient",
  "send.key.hint": "Paste the link or key you received, or load it from a file.",
  "send.key.load": "Load from file",
  "send.protection": "Protection:",
  "send.protection.mlkem768x25519": "Quantum Safe",
  "send.protection.x25519": "Elliptic curve",
  "send.code.label": "Key fingerprint:",
  "send.code.hint":
    "Confirm this fingerprint with the recipient by phone before sending sensitive information.",
  "send.secret.label": "Confidential information",
  "send.encrypt": "Encrypt",
  "send.working": "Encrypting …",
  "send.error.empty": "Please enter the information first.",
  "send.error.failed": "Encryption failed.",
  "send.result.label": "Encrypted text — safe to send by normal email:",
  "send.download": "Download as file",
  "send.mail": "Send by email",
  "send.result.note":
    "Paste the encrypted text into an email, or attach the downloaded file. Only the recipient can decrypt it.",
  "send.bookmark":
    "Tip: once you have confirmed the key fingerprint, bookmark this page. You can then send information to the same recipient again later without a new check.",
  "send.mail.subject": "Encrypted information",
  "send.mail.body":
    "Hello,\n\nhere is the encrypted information. You can decrypt it with your key file at {url}\n\n{ciphertext}",
  "send.howto.summary": "How does this work?",
  "send.howto.p1":
    "Sealback uses age, an open and widely used encryption format. The link contains the recipient's public key. Your information is encrypted with it directly in your browser. Only the recipient's private key file can decrypt it.",
  "send.howto.p2":
    "Quantum Safe keys combine ML-KEM-768 with X25519, so the encrypted text stays protected even against future quantum computers. Elliptic curve keys use X25519 alone.",
  "send.howto.p3":
    "Nothing you enter is sent anywhere. After loading, this page makes no network requests. You decide where the encrypted text goes.",
  "send.ownKey": "Request information yourself →",

  "decrypt.title": "Decrypt information",
  "decrypt.intro":
    "Decrypt the information that was sent to you. Everything happens in your browser.",
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
  "decrypt.result.label": "Decrypted information",
  "decrypt.hide": "Hide",
  "decrypt.reminder.title": "Done? Please clean up:",
  "decrypt.reminder":
    "Store the information where it belongs, e.g. in a password manager. Then delete the email and, if possible, change the information (e.g. the password). Delete the key file when you no longer expect information with it.",
  "decrypt.timeout":
    "For your safety, the decrypted information, the key file and the passphrase were cleared after 10 minutes of inactivity.",

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
  "app.description":
    "Vertrauliche Informationen anfordern und verschlüsselt zurückbekommen, ohne Software, Konto oder Server.",
  "app.title": "Sealback – versiegelt auf dem Rückweg",
  "app.slogan": "Versiegelt auf dem Rückweg",
  "app.home": "Sealback – neu beginnen",
  "lang.label": "Sprache",
  "tabs.label": "Modus",
  "tab.request": "Anfordern",
  "tab.decrypt": "Entschlüsseln",
  "footer.about": "Sealback verschlüsselt in Ihrem Browser und sendet nichts an einen Server.",
  "footer.source": "Quellcode",
  "home.title": "Vertrauliche Informationen verschlüsselt zurückbekommen",
  "home.intro":
    "Sie benötigen von jemandem ein Passwort, Zugangsdaten oder andere vertrauliche Informationen? Sealback erstellt einen Schlüssel und einen Link für diese Person. Sie verschlüsselt die Informationen in ihrem Browser, und nur Ihre Schlüsseldatei kann sie wieder öffnen.",
  "home.how.title": "So funktioniert es",
  "home.how.1":
    "Erstellen Sie einen Schlüssel. Die Schlüsseldatei wird auf Ihrem Computer gespeichert, und Sie erhalten einen Link.",
  "home.how.2":
    "Schicken Sie den Link an die Person, die die Informationen hat. Sie verschlüsselt sie und schickt sie Ihnen per E-Mail zurück.",
  "home.how.3":
    "Öffnen Sie Sealback erneut, wählen Sie „Informationen entschlüsseln“ und öffnen Sie Ihre Schlüsseldatei.",
  "home.features.title": "Warum Sealback?",
  "home.feature.1": "Nichts verlässt Ihren Browser",
  "home.feature.1.text":
    "Ver- und Entschlüsselung finden auf Ihrem Gerät statt. Sealback hat keinen Server, der Ihre Informationen speichert oder sieht.",
  "home.feature.2": "Kein Konto, keine Installation",
  "home.feature.2.text":
    "Funktioniert in jedem aktuellen Browser, für Sie und für die Person, die Ihnen die Informationen schickt.",
  "home.feature.3": "Quantum Safe",
  "home.feature.3.text":
    "Optionale hybride Verschlüsselung mit ML-KEM-768 und X25519 schützt die Informationen auch vor zukünftigen Quantencomputern.",
  "home.feature.4": "Offener Standard",
  "home.feature.4.text":
    "Nachrichten verwenden das Verschlüsselungsformat age und lassen sich daher auch mit dem Kommandozeilenwerkzeug age entschlüsseln.",
  "home.feature.5": "Open Source",
  "home.feature.5.text": "Der gesamte Code ist öffentlich und kann von allen geprüft werden.",
  "home.feature.6": "Kostenlos und ohne Tracking",
  "home.feature.6.text": "Keine Kosten, keine Werbung, keine Analyse, keine Cookies.",
  "home.request": "Informationen anfordern",
  "home.request.hint":
    "Erstellen Sie einen Schlüssel und einen Link für die Person, die die Informationen hat.",
  "home.decrypt": "Informationen entschlüsseln",
  "home.decrypt.hint":
    "Verschlüsselte Informationen erhalten? Öffnen Sie Ihre Schlüsseldatei und entschlüsseln Sie sie.",

  "request.title": "Vertrauliche Informationen anfordern",
  "request.intro":
    "Erstellen Sie einen Schlüssel für Ihre Anfrage. Die Schlüsseldatei wird auf Ihrem Computer gespeichert, und Sie erhalten einen Link für die Person, die die Informationen hat.",
  "request.oneKey":
    "Ein neuer Schlüssel für jede Anfrage ist am sichersten. Bei wiederkehrendem Austausch mit derselben Person können Sie den Schlüssel behalten und erneut verwenden.",
  "request.type.label": "Verschlüsselung",
  "request.type.mlkem768x25519": "Quantum Safe (ML-KEM-768 + X25519)",
  "request.type.mlkem768x25519.hint":
    "Empfohlen. Bleibt auch gegen zukünftige Quantencomputer sicher und eignet sich daher für langlebige oder besonders sensible Informationen. Der Link ist etwa 2.000 Zeichen lang.",
  "request.type.x25519": "Elliptische Kurven (X25519)",
  "request.type.x25519.hint":
    "Kürzerer Link (etwa 100 Zeichen). Heute sicher, aber archivierte Nachrichten könnten für zukünftige Quantencomputer lesbar werden. Geeignet für Informationen, die bald nach der Übergabe geändert werden, z. B. ein vorläufiges Passwort.",
  "request.protect.label": "Schlüsseldatei mit einer Passphrase schützen",
  "request.pass.label": "Passphrase",
  "request.pass2.label": "Passphrase wiederholen",
  "request.pass.hint": "Mindestens 12 Zeichen. Tipp: Verwenden Sie einige zufällige Wörter.",
  "request.pass.note":
    "Wenn Sie die Passphrase vergessen, lassen sich Informationen, die an diesen Schlüssel gesendet wurden, nicht mehr entschlüsseln.",
  "request.nopass.warning":
    "Ohne Passphrase kann jeder, der an die Schlüsseldatei kommt, die Informationen lesen.",
  "request.create": "Schlüssel erstellen",
  "request.working": "Schlüssel wird erstellt …",
  "request.error.passShort": "Die Passphrase muss mindestens 12 Zeichen lang sein.",
  "request.error.passMismatch": "Die beiden Passphrasen stimmen nicht überein.",
  "request.error.failed": "Der Schlüssel konnte nicht erstellt werden.",
  "request.existing.heading": "Sie haben schon eine Schlüsseldatei?",
  "request.existing.hint":
    "Öffnen Sie eine früher erstellte Schlüsseldatei, um ihren Link erneut anzuzeigen, z. B. für eine weitere Anfrage an dieselbe Person. Es wird kein neuer Schlüssel erstellt.",
  "request.existing.choose": "Schlüsseldatei öffnen",
  "request.existing.unlock": "Entsperren",
  "request.existing.working": "Schlüsseldatei wird gelesen …",
  "request.existing.title": "Link für Ihren vorhandenen Schlüssel",
  "request.existing.file": "Schlüsseldatei: {file}",
  "request.done.title": "Ihre Schlüsseldatei wurde heruntergeladen",
  "request.done.file": "Dateiname: {file}",
  "request.downloadAgain": "Schlüsseldatei erneut herunterladen",
  "request.link.label": "Link für den Absender",
  "request.copyLink": "Link kopieren",
  "request.compose": "E-Mail verfassen",
  "request.mailTooLong":
    "Der Link ist zu lang für eine E-Mail-Schaltfläche. Kopieren Sie ihn und fügen Sie ihn in eine E-Mail ein.",
  "request.code.label": "Schlüssel-Fingerabdruck",
  "request.fallback.summary": "Falls der Link nicht funktioniert",
  "request.fallback.text":
    "Manche E-Mail-Programme zerstören lange Links. Schicken Sie dann stattdessen den öffentlichen Schlüssel unten. Der Absender öffnet {url} und fügt ihn dort ein oder lädt ihn.",
  "request.pubkey.label": "Öffentlicher Schlüssel",
  "request.copyPubkey": "Öffentlichen Schlüssel kopieren",
  "request.downloadPubkey": "Öffentlichen Schlüssel herunterladen",
  "request.steps.title": "Nächste Schritte",
  "request.step1": "Schicken Sie den Link an die Person, die Ihnen die Informationen senden soll.",
  "request.step2":
    "Wenn sie Ihnen den Schlüssel-Fingerabdruck vorliest, vergleichen Sie ihn mit dem oben. Weicht er ab, bitten Sie darum, die Informationen nicht zu senden.",
  "request.step3":
    "Bewahren Sie Schlüsseldatei und Passphrase auf. Wenn die Informationen ankommen, öffnen Sie „Entschlüsseln“.",
  "request.step4":
    "Löschen Sie die Schlüsseldatei, wenn Sie damit keine Informationen mehr erwarten.",
  "request.new": "Weiteren Schlüssel erstellen",
  "request.mail.subject": "Bitte schicken Sie mir die Informationen sicher",
  "request.mail.body":
    "Hallo,\n\nbitte schicken Sie mir die Informationen über diesen Link:\n\n{link}\n\nÖffnen Sie den Link, fügen Sie die Informationen ein und klicken Sie auf „Verschlüsseln“. Schicken Sie mir dann den verschlüsselten Text per E-Mail.\n\nBitte rufen Sie mich vorher an und lesen Sie mir den Schlüssel-Fingerabdruck vor, der auf der Seite angezeigt wird.\n\nVielen Dank!",

  "send.title": "Vertrauliche Informationen senden",
  "send.intro":
    "Die Informationen werden in Ihrem Browser verschlüsselt, bevor Sie sie senden. Nur die Person, die sie angefordert hat, kann sie entschlüsseln.",
  "send.linkError.title": "Dieser Link scheint beschädigt zu sein.",
  "send.linkError.text":
    "Manche E-Mail-Programme zerstören lange Links. Bitten Sie den Empfänger, den Link erneut zu schicken, oder fügen Sie den vollständigen Link oder Schlüssel unten ein.",
  "send.key.label": "Link oder öffentlicher Schlüssel des Empfängers",
  "send.key.hint":
    "Fügen Sie den erhaltenen Link oder Schlüssel ein, oder laden Sie ihn aus einer Datei.",
  "send.key.load": "Aus Datei laden",
  "send.protection": "Schutz:",
  "send.protection.mlkem768x25519": "Quantum Safe",
  "send.protection.x25519": "Elliptische Kurven",
  "send.code.label": "Schlüssel-Fingerabdruck:",
  "send.code.hint":
    "Bestätigen Sie diesen Fingerabdruck telefonisch mit dem Empfänger, bevor Sie sensible Informationen senden.",
  "send.secret.label": "Vertrauliche Informationen",
  "send.encrypt": "Verschlüsseln",
  "send.working": "Wird verschlüsselt …",
  "send.error.empty": "Bitte geben Sie zuerst die Informationen ein.",
  "send.error.failed": "Die Verschlüsselung ist fehlgeschlagen.",
  "send.result.label": "Verschlüsselter Text – kann per normaler E-Mail verschickt werden:",
  "send.download": "Als Datei herunterladen",
  "send.mail": "Per E-Mail senden",
  "send.result.note":
    "Fügen Sie den verschlüsselten Text in eine E-Mail ein, oder hängen Sie die heruntergeladene Datei an. Nur der Empfänger kann ihn entschlüsseln.",
  "send.bookmark":
    "Tipp: Wenn Sie den Schlüssel-Fingerabdruck bestätigt haben, setzen Sie ein Lesezeichen für diese Seite. Dann können Sie später erneut Informationen an denselben Empfänger senden, ohne erneute Prüfung.",
  "send.mail.subject": "Verschlüsselte Informationen",
  "send.mail.body":
    "Hallo,\n\nhier sind die verschlüsselten Informationen. Sie können sie mit Ihrer Schlüsseldatei unter {url} entschlüsseln.\n\n{ciphertext}",
  "send.howto.summary": "Wie funktioniert das?",
  "send.howto.p1":
    "Sealback verwendet age, ein offenes und verbreitetes Verschlüsselungsformat. Der Link enthält den öffentlichen Schlüssel des Empfängers. Damit werden Ihre Informationen direkt in Ihrem Browser verschlüsselt. Nur die private Schlüsseldatei des Empfängers kann sie entschlüsseln.",
  "send.howto.p2":
    "Quantum-Safe-Schlüssel kombinieren ML-KEM-768 mit X25519, sodass der verschlüsselte Text auch gegen zukünftige Quantencomputer geschützt bleibt. Schlüssel mit elliptischen Kurven verwenden nur X25519.",
  "send.howto.p3":
    "Nichts, was Sie eingeben, wird irgendwohin gesendet. Nach dem Laden stellt diese Seite keine Netzwerkanfragen. Sie entscheiden, wohin der verschlüsselte Text geht.",
  "send.ownKey": "Selbst Informationen anfordern →",

  "decrypt.title": "Informationen entschlüsseln",
  "decrypt.intro":
    "Entschlüsseln Sie die Informationen, die Ihnen geschickt wurden. Alles geschieht in Ihrem Browser.",
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
  "decrypt.result.label": "Entschlüsselte Informationen",
  "decrypt.hide": "Ausblenden",
  "decrypt.reminder.title": "Fertig? Bitte aufräumen:",
  "decrypt.reminder":
    "Speichern Sie die Informationen dort, wo sie hingehören, z. B. in einem Passwortmanager. Löschen Sie dann die E-Mail und ändern Sie die Informationen, wenn möglich (z. B. das Passwort). Löschen Sie die Schlüsseldatei, wenn Sie damit keine Informationen mehr erwarten.",
  "decrypt.timeout":
    "Zu Ihrer Sicherheit wurden die entschlüsselten Informationen, die Schlüsseldatei und die Passphrase nach 10 Minuten ohne Aktivität entfernt.",

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
