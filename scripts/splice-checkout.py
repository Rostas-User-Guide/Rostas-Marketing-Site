#!/usr/bin/env python3
"""
splice-checkout.py -- re-embed the hand-written Stripe checkout script into
a fresh Claude Design export of the Rostas marketing site.

WHY THIS EXISTS
---------------
index.html is exported from Claude Design as a single-file "bundler" page.
The real page content is NOT plain HTML -- it's a JSON-encoded string sitting
inside a <script type="__bundler/template"> tag, parsed at runtime via
JSON.parse(). Every time this file is re-exported, any hand-appended script
you spliced in before is silently dropped, because Claude Design's canvas
has never heard of our Stripe wiring -- it only knows what's in the design.

This has broken the pricing page's checkout buttons at least twice
(9 Aug 2026, 26 Aug 2026). Both times the buttons quietly fell back to
their placeholder "#cta" anchor with no visible error -- the page looked
fine, the buttons just didn't do anything.

THE RULE
--------
After EVERY re-export from Claude Design, before deploying:
    1. Run this script against the fresh export.
    2. Confirm it prints "OK".
    3. Deploy the OUTPUT file, never the raw export.
    4. Open rostas.app for real afterwards and confirm the buttons are
       wired (see the JS snippet at the bottom of this docstring). Do not
       trust the presence of the script alone -- confirm it actually ran.

If this script aborts, STOP. Don't hand-patch around it and don't deploy
the raw export "just this once" -- that's exactly how this broke before.
Investigate why the anchor or markers changed; the export format may have
changed and this script may need updating to match.

USAGE
-----
    python3 splice-checkout.py <fresh-export.html> <output.html>

BUTTON CHECK (added 10 Oct 2026)
--------------------------------
Splicing the script in is not enough: the script finds its buttons by
their exact wording, so a design that renames a pricing button leaves it
doing nothing, with no error anywhere. This script therefore reads the
wordings out of BUTTON_MATCHERS in checkout-script.html, lists every
button in the export's pricing section, and aborts if any of them would
not be wired. Add `--allow-unwired-buttons` to turn that abort into a
warning (for a pricing-section button that is meant to be a plain link).

`checkout-script.html`, in this same folder, is the canonical script this
splices in. If the checkout flow itself ever needs to change (a new plan,
a different worker URL, etc.), edit checkout-script.html -- not a copy
pasted somewhere else -- so this stays the one source of truth.

VERIFY LIVE, AFTER DEPLOYING (paste into the browser console on rostas.app):

    Array.from(document.querySelectorAll('#pricing a.btn, #pricing button.btn'))
      .map(el => el.textContent.trim() + ' = ' + el.getAttribute('data-rostas-wired'))

All three pricing buttons should end "= 1". If any ends "= null", the splice didn't take on the
deployed copy even if it looked right locally -- check you deployed the
OUTPUT file, not the original export.
"""
import sys
import os
import re
import json
import html

ALLOW_FLAG = "--allow-unwired-buttons"


def load_matchers(raw_script):
    """Read the button wordings out of BUTTON_MATCHERS in checkout-script.html.

    Returns a list of (text, pricing_only). Read from the script itself so
    there is one list of wordings, not two that can drift apart.
    """
    block = re.search(r"var BUTTON_MATCHERS\s*=\s*\[(.*?)\];", raw_script, re.S)
    if not block:
        return []
    out = []
    for entry in re.finditer(r"\{([^{}]*)\}", block.group(1)):
        body = entry.group(1)
        text = re.search(r'text:\s*"([^"]+)"', body)
        if not text:
            continue
        pricing_only = bool(re.search(r"pricingOnly:\s*true", body))
        out.append((text.group(1), pricing_only))
    return out


def pricing_span(page):
    """(start, end) of the element with id="pricing", or None if there isn't one."""
    m = re.search(r'<(\w+)\b[^>]*\bid=["\']pricing["\'][^>]*>', page)
    if not m:
        return None
    tag = m.group(1)
    depth = 0
    for t in re.finditer(r"<(/?)" + tag + r"\b[^>]*>", page[m.start():]):
        depth += -1 if t.group(1) else 1
        if depth == 0:
            return (m.start(), m.start() + t.end())
    return (m.start(), len(page))


def check_buttons(page, matchers):
    """Work out, from the page's HTML, which buttons the checkout script
    will wire up once the page is live. Mirrors findCandidates() in
    checkout-script.html: an <a> or <button> with the class "btn" whose
    whole visible text equals one of the wordings (any capitals).

    Returns (rows, problem). rows is a list of (text, wired) for every
    button in the pricing section. problem is None when all is well, or a
    sentence saying what is wrong.
    """
    span = pricing_span(page)
    rows = []
    for m in re.finditer(r"<(a|button)\b([^>]*)>(.*?)</\1>", page, re.S):
        cls = re.search(r'class=["\']([^"\']*)["\']', m.group(2))
        if not cls or "btn" not in cls.group(1).split():
            continue
        in_pricing = span is None or (span[0] <= m.start() < span[1])
        if not in_pricing:
            continue
        # textContent: tags removed, entities decoded, ends trimmed. Inner
        # whitespace is deliberately NOT tidied -- the live script doesn't.
        text = html.unescape(re.sub(r"<[^>]+>", "", m.group(3))).strip()
        wired = any(text.lower() == wording for wording, _ in matchers)
        rows.append((text, wired))

    if span is None:
        wired_rows = [r for r in rows if r[1]]
        if not wired_rows:
            return wired_rows, (
                'the page has no section with id="pricing", and no button '
                "anywhere on it carries a wording the checkout script "
                "recognises."
            )
        return wired_rows, None
    if not rows:
        return rows, "the pricing section has no buttons at all."
    dead = [text for text, wired in rows if not wired]
    if dead:
        return rows, (
            "these pricing buttons carry a wording the checkout script does "
            "not recognise, so they would do nothing when clicked: "
            + ", ".join(repr(t) for t in dead) + "."
        )
    return rows, None


