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

PHONE SPEED (23 Oct 2026, after PageSpeed scored the phone page 57)
  * PNG pictures become WebP, at most 1600 px wide plus an 800 px copy for
    phones, with width/height set and loading="lazy" below the top section;
  * the 500 KB icon font is cut down to the icons the page actually uses;
  * script files get `defer`, so the page draws before they run;
  * everything between the top menu and the footer is wrapped in <main>.
The check below also loads the page at phone size and fails if a picture
is missing or stretched, or an icon shows as its name instead of the icon.

USAGE
-----
    python3 scripts/prerender.py <spliced.html> <out-dir>

Writes <out-dir>/index.html and <out-dir>/assets/. Needs Playwright,
Pillow and fontTools (same versions as .github/workflows/splice-checkout.yml):
    pip install playwright==1.56.0 pillow==12.3.0 fonttools==4.66.1 brotli==1.1.0
    python3 -m playwright install --with-deps chromium

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


# ── Phone speed (23 Oct 2026) ─────────────────────────────────────────────
# PageSpeed (phone) scored the first plain page 57: 2 MB of PNG screenshots
# and a 500 KB icon font competed with the words for a slow connection.

IMG_MAX = 1600            # widest picture kept (the page never shows them wider)
IMG_SMALL = 800           # extra copy for phones
WEBP_QUALITY = 82
ICON_FAMILY = "Material Symbols Rounded"
ABOVE_FOLD_END = "</header>"   # pictures before this load at once; later ones lazily


def _asset_path(assets, url):
    return os.path.join(assets.dir, url.rsplit("/", 1)[1])


def _drop(assets, url):
    name = url.rsplit("/", 1)[1]
    os.remove(os.path.join(assets.dir, name))
    assets.names.pop(name, None)


def _rewrite_text_assets(html, assets, old_to_new):
    """Replace addresses inside the CSS/JS files too. A changed file gets a new
    content name, so its own address in the page changes as well."""
    for name in sorted(list(assets.names)):
        if not name.endswith((".css", ".js")):
            continue
        path = os.path.join(assets.dir, name)
        with open(path, encoding="utf-8") as f:
            text = f.read()
        new = text
        for old, rep in old_to_new.items():
            new = new.replace(old, rep)
        if new != text:
            url = "/" + ASSET_DIR + "/" + name
            html = html.replace(url, assets.add(new.encode(), ext=name.rsplit(".", 1)[1]))
            _drop(assets, url)
    return html


def pictures_to_webp(html, assets):
    """PNG -> WebP (at most 1600 px wide, plus an 800 px copy for phones),
    width/height on every <img> so nothing jumps while loading, and
    loading="lazy" for every picture below the top of the page."""
    from PIL import Image
    pngs = sorted(set(re.findall(r"/" + ASSET_DIR + r"/[0-9a-f]{16}\.png", html)))
    for name in assets.names:
        if name.endswith(".css"):
            with open(os.path.join(assets.dir, name), encoding="utf-8") as f:
                pngs = sorted(set(pngs) | set(re.findall(r"/" + ASSET_DIR + r"/[0-9a-f]{16}\.png", f.read())))
    info, before, after = {}, 0, 0
    for url in pngs:
        path = _asset_path(assets, url)
        before += os.path.getsize(path)
        im = Image.open(path)
        im.load()
        w, h = im.size
        im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")

        def webp(img):
            from io import BytesIO
            buf = BytesIO()
            img.save(buf, "WEBP", quality=WEBP_QUALITY, method=6)
            return buf.getvalue()

        def scaled(width):
            return im.resize((width, round(h * width / w)), Image.LANCZOS) if width < w else im

        big_w = min(w, IMG_MAX)
        big = assets.add(webp(scaled(big_w)), ext="webp")
        small = assets.add(webp(scaled(IMG_SMALL)), ext="webp") if w > IMG_SMALL * 1.25 else None
        after += assets.names[big.rsplit("/", 1)[1]] + (assets.names[small.rsplit("/", 1)[1]] if small else 0)
        info[url] = (big, big_w, small, w, h)

    fold = html.find(ABOVE_FOLD_END)

    def fix_img(m):
        tag = m.group(0)
        src = re.search(r'src="([^"]+)"', tag).group(1)
        if src not in info:
            return tag
        big, big_w, small, w, h = info[src]
        extra = f' width="{w}" height="{h}"'
        if small:
            extra += f' srcset="{small} {IMG_SMALL}w, {big} {big_w}w" sizes="(max-width: 900px) 100vw, 900px"'
        extra += ' decoding="async"' + ('' if m.start() < fold else ' loading="lazy"')
        tag = tag.replace(f'src="{src}"', f'src="{big}"')
        tag = re.sub(r'\s(width|height|loading|decoding|srcset|sizes)="[^"]*"', "", tag)
        return tag[:-1].rstrip("/").rstrip() + extra + ">"

    html = re.sub(r"<img\b[^>]*>", fix_img, html)
    for url, (big, *_rest) in info.items():   # window.__resources, inline styles
        html = html.replace(url, big)
    html = _rewrite_text_assets(html, assets, {u: v[0] for u, v in info.items()})
    for url in info:
        _drop(assets, url)
    return html, f"{len(info)} pictures to WebP: {before // 1024} KB -> {after // 1024} KB"


