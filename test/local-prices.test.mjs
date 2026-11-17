// 17 Nov 2026 — Tests for functions/_middleware.js (AU$ and US$ prices
// for Australian and US visitors). Run from the repo root: node --test test/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { onRequest, localise, countryFor } from "../functions/_middleware.js";

const home = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const beta = readFileSync(new URL("../beta.html", import.meta.url), "utf8");
const bodyOf = (h) => h.slice(h.indexOf("</head>"));

test("home page: every subscription price in the body becomes AU$", () => {
  const out = bodyOf(localise(home, "AU"));
  for (const p of ["AU$30 a month", "AU$299 a year", "Saves AU$61"]) assert.ok(out.includes(p), p);
  assert.ok(!/NZ\$30 a month|NZ\$299 a year|NZ\$61/.test(out), "an NZ$ subscription price is left");
});

test("home page: text pack prices and the JSON-LD stay NZ", () => {
  const out = localise(home, "AU");
  assert.ok(out.includes("12.5c each in New Zealand, in packs from NZ$31.25"));
  const head = out.slice(0, out.indexOf("</head>"));
  assert.equal(head, home.slice(0, home.indexOf("</head>")));
});

test("beta page: Stripe's NZ$0.00 becomes A$0.00", () => {
  const out = localise(beta, "AU");
  assert.ok(bodyOf(out).includes("A$0.00"));
  assert.ok(!bodyOf(out).includes("NZ$0.00"));
});

function fakeContext(country, { status = 200, type = "text/html; charset=utf-8", body = home } = {}) {
  const seen = {};
  return {
    seen,
    request: Object.assign(new Request("https://rostas.app/", { headers: { "If-None-Match": '"abc"' } }), { cf: { country } }),
    next: async (req) => {
      seen.calledWith = req;
      return new Response(status === 304 ? null : body, { status, headers: { "Content-Type": type, ETag: '"abc"' } });
    },
  };
}

test("NZ and other visitors get the page untouched", async () => {
  for (const c of ["NZ", "GB", undefined]) {
    const ctx = fakeContext(c);
    const res = await onRequest(ctx);
    assert.equal(ctx.seen.calledWith, undefined);
    assert.equal(await res.text(), home);
  }
});

test("Australian visitors get AU$ and never a stale 304", async () => {
  const ctx = fakeContext("AU");
  const res = await onRequest(ctx);
  assert.equal(ctx.seen.calledWith.headers.get("If-None-Match"), null);
  assert.equal(res.headers.get("ETag"), null);
  assert.ok((await res.text()).includes("AU$299 a year"));
});

test("Australian requests for non-HTML or redirects pass through", async () => {
  const redirect = await onRequest(fakeContext("AU", { status: 308 }));
  assert.equal(redirect.status, 308);
  const css = await onRequest(fakeContext("AU", { type: "text/css", body: "NZ$30 a month" }));
  assert.equal(await css.text(), "NZ$30 a month");
});

test("US visitors get US$ on the home and beta pages", async () => {
  const out = bodyOf(localise(home, "US"));
  for (const p of ["US$30 a month", "US$299 a year", "Saves US$61"]) assert.ok(out.includes(p), p);
  assert.ok(!/NZ\$30 a month|NZ\$299 a year|NZ\$61/.test(out));
  assert.ok(bodyOf(localise(beta, "US")).includes("US$0.00"));
  const res = await onRequest(fakeContext("US"));
  assert.ok((await res.text()).includes("US$299 a year"));
});

test("a country Stripe has no currency for is left in NZ$", () => {
  assert.equal(localise(home, "GB"), home);
});

test("?country= works on preview copies only, never on the live site", () => {
  const req = (url, country) => Object.assign(new Request(url), { cf: { country } });
  assert.equal(countryFor(req("https://au-prices.rostas.pages.dev/?country=au", "NZ")), "AU");
  assert.equal(countryFor(req("https://rostas.app/?country=AU", "NZ")), "NZ");
  assert.equal(countryFor(req("https://rostas.pages.dev/?country=AU", "NZ")), "NZ");
  assert.equal(countryFor(req("https://evil.rostas.pages.dev.example.com/?country=AU", "NZ")), "NZ");
  assert.equal(countryFor(req("https://au-prices.rostas.pages.dev/", "US")), "US");
});
