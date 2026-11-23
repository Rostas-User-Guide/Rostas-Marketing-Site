// 23 Nov 2026 (bug hunt S3): Stripe sends coordinators back to rostas.app
// pages chosen by the licence Worker and Apps Script. /account and /pricing
// were 404s. The licence Worker's test/returnUrls.test.mjs keeps its
// fallbacks to this list; Apps Script (Phase15 settings.js) falls back to
// /account. Each must be a real page here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const pages = ["/", "/welcome", "/account", "/recover", "/beta", "/terms", "/privacy", "/guide"];

test("S3: every page Stripe can send a coordinator back to exists", () => {
  for (const p of pages) {
    const file = p === "/" ? "index.html" : p.slice(1) + ".html";
    assert.ok(existsSync(new URL("../" + file, import.meta.url)), file);
  }
});

test("S3: the account page tells them where to go next, and is kept out of search", () => {
  const html = readFileSync(new URL("../account.html", import.meta.url), "utf8");
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(html, /close this tab and go back to your Rostas spreadsheet/);
  assert.match(html, /info@rostas\.app/);
});
