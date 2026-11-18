// SPDX-License-Identifier: Apache-2.0
//
// Shared helpers for the test suites.

import { readFileSync } from "node:fs";

const FIXTURES = new URL("./fixtures/", import.meta.url);

/**
 * @param {string} name
 * @returns {Uint8Array}
 */
export function fixtureBytes(name) {
  return new Uint8Array(readFileSync(new URL(name, FIXTURES)));
}

/**
 * @param {string} name
 * @returns {string}
 */
export function fixtureText(name) {
  return readFileSync(new URL(name, FIXTURES), "utf8");
}

/**
 * The recipient of a plain fixture key file, from its "# public key:" line.
 *
 * @param {"standard" | "pq"} type
 * @returns {string}
 */
export function fixtureRecipient(type) {
  const match = fixtureText(`${type}-key.txt`).match(/^# public key: (\S+)$/m);
  if (!match?.[1]) throw new Error(`no public key in ${type}-key.txt`);
  return match[1];
}
