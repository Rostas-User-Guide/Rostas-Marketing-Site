// 23 Nov 2026 (bug hunt S7): the repo's working files are no longer served.
// Run from the repo root: node --test test/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { onRequest, isHidden } from "../functions/_middleware.js";

const routes = JSON.parse(readFileSync(new URL("../_routes.json", import.meta.url), "utf8"));
const page404 = readFileSync(new URL("../404.html", import.meta.url), "utf8");

// The same matching Cloudflare uses for _routes.json: exact, or "/x/*".
function routed(path) {
  return routes.include.some((r) => r.endsWith("/*") ? path.startsWith(r.slice(0, -1)) : path === r);
}
function ctxFor(url, country = "NZ") {
  const seen = { next: 0 };
  return {
    seen,
    request: Object.assign(new Request(url), { cf: { country } }),
    env: { ASSETS: { fetch: async (u) => { seen.asset = String(u); return new Response(page404, { status: 200, headers: { "Content-Type": "text/html" } }); } } },
    next: async () => { seen.next++; return new Response("FILE CONTENTS", { status: 200, headers: { "Content-Type": "text/plain" } }); },
  };
}

const SECRET_PATHS = [
  "/README.md", "/raw-export", "/raw-export.html",
  "/scripts/prerender.py", "/scripts/test_seo.py", "/scripts/checkout-script", "/scripts/vendor/x.js",
  "/test/local-prices.test.mjs", "/.github/workflows/splice-checkout.yml", "/functions/_middleware.js",
];

test("S7: build scripts, tests, the Action, README and raw-export get the 404 page, never the file", async () => {
  for (const path of SECRET_PATHS) {
    assert.ok(routed(path), "_routes.json sends " + path + " to the Function");
    const ctx = ctxFor("https://rostas.app" + path, "AU");
    const res = await onRequest(ctx);
    assert.equal(res.status, 404, path);
    assert.equal(res.headers.get("X-Robots-Tag"), "noindex", path);
    assert.equal(ctx.seen.next, 0, path + " was served");
    assert.match(await res.text(), /We couldn't find that page/, path);
  }
});

test("S7: every file in scripts/, test/ and .github/ is routed and hidden", () => {
  const walk = (dir) => readdirSync(new URL("../" + dir, import.meta.url)).flatMap((n) => {
    const rel = dir + "/" + n;
    return statSync(new URL("../" + rel, import.meta.url)).isDirectory() ? walk(rel) : [rel];
  });
  for (const f of [...walk("scripts"), ...walk("test"), ...walk(".github")]) {
    const path = "/" + f;
    assert.ok(routed(path) && isHidden(path), path);
  }
});

test("S7: real pages are untouched", () => {
  for (const p of ["/", "/index.html", "/beta", "/terms", "/privacy", "/guides/", "/guides/guides.css",
    "/assets/app.js", "/recover", "/welcome", "/account", "/llms.txt", "/robots.txt", "/scriptsx", "/testimonials"]) {
    assert.equal(isHidden(p), false, p);
  }
});

test("S7: an encoded path cannot slip past", () => {
  assert.equal(isHidden("/%73cripts/prerender.py"), true);
  assert.equal(isHidden("/raw%2Dexport"), true);
});

test("S7: if the 404 page can't be fetched, still a plain 404", async () => {
  const ctx = ctxFor("https://rostas.app/README.md");
  ctx.env.ASSETS.fetch = async () => { throw new Error("no assets"); };
  const res = await onRequest(ctx);
  assert.equal(res.status, 404);
  assert.equal(ctx.seen.next, 0);
});
