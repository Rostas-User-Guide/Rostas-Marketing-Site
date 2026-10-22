#!/usr/bin/env python3
"""
prerender.py -- turn the spliced Claude Design bundle into a plain HTML page.

WHY THIS EXISTS (22 Oct 2026, SEO review)
-----------------------------------------
A Claude Design export is one 5.7 MB file: a small outer page plus every
script, font and picture packed inside it as text. The browser has to
download all of it, unpack it, then compile the page's React code before
anything shows. Search engines that don't run scripts saw only the short
summary the splice adds; phones waited several seconds.

This script opens the spliced page in a real (headless) Chromium, lets it
unpack and draw itself, then saves what it drew as ordinary HTML:

  * every packed file (pictures, fonts, React) becomes its own file in
    assets/, named after its content, so browsers cache it;
  * the page's React code is saved already compiled, so the 860 KB
    in-browser compiler (Babel) is no longer downloaded;
  * all the page's words are plain HTML that any search engine can read.

The interactive parts (app demo, roster board, FAQ, pricing buttons) still
work: their scripts load after the page and take over as before.

USAGE
-----
    python3 scripts/prerender.py <spliced.html> <out-dir>

Writes <out-dir>/index.html and <out-dir>/assets/. Needs Playwright:
    pip install playwright && python3 -m playwright install --with-deps chromium

It checks its own result by opening it again in Chromium (no script
errors, headline present, three pricing buttons wired, demos drawn) and
stops without writing anything if a check fails.
"""
import base64
import functools
import hashlib
import http.server
import os
import re
import shutil
import sys
import tempfile
import threading

from playwright.sync_api import sync_playwright

ASSET_DIR = "assets"
MARK = "<!-- Plain HTML made by scripts/prerender.py from raw-export.html. Do not edit by hand. -->"
ICON_LINKS = [
    '<link rel="icon" href="/favicon.ico" sizes="any">',
    '<link rel="icon" type="image/png" href="/favicon.png">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
]
DEMO_ROOTS = ["demo-roles"]          # React roots that must hold something
EXT = {
    "image/png": "png", "image/jpeg": "jpg", "image/svg+xml": "svg",
    "image/webp": "webp", "image/gif": "gif", "font/woff2": "woff2",
    "font/woff": "woff", "application/font-woff2": "woff2",
    "text/javascript": "js", "application/javascript": "js",
    "text/css": "css",
}
VENDOR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vendor")
SOURCEMAP_RE =re.compile(r"\n?//# sourceMappingURL=data:[^\n]*")


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve(folder):
    handler = functools.partial(Quiet, directory=folder)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}/"


def wait_until_drawn(page):
    page.wait_for_function(
        "document.getElementById('hero-headline') !== null && "
        + " && ".join(f"(document.getElementById('{r}')||{{}}).childElementCount > 0"
                      for r in DEMO_ROOTS),
        timeout=90000)
    page.wait_for_timeout(1500)


class Assets:
    """Content-named files under assets/."""

    def __init__(self, out_dir):
        self.dir = os.path.join(out_dir, ASSET_DIR)
        os.makedirs(self.dir, exist_ok=True)
        self.names = {}

    def add(self, data, mime=None, ext=None):
        ext = ext or EXT.get((mime or "").split(";")[0].strip(), "bin")
        name = hashlib.sha256(data).hexdigest()[:16] + "." + ext
        if name not in self.names:
            with open(os.path.join(self.dir, name), "wb") as f:
                f.write(data)
            self.names[name] = len(data)
        return "/" + ASSET_DIR + "/" + name


