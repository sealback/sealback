// SPDX-License-Identifier: Apache-2.0
//
// Loaded as a classic (blocking) script in <head>, before the page is shown.
// The landing page is visible in the static HTML, so that search engines and
// link previews without JavaScript see it. If the URL has a fragment (a view
// or a link with a key), this marks the page so that CSS hides the landing
// page from the first paint, instead of flashing it until main.js has
// selected the view. main.js removes the mark after routing.

if (location.hash.length > 1) document.documentElement.classList.add("routing");