def icon_names_used(html, assets):
    """Every word in the page or its scripts that could be an icon name."""
    words = set(re.findall(r"\b[a-z0-9_]{2,40}\b", re.sub(r"<[^>]+>", " ", html)))
    for name in assets.names:
        if name.endswith(".js"):
            with open(os.path.join(assets.dir, name), encoding="utf-8") as f:
                words |= set(re.findall(r"""["'`]([a-z0-9_]{2,40})["'`]""", f.read()))
    return words


def ligatures(font):
    """{icon name: glyph name} from the font's ligature table."""
    rev = {g: chr(c) for c, g in font.getBestCmap().items()}
    out = {}
    for lookup in font["GSUB"].table.LookupList.Lookup:
        for sub in lookup.SubTable:
            if sub.LookupType == 7:
                sub = sub.ExtSubTable
            if getattr(sub, "LookupType", None) != 4:
                continue
            for first, ligs in sub.ligatures.items():
                for lig in ligs:
                    seq = [first] + list(lig.Component)
                    if all(g in rev for g in seq):
                        out["".join(rev[g] for g in seq)] = lig.LigGlyph
    return out


def subset_icon_font(html, assets):
    """Keep only the icons the page uses (500 KB -> a few KB). Missing an icon
    would show its name as text, so check() measures every icon on the page."""
    from fontTools import subset
    from fontTools.ttLib import TTFont
    m = re.search(r"font-family: '" + ICON_FAMILY + r"';(.*?)src: url\(\"(/" + ASSET_DIR +
                  r"/[0-9a-f]{16}\.woff2)\"\) format\('woff2'\);", html, re.S)
    if not m:
        raise SystemExit(f"ABORT: could not find the {ICON_FAMILY} font in the page.")
    url = m.group(2)
    path = _asset_path(assets, url)
    font = TTFont(path)
    ligs = ligatures(font)
    used = sorted(icon_names_used(html, assets) & set(ligs))
    if len(used) < 20:
        raise SystemExit(f"ABORT: only {len(used)} icon names found in the page; expected dozens.")
    letters = sorted(set("".join(used)))
    cmap = font.getBestCmap()
    keep = sorted({ligs[n] for n in used} | {cmap[ord(c)] for c in letters})
    opts = subset.Options()
    opts.layout_closure = False      # only the ligatures we keep, not every icon spelt with these letters
    opts.layout_features = ["*"]
    opts.flavor = "woff2"
    opts.notdef_outline = True
    opts.name_IDs = ["*"]
    sub = subset.Subsetter(opts)
    sub.populate(glyphs=keep)
    sub.subset(font)
    from io import BytesIO
    buf = BytesIO()
    font.flavor = "woff2"
    font.save(buf)
    before = os.path.getsize(path)
    new = assets.add(buf.getvalue(), ext="woff2")
    # Icon fonts should not "swap": the fallback would show the icon's name.
    html = html.replace(m.group(0), m.group(0).replace("src: url(", "font-display: block;\n  src: url(", 1), 1)
    html = html.replace(url, new)
    _drop(assets, url)
    preload = f'<link rel="preload" href="{new}" as="font" type="font/woff2" crossorigin>'
    html = html.replace("</head>", preload + "\n</head>", 1)
    return html, f"icon font: {len(used)} icons kept, {before // 1024} KB -> {len(buf.getvalue()) // 1024} KB"


