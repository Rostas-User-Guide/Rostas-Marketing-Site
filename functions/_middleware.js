// 17 Nov 2026 — Show Australian visitors the subscription prices in AU$.
//
// Stripe now charges Australians AU$30 a month / AU$299 a year (currency
// options on the same live prices, licence Worker commit 73f0f5d), but the
// pages are static and say NZ$. Cloudflare knows each visitor's country
// (request.cf.country), so for AU visitors this swaps the subscription
// figures in the page before it is sent. Everyone else gets the file as is.
//
// Only subscription prices change. Text packs are still sold in NZ$, so the
// "12.5c each in New Zealand, from NZ$31.25" sentence stays as written.
// The JSON-LD in <head> describes the NZ offer and is left alone.
//
// _routes.json limits this to the home page and the beta page, so other
// files never run a Function. If the page wording changes and a phrase no
// longer matches, nothing breaks: the page simply shows NZ$ again
// (test/au-prices.test.mjs checks the phrases still match).

export const AU_SWAPS = [
  ["NZ$30 a month", "AU$30 a month"],
  ["NZ$299 a year", "AU$299 a year"],
  ["Saves NZ$61", "Saves AU$61"],
  // beta.html: what Stripe Checkout shows an Australian with the beta code.
  ["NZ$0.00", "A$0.00"],
];

export function toAustralian(html) {
  const cut = html.indexOf("</head>");
  const head = cut === -1 ? "" : html.slice(0, cut);
  let body = cut === -1 ? html : html.slice(cut);
  for (const [from, to] of AU_SWAPS) body = body.split(from).join(to);
  return head + body;
}

export async function onRequest(context) {
  const { request } = context;
  const country = request.cf && request.cf.country;
  if (country !== "AU") return context.next();

  // Ask for the full file, never a 304: this browser may have cached the
  // NZ copy while it was somewhere else.
  const plain = new Request(request);
  plain.headers.delete("If-None-Match");
  plain.headers.delete("If-Modified-Since");
  const res = await context.next(plain);

  const type = res.headers.get("Content-Type") || "";
  if (res.status !== 200 || !type.includes("text/html")) return res;

  const headers = new Headers(res.headers);
  headers.delete("ETag");
  headers.delete("Content-Length");
  headers.set("Cache-Control", "no-cache");
  return new Response(toAustralian(await res.text()), { status: 200, headers });
}
