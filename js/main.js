// SPDX-License-Identifier: Apache-2.0
//
// Entry point: language, fragment routing, tabs.
//
// The landing page (empty fragment) explains Sealback and leads to the
// recipient's two views, "Request" and "Decrypt", which are shown with tabs.
// The send view is the sender's page: it is reached only through a link
// (#pubkey=…) or the fallback address #send, and is shown without tabs.

import { LANGS, applyTranslations, detectLanguage, getLanguage, setLanguage } from "./i18n.js";
import { parseFragment } from "./link.js";
import { byId, show } from "./ui.js";
import * as decrypt from "./view-decrypt.js";
import * as request from "./view-request.js";
import * as send from "./view-send.js";

/** @typedef {import("./link.js").View} View */
/** @typedef {"request" | "decrypt"} Tab */

/** The landing page has no state. */
const home = { clear() {}, reset() {}, refresh() {} };

const views = { home, request, send, decrypt };

/** @type {readonly View[]} */
const PANELS = ["home", "request", "send", "decrypt"];

/** @type {readonly Tab[]} */
const TABS = ["request", "decrypt"];

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
  show(tablist, view === "request" || view === "decrypt");
  for (const tab of TABS) {
    const selected = tab === view;
    const button = tabButton(tab);
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  }
  for (const v of PANELS) show(byId(`panel-${v}`, HTMLElement), v === view);
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

const langSelect = byId("lang", HTMLSelectElement);

function updateLanguage() {
  applyTranslations(document);
  langSelect.value = getLanguage();
  for (const view of Object.values(views)) view.refresh();
}

function initLanguage() {
  setLanguage(
    detectLanguage(navigator.languages.length > 0 ? navigator.languages : [navigator.language]),
  );
  langSelect.addEventListener("change", () => {
    const lang = LANGS.find((l) => l === langSelect.value);
    if (lang === undefined) return;
    setLanguage(lang);
    updateLanguage();
  });
  updateLanguage();
}

// Dropping a file outside a drop zone must not navigate away from the page.
for (const type of ["dragover", "drop"]) {
  window.addEventListener(type, (ev) => ev.preventDefault());
}

request.init();
send.init();
decrypt.init();
initTabs();
initLanguage();
route();
window.addEventListener("hashchange", route);

// The logo leads to the landing page and discards all state, like a fresh
// page load, but without reloading, so the chosen language is kept. Its
// href "./" still works for opening in a new tab.
document.querySelector(".brand")?.addEventListener("click", (ev) => {
  if (
    !(ev instanceof MouseEvent) ||
    ev.button !== 0 ||
    ev.ctrlKey ||
    ev.metaKey ||
    ev.shiftKey ||
    ev.altKey
  ) {
    return;
  }
  ev.preventDefault();
  for (const view of Object.values(views)) view.reset();
  if (location.hash !== "") history.pushState(null, "", location.pathname + location.search);
  route();
  scrollTo(0, 0);
});
window.addEventListener("pagehide", () => {
  for (const view of Object.values(views)) view.clear();
});