def scripts_later(html, assets):
    """defer every script file in <body>: the page draws before they run.
    They keep their order, and still run before DOMContentLoaded."""
    body = html.find("<body")
    head, tail = html[:body], html[body:]
    first_src = tail.find("<script src=")
    if any(m.start() > first_src for m in re.finditer(r"<script>", tail)):
        raise SystemExit("ABORT: an inline script follows a script file; defer would change their order.")
    tail, n = re.subn(r'<script src="([^"]+)"></script>', r'<script src="\1" defer></script>', tail)
    # The fonts live in assets/ now, so nothing is fetched from Google Fonts.
    css = ""
    for name in assets.names:
        if name.endswith(".css"):
            with open(os.path.join(assets.dir, name), encoding="utf-8") as f:
                css += f.read()
    if "fonts.gstatic.com" not in css and "fonts.googleapis.com" not in css:
        head = re.sub(r'<link rel="preconnect" href="https://fonts\.(googleapis|gstatic)\.com"[^>]*>\n?', "", head)
    return head + tail, f"{n} script files deferred"


def add_main_landmark(html, assets):
    """Wrap everything between the top menu and the footer in <main>, so
    screen readers can jump straight to the content."""
    start = html.find("</nav>")
    end = html.find('<footer class="foot"')
    if start < 0 or end < 0 or "<main" in html:
        raise SystemExit("ABORT: could not place <main> (no </nav> or footer, or already there).")
    start += len("</nav>")
    return html[:start] + "\n<main>" + html[start:end] + "</main>\n" + html[end:], "<main> landmark added"


def speed_up(html, assets):
    notes = []
    for step in (pictures_to_webp, subset_icon_font, scripts_later, add_main_landmark):
        html, note = step(html, assets)
        notes.append(note)
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
            problems += check_phone(browser, base)
            browser.close()
    finally:
        srv.shutdown()
    problems += ["script error: " + e for e in errors[:3]]
    problems += ["missing file: " + u for u in failed[:3]]
    return problems


PHONE_CHECK = """async () => {
  const out = [];
  for (let y = 0; y < document.body.scrollHeight; y += 600) {   // let lazy pictures load
    window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60));
  }
  await new Promise(r => setTimeout(r, 1500));
  await document.fonts.ready;
  for (const img of document.images) {
    const r = img.getBoundingClientRect();
    if (!r.width) continue;                                   // hidden (e.g. other tab of a demo)
    if (!img.complete || !img.naturalWidth) { out.push('picture did not load: ' + img.src); continue; }
    const want = img.naturalWidth / img.naturalHeight, got = r.width / r.height;
    const fit = getComputedStyle(img).objectFit;
    if (fit !== 'contain' && fit !== 'cover' && Math.abs(got - want) / want > 0.03)
      out.push('picture stretched: ' + img.src + ' ' + got.toFixed(2) + ' vs ' + want.toFixed(2));
  }
  for (const el of document.querySelectorAll('.material-symbols-rounded')) {
    const range = document.createRange(); range.selectNodeContents(el);   // the glyph, not the box
    const r = range.getBoundingClientRect(), fs = parseFloat(getComputedStyle(el).fontSize);
    if (r.width > fs * 1.6) out.push('icon shows as text: "' + el.textContent.trim() + '"');
  }
  if (!document.querySelector('main')) out.push('no <main> landmark');
  return out;
}"""


def check_phone(browser, base):
    """Phone-sized check: every picture loads unstretched, every icon draws."""
    page = browser.new_page(viewport={"width": 412, "height": 823}, device_scale_factor=1.75,
                            is_mobile=True, has_touch=True)
    errors = []
    page.on("pageerror", lambda e: errors.append("phone script error: " + str(e)))
    page.goto(base + "index.html", wait_until="load")
    wait_until_drawn(page)
    problems = page.evaluate(PHONE_CHECK)
    page.close()
    return sorted(set(problems))[:10] + errors[:3]


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 scripts/prerender.py <spliced.html> <out-dir>")
        sys.exit(1)
    spliced, final_dir = sys.argv[1], sys.argv[2]
    work = tempfile.mkdtemp()
    html, blobs = render(spliced)
    assets = Assets(work)
    html, notes = make_plain(html, blobs, assets)
    html, more = speed_up(html, assets)
    notes += more
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
