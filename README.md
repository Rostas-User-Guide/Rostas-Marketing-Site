# Rostas Marketing Site

Marketing / pricing page for `rostas.app`. Deployed via Cloudflare Pages,
auto-deploying from `main`.

## ⚠️ Before you deploy a new export from Claude Design, read this

`index.html` is exported as a single-file "bundler" page. The visible
content is not plain HTML — it's a JSON-encoded string inside a
`<script type="__bundler/template">` tag, parsed at runtime via
`JSON.parse()`. **Every re-export silently drops the hand-written Stripe
checkout script**, because Claude Design's canvas has never heard of it —
it only knows what's in the design itself.

This has broken the pricing page's "Start free trial" / "Subscribe
monthly" / "Subscribe annually" buttons at least twice (9 Aug 2026,
26 Aug 2026). Both times the page looked completely normal — the buttons
just quietly fell back to a `#cta` anchor instead of calling Stripe, with
no visible error.

**The rule:** after every re-export, before deploying, run:

```bash
python3 scripts/splice-checkout.py <fresh-export.html> index.html
```

This re-embeds `scripts/checkout-script.html` into the export, using the
exporter's own JSON-escaping convention, and refuses to write anything if
its checks fail (anchor missing, JSON no longer parses, markers absent,
already-spliced). Read `scripts/splice-checkout.py`'s docstring for the
full explanation and the live-browser check to run after deploying —
**don't skip that step**: confirming the script is present in the file is
not the same as confirming it actually ran in the browser.

If the checkout flow itself needs to change (new plan, different worker
URL, etc.), edit `scripts/checkout-script.html` — that's the one source of
truth, not a copy pasted into the export by hand.

## Where things are

- `index.html` — the deployed page (Claude Design export + spliced-in
  checkout script). This is what Cloudflare Pages serves.
- `sw.js` — kill-switch service worker.
- `scripts/checkout-script.html` — canonical Stripe checkout wiring script.
- `scripts/splice-checkout.py` — re-embeds the above into a fresh export,
  with validation.

## How this deploys

Cloudflare Pages project `rostas` (dashboard → Workers & Pages → rostas)
watches this repo's `main` branch and auto-deploys on push. Domains:
`rostas.app`, `rostas.pages.dev`.

The checkout script calls `POST /api/checkout` on the `rostas-licence`
Cloudflare Worker (`rostas-licence.newsletters-432.workers.dev` — see the
separate `rostas-licence-worker` repo). That worker URL doesn't change
even when the worker's code is redeployed, so the Stripe webhook
destination and this script never need to be touched together.

## History

- **26 Aug 2026** — found the checkout buttons unwired on the live site
  (plain `#cta` anchors, no Stripe call). Traced it to a same-day Claude
  Design re-export (`Downloads/rostas-deploy-ready/index.html`) that
  dropped the script present in an 8 Aug copy. Re-spliced by hand, verified
  live, then wrote `scripts/splice-checkout.py` so this stops being a
  by-hand recovery each time. This repo's GitHub connection to Cloudflare
  Pages was also new as of this session.
