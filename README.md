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

The same step also makes the page readable before it unpacks (added
12 Oct 2026). A Claude Design export is a small outer page that unpacks the
real page with a script; until then it carries only a title and
"Unpacking...". The splice now copies the title, description, sharing tags
and structured data into the outer page, adds a canonical link and sharing
picture to both, and adds a plain-text summary (built from the real page's
own headline, intro and section headings) for readers that don't run
scripts. Nothing to do by hand: it is rebuilt from each export.

The Action also runs when anything in `scripts/` changes, so a change to
the popup wording or the splice rebuilds `index.html` from the export
already here.

### Plain HTML (added 22 Oct 2026)

After splicing, the Action runs `scripts/prerender.py`. It opens the
spliced page in a headless Chromium, lets it unpack and draw itself, and
saves what it drew as ordinary HTML: `index.html` (about 60 KB, every word
readable by search engines) plus content-named files in `assets/`
(pictures, fonts, scripts, styles). React's code is saved already compiled,
so the in-browser Babel compiler is no longer downloaded, and React's
development build is swapped for the production build kept in
`scripts/vendor/` (same version; if a future export uses another React
version the Action warns and keeps the development build until the
matching files are added there). `_headers` lets browsers keep
`assets/` files for a year; a changed file always gets a new name.

prerender.py checks its own result in Chromium (no script errors, headline
and demos drawn, three pricing buttons wired, Babel gone) and
`scripts/test_seo.py` checks the committed page; if either fails the
Action stops and the site keeps the previous page. The Action runs on
every branch, so pushing a branch gives a Cloudflare preview
(`<branch>.rostas.pages.dev`) of the finished page.

Nothing changes for an export: upload `raw-export.html` as before.
Don't hand-edit `index.html` or `assets/`.

**Still verify live after every deploy** — see the "After deploying"
check below. Automation prevents the *forgetting* failure mode; it
doesn't replace looking at the real site.

### Running it by hand (fallback, or local testing)

```bash
python3 scripts/splice-checkout.py raw-export.html /tmp/spliced.html
python3 scripts/prerender.py /tmp/spliced.html .   # needs Playwright + Chromium
python3 scripts/test_seo.py
```

Same scripts the Action runs. Useful if you want to check the output
before pushing, or if the Action itself needs debugging. Since 22 Oct 2026
penguin can run the second step too: the Python packages are installed in
`~/.venvs/pyw` (not system-wide), so put `export PYTHONPATH=~/.venvs/pyw`
first and write to a scratch folder, not `.` (the Action builds the
committed `index.html`).

### Readable colours and heading order (added 22 Oct 2026)

`prerender.py` also adds a small style block (`READABLE_CSS`) that makes
small gold text and gold buttons the darker gold `#8a6d1c` (the volunteer
app's rule: bright gold `#b8932a` is for lines and icons only), darkens a
few greys, and turns the footer's headings into `h3`. Its check then runs
Lighthouse's own colour-contrast and heading-order checks (axe-core, in
`scripts/vendor/`) at desktop and phone size; if an export brings a
problem back, the Action stops and names the element. Change those
colours in `prerender.py`, not on the Claude Design canvas. The guides,
beta and welcome pages use the same golds (`guides/guides.css`
`--gold-fill` / `--gold-dark`).

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
Array.from(document.querySelectorAll('#pricing a.btn, #pricing button.btn'))
  .map(el => el.textContent.trim() + ' = ' + el.getAttribute('data-rostas-wired'))
```

It lists every button in the pricing section. There should be three, and
all three should end `= 1`. If any ends `= null`, something's still wrong
on the deployed copy even if the Action succeeded — check you're not
looking at a cached response.

**Button wording the script recognises** (exact text, any capitals, no
icon inside the button): "Join the beta" (pricing section only — always
opens the beta message, never a checkout), "Start free trial", "Subscribe
monthly", "Subscribe annually". If Claude Design gives a pricing button
any other wording, or adds an icon to it, add that wording to
`BUTTON_MATCHERS` in `scripts/checkout-script.html` **before** uploading
the export.

Since 10 Oct 2026 the splice step checks this itself. It lists every
button in the export's pricing section and stops, without touching
`index.html`, if any of them carries a wording the script does not
recognise. The site keeps serving the previous page and the failed run's
log names the button. (`--allow-unwired-buttons` on the command line
turns the stop into a warning, for a pricing-section button that is
meant to be an ordinary link.)

## Where things are

- `raw-export.html` — the current Claude Design export, **before**
  splicing. This is the file you replace with a new export.
- `index.html` — the deployed page (raw export + spliced-in checkout
  script), generated automatically by CI. This is what Cloudflare Pages
  serves. Don't hand-edit this file directly — edits will be overwritten
  the next time `raw-export.html` changes; edit `raw-export.html` (via a
  fresh Claude Design export) or `scripts/checkout-script.html` instead.
- `sw.js` — kill-switch service worker.
- `privacy.html`, `terms.html` — the Privacy Policy and Terms of Service,
  served at `/privacy` and `/terms`. Plain hand-written pages, outside the
  Claude Design export, styled by `guides/guides.css`. If the data
  handling in the Workers or the app changes, the privacy page must
  change with it.
- `guides/` — the free guides hub and articles, plus the shared
  stylesheet `guides.css`.
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
- **12 Oct 2026** — a search for "Rostas" was listing the volunteer app
  (`mobile.rostas.app`) above this site. Two fixes: the app now sends
  `X-Robots-Tag: noindex` (in the MobileRostas repo), and
  `scripts/splice-checkout.py` gained `add_search_tags()` so the outer page
  carries a description, canonical link, sharing tags, structured data and
  a plain-text summary before it unpacks. The workflow now also triggers on
  `scripts/**`.
- **22 Oct 2026** — SEO quick fixes (`Handover_SEOReview_22Oct2026.md` in
  knox-gas-mirror). `404.html` added (before it, every unknown address
  returned the home page with 200). Site icon files `favicon.ico`,
  `favicon.png`, `apple-touch-icon.png` (from the logo packed in the
  export) and an icon link on every page. `splice-checkout.py` gained
  `apply_seo_overrides()`: it sets the search title (`SEO_TITLE`),
  `twitter:card` summary_large_image and the real prices in the structured
  data (`SEO_OFFERS`) on every export, whatever Claude Design wrote, so
  **change the title or prices there, not on the canvas.** If prices
  change, update `SEO_OFFERS` along with `terms.html`.
  Test: `python3 scripts/test_seo.py`.