def render(spliced_path):
    """Open the spliced page and return (html, {blob_url: (bytes, mime)})."""
    folder = tempfile.mkdtemp()
    shutil.copy(spliced_path, os.path.join(folder, "index.html"))
    srv, base = serve(folder)
    errors = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1280, "height": 900})
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(base + "index.html", wait_until="load")
            wait_until_drawn(page)
            html = page.evaluate("'<!DOCTYPE html>\\n' + document.documentElement.outerHTML")
            blobs = sorted(set(re.findall(r"blob:http://127\.0\.0\.1:\d+/[0-9a-f-]{36}", html)))
            got = page.evaluate("""async (urls) => {
                const out = {};
                for (const u of urls) {
                  const r = await fetch(u); const b = await r.blob();
                  const buf = new Uint8Array(await b.arrayBuffer());
                  let s = ''; for (let i = 0; i < buf.length; i += 32768)
                    s += String.fromCharCode.apply(null, buf.subarray(i, i + 32768));
                  out[u] = [btoa(s), b.type];
                }
                return out; }""", blobs)
            browser.close()
    finally:
        srv.shutdown()
        shutil.rmtree(folder, ignore_errors=True)
    if errors:
        raise SystemExit("ABORT: the bundled page itself had script errors: " + "; ".join(errors[:3]))
    return html, {u: (base64.b64decode(v[0]), v[1]) for u, v in got.items()}


def make_plain(html, blobs, assets):
    notes = []
    head_end = html.index("</head>")

    # 1. Babel already compiled each text/babel script and put the result in
    #    <head>, in run order. Put each compiled script back where its source
    #    was (after React has loaded) and drop the sources.
    compiled = [m for m in re.finditer(r"<script>(.*?)</script>", html[:head_end], re.S)
                if "sourceMappingURL=data:" in m.group(1)]
    sources = list(re.finditer(r'<script type="text/babel"[^>]*>.*?</script>', html, re.S))
    if len(compiled) != len(sources) or not sources:
        raise SystemExit(f"ABORT: found {len(sources)} text/babel scripts but "
                         f"{len(compiled)} compiled copies. The export format may have changed.")
    code = [SOURCEMAP_RE.sub("", m.group(1)).strip() + "\n" for m in compiled]
    out, last = [], 0
    for m in compiled:                     # remove compiled copies from <head>
        out.append(html[last:m.start()]); last = m.end()
    out.append(html[last:])
    html = "".join(out)
    sources = list(re.finditer(r'<script type="text/babel"[^>]*>.*?</script>', html, re.S))
    out, last = [], 0
    for m, js in zip(sources, code):
        out.append(html[last:m.start()])
        out.append(f'<script src="{assets.add(js.encode(), ext="js")}"></script>')
        last = m.end()
    out.append(html[last:])
    html = "".join(out)
    notes.append(f"{len(code)} React scripts saved already compiled")

    # 2. Drop the in-browser compiler; every other packed file becomes a file.
    #    The export carries React's development build (slow, 1.2 MB); swap in
    #    the production build of the same version from scripts/vendor/.
    dropped, swapped = 0, []
    for url, (data, mime) in blobs.items():
        if b"transformScriptTags" in data:
            html, n = re.subn(r'<script src="' + re.escape(url) + r'"[^>]*></script>\s*', "", html)
            dropped += n
            continue
        for lib in ("react", "react-dom"):
            if data.startswith(b"/**\n * @license React\n * " + lib.encode() + b".development.js"):
                ver = re.search(rb"ReactVersion = '([0-9.]+)'", data)
                prod = os.path.join(VENDOR, f"{lib}-{ver.group(1).decode() if ver else '?'}.production.min.js")
                if os.path.exists(prod):
                    data = open(prod, "rb").read()
                    swapped.append(os.path.basename(prod))
                else:
                    print(f"WARNING: no {prod}; keeping React's development build.")
        html = html.replace(url, assets.add(data, mime))
    if dropped != 1:
        raise SystemExit(f"ABORT: expected to drop exactly one Babel compiler script, dropped {dropped}.")
    notes.append(f"{len(blobs) - 1} packed files saved to {ASSET_DIR}/, Babel dropped"
                 + (", production " + " + ".join(swapped) if swapped else ""))

    # 3. Big embedded files written straight into styles/attributes (data:).
    def data_uri(m):
        mime, payload = m.group(2), m.group(3)
        if len(payload) < 4096:
            return m.group(0)
        try:
            raw = base64.b64decode(payload)
        except Exception:
            return m.group(0)
        return m.group(1) + assets.add(raw, mime)
    html, n = re.subn(r"""(url\(\s*['"]?|src=["'])data:([\w/+.-]+)(?:;charset=[\w-]+)?;base64,([A-Za-z0-9+/=]+)""",
                      data_uri, html)
    notes.append("embedded data files moved out")

    # 4. Big inline styles and scripts become cacheable files (same order).
    def ext_style(m):
        if len(m.group(2)) < 8192:
            return m.group(0)
        return f'<link rel="stylesheet" href="{assets.add(m.group(2).encode(), ext="css")}">'
    html = re.sub(r"(<style[^>]*>)(.*?)</style>", ext_style, html, flags=re.S)

    def ext_script(m):
        if len(m.group(1)) < 4096:
            return m.group(0)
        return f'<script src="{assets.add(m.group(1).encode(), ext="js")}"></script>'
    html = re.sub(r"<script>(.*?)</script>", ext_script, html, flags=re.S)

    # 5. State the scripts set while drawing must not be saved, or they skip
    #    their work on the real visit.
    html = re.sub(r'\s+data-rostas-wired="1"', "", html)

    # 6. Icon links, and a note at the top.
    html = re.sub(r'<link rel="icon"[^>]*href="/' + ASSET_DIR + r'/[^"]*"[^>]*>\n?', "", html)
    if 'href="/favicon.ico"' not in html:
        html = html.replace("</head>", "\n".join(ICON_LINKS) + "\n</head>", 1)
    html = html.replace("<!DOCTYPE html>\n", "<!DOCTYPE html>\n" + MARK + "\n", 1)
    if "blob:" in html:
        raise SystemExit("ABORT: a blob: address is left in the page.")
    return html, notes


