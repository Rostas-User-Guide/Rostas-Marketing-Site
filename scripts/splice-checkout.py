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

`checkout-script.html`, in this same folder, is the canonical script this
splices in. If the checkout flow itself ever needs to change (a new plan,
a different worker URL, etc.), edit checkout-script.html -- not a copy
pasted somewhere else -- so this stays the one source of truth.

VERIFY LIVE, AFTER DEPLOYING (paste into the browser console on rostas.app):

    Array.from(document.querySelectorAll('a.btn,button.btn'))
      .filter(el => /start free trial|subscribe monthly|subscribe annually/i
        .test(el.textContent.trim()))
      .map(el => el.getAttribute('data-rostas-wired'))

All three should print "1". If any is null, the splice didn't take on the
deployed copy even if it looked right locally -- check you deployed the
OUTPUT file, not the original export.
"""
import sys
import os
import re
import json


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 splice-checkout.py <fresh-export.html> <output.html>")
        sys.exit(1)

    src_path, out_path = sys.argv[1], sys.argv[2]
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

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(new_data)

    print(f"OK -- wrote {out_path}")
    print("Verified: JSON.parse succeeds on the embedded template, it still "
          "ends in </body></html>, and all checkout markers are present.")
    print("Next: deploy this file (not the original export), then check "
          "rostas.app live in a real browser -- see this script's docstring "
          "for the exact console check.")


if __name__ == "__main__":
    main()
