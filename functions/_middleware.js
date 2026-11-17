// 17 Nov 2026 — Show Australian and US visitors the subscription prices in
// their own currency.
//
// Stripe now charges Australians AU$30 a month / AU$299 a year and US
// customers US$30 / US$299 (currency options on the same live prices,
// licence Worker commit 73f0f5d), but the pages are static and say NZ$.
// Cloudflare knows each visitor's country (request.cf.country), so for those
// countries this swaps the subscription figures in the page before it is
// sent. Everyone else gets the file as is, because Stripe charges them NZD.
// Add a country here only once Stripe has that currency on the prices.
//
// Only subscription prices change. Text packs are still sold in NZ$, so the
// "12.5c each in New Zealand, from NZ$31.25" sentence stays as written.
// The JSON-LD in <head> describes the NZ offer and is left alone.
//
// _routes.json limits this to the home page and the beta page, so other
// files never run a Function. If the page wording changes and a phrase no
// longer matches, nothing breaks: the page simply shows NZ$ again
// (test/local-prices.test.mjs checks the phrases still match).

function swapsFor(symbol, zero) {
  return [
    ["NZ$30 a month", symbol + "30 a month"],
    ["NZ$299 a year", symbol + "299 a year"],
    ["Saves NZ$61", "Saves " + symbol + "61"],
    // beta.html: what Stripe Checkout shows with the beta code.
    ["NZ$0.00", zero],
  ];
}

export const SWAPS = {
  AU: swapsFor("AU$", "A$0.00"),
  US: swapsFor("US$", "US$0.00"),
};

export function localise(html, country) {
  const swaps = SWAPS[country];
  if (!swaps) return html;
  const cut = html.indexOf("</head>");
  const head = cut === -1 ? "" : html.slice(0, cut);
  let body = cut === -1 ? html : html.slice(cut);
  for (const [from, to] of swaps) body = body.split(from).join(to);
  return head + body;
}

export async function onRequest(context) {
  const { request } = context;
  const country = request.cf && request.cf.country;
  if (!SWAPS[country]) return context.next();

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
  return new Response(localise(await res.text(), country), { status: 200, headers });
}
