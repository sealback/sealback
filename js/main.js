// SPDX-License-Identifier: Apache-2.0
//
// Entry point: language, fragment routing, tabs.
//
// The receiver uses two tabs, "Receive" and "Decrypt". The send view is the
// sender's page: it is reached only through a link (#pubkey=…) or the
// fallback address #send, and is shown without tabs.

import { LANGS, applyTranslations, detectLanguage, getLanguage, setLanguage } from "./i18n.js";
import { VIEWS, parseFragment } from "./link.js";
import { byId, show } from "./ui.js";
import * as decrypt from "./view-decrypt.js";
import * as receive from "./view-receive.js";
import * as send from "./view-send.js";

/** @typedef {import("./link.js").View} View */
/** @typedef {"receive" | "decrypt"} Tab */

const views = { receive, send, decrypt };

/** @type {readonly Tab[]} */
const TABS = ["receive", "decrypt"];

/** @type {View | null} */
let active = null;

const tablist = byId("tabs", HTMLDivElement);

/** @param {Tab} tab */
function tabButton(tab) {
  return byId(`tab-${tab}`, HTMLButtonElement);
}

/**
 * Shows a view and clears the secrets of the one being left.
 *
 * @param {View} view
 */
function activate(view) {
  if (active !== null && active !== view) views[active].clear();
  active = view;
  show(tablist, view !== "send");
  for (const tab of TABS) {
    const selected = tab === view;
    const button = tabButton(tab);
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  }
  for (const v of VIEWS) show(byId(`panel-${v}`, HTMLElement), v === view);
}

function route() {
  const r = parseFragment(location.hash);
  if (r.mode === "link") {
    activate("send");
    send.showLink(r);
  } else {
    activate(r.view);
    if (r.view === "send") send.showManual();
  }
}

function initTabs() {
  for (const tab of TABS) {
    tabButton(tab).addEventListener("click", () => {
      location.hash = tab;
    });
  }
  tablist.addEventListener("keydown", (ev) => {
    const index = TABS.findIndex((tab) => tabButton(tab) === document.activeElement);
    if (index === -1) return;
    /** @type {Record<string, number>} */
    const moves = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: TABS.length - 1 };
    const target = moves[ev.key];
    if (target === undefined) return;
    ev.preventDefault();
    const tab = /** @type {Tab} */ (TABS[(target + TABS.length) % TABS.length]);
    tabButton(tab).focus();
    location.hash = tab;
  });
}

function updateLanguage() {
  applyTranslations(document);
  for (const button of document.querySelectorAll("[data-lang]")) {
    button.setAttribute("aria-pressed", String(button.getAttribute("data-lang") === getLanguage()));
  }
  for (const view of Object.values(views)) view.refresh();
}

function initLanguage() {
  setLanguage(detectLanguage(navigator.languages.length > 0 ? navigator.languages : [navigator.language]));
  for (const button of document.querySelectorAll("[data-lang]")) {
    button.addEventListener("click", () => {
      const lang = LANGS.find((l) => l === button.getAttribute("data-lang"));
      if (lang === undefined) return;
      setLanguage(lang);
      updateLanguage();
    });
  }
  updateLanguage();
}

// Dropping a file outside a drop zone must not navigate away from the page.
for (const type of ["dragover", "drop"]) {
  window.addEventListener(type, (ev) => ev.preventDefault());
}

receive.init();
send.init();
decrypt.init();
initTabs();
initLanguage();
route();
window.addEventListener("hashchange", route);
window.addEventListener("pagehide", () => {
  for (const view of Object.values(views)) view.clear();
});