def check(out_dir):
    """Open the finished page and confirm it works. Returns a list of problems."""
    srv, base = serve(out_dir)
    problems, errors = [], []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1280, "height": 900})
            page.on("pageerror", lambda e: errors.append(str(e)))
            failed = []
            page.on("requestfailed", lambda r: failed.append(r.url))
            page.on("response", lambda r: failed.append(r.url) if r.status >= 400 and "127.0.0.1" in r.url else None)
            page.goto(base + "index.html", wait_until="load")
            try:
                wait_until_drawn(page)
            except Exception:
                problems.append("the page did not draw its headline and demos.")
            page.wait_for_timeout(1500)
            wired = page.evaluate("""Array.from(document.querySelectorAll('#pricing a.btn, #pricing button.btn'))
                .filter(e => e.getAttribute('data-rostas-wired') === '1').length""")
            if wired < 3:
                problems.append(f"only {wired} pricing buttons were wired (expected 3).")
            if page.evaluate("typeof window.Babel") != "undefined":
                problems.append("Babel is still loaded.")
            browser.close()
    finally:
        srv.shutdown()
    problems += ["script error: " + e for e in errors[:3]]
    problems += ["missing file: " + u for u in failed[:3]]
    return problems


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 scripts/prerender.py <spliced.html> <out-dir>")
        sys.exit(1)
    spliced, final_dir = sys.argv[1], sys.argv[2]
    work = tempfile.mkdtemp()
    html, blobs = render(spliced)
    assets = Assets(work)
    html, notes = make_plain(html, blobs, assets)
    with open(os.path.join(work, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    # The finished page links to /favicon.ico etc.; copy them so the check
    # does not report them missing.
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for name in ("favicon.ico", "favicon.png", "apple-touch-icon.png", "og-image.png"):
        if os.path.exists(os.path.join(here, name)):
            shutil.copy(os.path.join(here, name), work)
    problems = check(work)
    if problems:
        print("ABORT: the plain page failed its check; nothing written:")
        for pr in problems:
            print("    " + pr)
        sys.exit(1)

    os.makedirs(final_dir, exist_ok=True)
    shutil.rmtree(os.path.join(final_dir, ASSET_DIR), ignore_errors=True)
    shutil.copytree(os.path.join(work, ASSET_DIR), os.path.join(final_dir, ASSET_DIR))
    shutil.copy(os.path.join(work, "index.html"), os.path.join(final_dir, "index.html"))
    for n in notes:
        print("    " + n)
    print(f"OK -- index.html {len(html.encode()) // 1024} KB, "
          f"{len(assets.names)} files in {ASSET_DIR}/ ({sum(assets.names.values()) // 1024} KB)")


if __name__ == "__main__":
    main()
