// SPDX-License-Identifier: Apache-2.0
//
// Entry point: language, fragment routing, tabs.

import { LANGS, applyTranslations, detectLanguage, getLanguage, setLanguage } from "./i18n.js";
import { TABS, parseFragment } from "./link.js";
import { byId, show } from "./ui.js";
import * as decrypt from "./view-decrypt.js";
import * as receive from "./view-receive.js";
import * as send from "./view-send.js";

/** @typedef {import("./link.js").Tab} Tab */

const views = { receive, send, decrypt };

/** @type {{ panel: Tab, link: boolean } | null} */
let active = null;

const tablist = byId("tabs", HTMLDivElement);

/** @param {Tab} tab */
function tabButton(tab) {
  return byId(`tab-${tab}`, HTMLButtonElement);
}

/**
 * Shows a panel and clears the secrets of the one being left.
 *
 * @param {Tab} panel
 * @param {boolean} link link mode (send view without tabs)
 */
function activate(panel, link) {
  if (active !== null && (active.panel !== panel || active.link !== link)) {
    views[active.panel].clear();
  }
  active = { panel, link };
  show(tablist, !link);
  for (const tab of TABS) {
    const selected = tab === panel;
    const button = tabButton(tab);
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    show(byId(`panel-${tab}`, HTMLElement), selected);
  }
}

function route() {
  const r = parseFragment(location.hash);
  if (r.mode === "link") {
    activate("send", true);
    send.showLink(r);
  } else {
    activate(r.tab, false);
    if (r.tab === "send") send.showTab();
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