def main():
    args = [a for a in sys.argv[1:] if a != ALLOW_FLAG]
    allow_unwired = ALLOW_FLAG in sys.argv[1:]
    if len(args) != 2:
        print("Usage: python3 splice-checkout.py <fresh-export.html> "
              "<output.html> [" + ALLOW_FLAG + "]")
        sys.exit(1)

    src_path, out_path = args[0], args[1]
    script_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "checkout-script.html"
    )

    with open(src_path, encoding="utf-8") as f:
        data = f.read()
    with open(script_path, encoding="utf-8") as f:
        raw_script = f.read().rstrip("\n")

    if "WORKER_BASE" in data:
        print(
            "NOTE: this export already contains a checkout script -- splicing "
            "again would duplicate it. Aborting; nothing written. If the "
            "existing script is stale, remove it from the export first."
        )
        sys.exit(1)

    # Standard JSON string escaping, then re-escape any "</" as "</" --
    # this is this exporter's own convention (checked against real exports)
    # for embedding a literal "</script>" etc. inside the outer
    # <script type="__bundler/template"> tag without prematurely closing it.
    escaped = json.dumps(raw_script)[1:-1]
    escaped = escaped.replace("</", "<\\u002F")

    anchor = "<\\u002Fbody><\\u002Fhtml>"
    count = data.count(anchor)
    if count != 1:
        print(
            f"ABORT: expected exactly one {anchor!r} anchor in the export, "
            f"found {count}. The export format may have changed -- do not "
            "proceed blindly; check the file by hand before continuing."
        )
        sys.exit(1)

    insertion = "\\n\\n\\n" + escaped + "\\n"
    new_data = data.replace(anchor, insertion + anchor)

    # ---- Verify before writing anything ----
    # (These markers legitimately appear more than once inside the script
    # itself -- e.g. WORKER_BASE is declared once and used once -- so this
    # checks presence, not an exact count. The real duplicate-splice guard
    # is the "already contains WORKER_BASE" check above, against the
    # ORIGINAL export before insertion.)
    for marker in (
        "WORKER_BASE",
        "/api/checkout",
        "data-rostas-wired",
        "rostas-licence.newsletters-432.workers.dev",
    ):
        if marker not in new_data:
            print(f"ABORT: marker {marker!r} not found after splicing. "
                  "Nothing written.")
            sys.exit(1)

    m = re.search(
        r'<script type="__bundler/template">\n(.*?)\n\s*</script>', new_data, re.S
    )
    if not m:
        print("ABORT: could not find the __bundler/template script tag to "
              "validate against. Nothing written.")
        sys.exit(1)
    try:
        parsed = json.loads(m.group(1))
    except json.JSONDecodeError as e:
        print(f"ABORT: embedded template is not valid JSON after splicing "
              f"({e}). Nothing written.")
        sys.exit(1)
    if not parsed.rstrip().endswith("</body></html>"):
        print("ABORT: embedded template does not end with </body></html> "
              "after splicing -- insertion point may be wrong. Nothing "
              "written.")
        sys.exit(1)

    # ---- Would the pricing buttons actually be wired? (added 10 Oct 2026) ----
    # The checkout script finds its buttons by their exact wording. If a new
    # design renames a pricing button to a wording the script doesn't know,
    # everything above still passes and the page still looks right -- the
    # button just does nothing. Catch that here, before anything is written.
    matchers = load_matchers(raw_script)
    if not matchers:
        print("ABORT: could not read the BUTTON_MATCHERS list out of "
              "checkout-script.html. Nothing written.")
        sys.exit(1)
    rows, problem = check_buttons(parsed, matchers)
    print("Pricing buttons found in this export:")
    for text, wired in rows:
        print(f"    {'wired' if wired else 'NOT WIRED':<10} {text!r}")
    if problem:
        known = ", ".join(repr(w) for w, _ in matchers)
        if allow_unwired:
            print(f"WARNING ({ALLOW_FLAG} given, carrying on): {problem}")
        else:
            print(f"ABORT: {problem} Nothing written.")
            print(f"Wordings the script recognises (any capitals): {known}.")
            print("Fix: either give the button one of those wordings in "
                  "Claude Design (exact words, no icon inside the button) "
                  "and export again, or add the new wording to "
                  "BUTTON_MATCHERS in scripts/checkout-script.html first.")
            sys.exit(1)

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(new_data)

    print(f"OK -- wrote {out_path}")
    print("Verified: JSON.parse succeeds on the embedded template, it still "
          "ends in </body></html>, all checkout markers are present, and "
          "every pricing button carries a wording the script recognises.")
    print("Next: deploy this file (not the original export), then check "
          "rostas.app live in a real browser -- see this script's docstring "
          "for the exact console check.")


if __name__ == "__main__":
    main()
