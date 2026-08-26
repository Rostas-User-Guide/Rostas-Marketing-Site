# Rostas Marketing Site

Marketing / pricing page for `rostas.app`. Deployed via Cloudflare Pages,
auto-deploying from `main`.

## The workflow (automated as of 26 Aug 2026)

1. Export the page from Claude Design.
2. Commit that export as **`raw-export.html`** in this repo's root
   (overwrite the existing one) and push to `main` — or just use GitHub's
   web "Upload files" / "Edit" button on `raw-export.html` if that's
   easier than git.
3. That's it. A GitHub Action (`.github/workflows/splice-checkout.yml`)
   automatically runs `scripts/splice-checkout.py`, re-embeds the Stripe
   checkout script, and commits the result as `index.html` — the file
   Cloudflare Pages actually serves. Cloudflare then redeploys on that
   commit, same as always.

If the splice step fails for any reason (see "Why this exists" below),
the Action fails loudly and never touches `index.html` — the site keeps
serving whatever was live before, rather than going out broken. Check the
failed run's log under the repo's **Actions** tab for what went wrong.

**Still verify live after every deploy** — see the "After deploying"
check below. Automation prevents the *forgetting* failure mode; it
doesn't replace looking at the real site.

### Running it by hand (fallback, or local testing)

```bash
python3 scripts/splice-checkout.py raw-export.html index.html
```

Same script the Action runs. Useful if you want to check the output
before pushing, or if the Action itself needs debugging.

## Why this exists

`index.html` is exported from Claude Design as a single-file "bundler"
page. The visible content is not plain HTML — it's a JSON-encoded string
inside a `<script type="__bundler/template">` tag, parsed at runtime via
`JSON.parse()`. **A raw export from Claude Design always drops the
hand-written Stripe checkout script**, because Claude Design's canvas has
never heard of it — it only knows what's in the design itself.

This broke the pricing page's "Start free trial" / "Subscribe monthly" /
"Subscribe annually" buttons at least twice before this was automated
(9 Aug 2026, 26 Aug 2026). Both times the page looked completely normal —
the buttons just quietly fell back to a `#cta` anchor instead of calling
Stripe, with no visible error. That silent-failure mode, not just the
manual step being tedious, is why this is now a required, self-checking
CI step rather than a step someone has to remember.

If the checkout flow itself needs to change (new plan, different worker
URL, etc.), edit `scripts/checkout-script.html` — that's the one source
of truth, not a copy pasted into an export by hand.

## After deploying: verify live

Paste into the browser console on `rostas.app` (a real deploy takes a
minute or two to propagate):

```js
Array.from(document.querySelectorAll('a.btn,button.btn'))
  .filter(el => /start free trial|subscribe monthly|subscribe annually/i
    .test(el.textContent.trim()))
  .map(el => el.getAttribute('data-rostas-wired'))
```

All three should print `"1"`. If any is `null`, something's still wrong
on the deployed copy even if the Action succeeded — check you're not
looking at a cached response.

## Where things are

- `raw-export.html` — the current Claude Design export, **before**
  splicing. This is the file you replace with a new export.
- `index.html` — the deployed page (raw export + spliced-in checkout
  script), generated automatically by CI. This is what Cloudflare Pages
  serves. Don't hand-edit this file directly — edits will be overwritten
  the next time `raw-export.html` changes; edit `raw-export.html` (via a
  fresh Claude Design export) or `scripts/checkout-script.html` instead.
- `sw.js` — kill-switch service worker.
- `scripts/checkout-script.html` — canonical Stripe checkout wiring script.
- `scripts/splice-checkout.py` — re-embeds the above into a fresh export,
  with validation.
- `.github/workflows/splice-checkout.yml` — runs the above automatically
  on every push to `raw-export.html`.

## How this deploys

Cloudflare Pages project `rostas` (dashboard → Workers & Pages → rostas)
watches this repo's `main` branch and auto-deploys on push — including
the Action's own auto-splice commits. Domains: `rostas.app`,
`rostas.pages.dev`.

The checkout script calls `POST /api/checkout` on the `rostas-licence`
Cloudflare Worker (`rostas-licence.newsletters-432.workers.dev` — see the
separate `rostas-licence-worker` repo). That worker URL doesn't change
even when the worker's code is redeployed, so the Stripe webhook
destination and this script never need to be touched together.

## History

- **26 Aug 2026** — found the checkout buttons unwired on the live site
  (plain `#cta` anchors, no Stripe call). Traced it to a same-day Claude
  Design re-export (`Downloads/rostas-deploy-ready/index.html`) that
  dropped the script present in an 8 Aug copy. Re-spliced by hand,
  verified live, then wrote `scripts/splice-checkout.py` so this stops
  being a by-hand recovery each time. This repo's GitHub connection to
  Cloudflare Pages was also new as of this session.
- **26 Aug 2026 (later same day)** — added the "Roster Assistant" caption
  under the hero logo (width-matched to it, per the brand explainer work
  in the main Rostas project), and automated the splice step itself with
  `.github/workflows/splice-checkout.yml` — so a forgotten manual step
  can't cause a repeat of the above.
