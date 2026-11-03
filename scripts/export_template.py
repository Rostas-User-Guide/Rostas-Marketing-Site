#!/usr/bin/env python3
"""Edit the home page without Claude Design (3 Nov 2026).

raw-export.html is a Claude Design "bundler" page: the real page is a
JSON-encoded string inside <script type="__bundler/template">, and its
pictures, fonts and scripts sit in <script type="__bundler/manifest">,
keyed by an id that the page uses as each file's src. Standalone Claude
Design closes on 14 Dec 2026, so changes are now made here instead:

    python3 scripts/export_template.py extract raw-export.html page.html
    (edit page.html like any HTML file)
    python3 scripts/export_template.py pack raw-export.html page.html
    python3 scripts/export_template.py pack raw-export.html page.html \\
        --add-image 7c1d0b0e-5f8a-4a43-9b0e-2f0f6c1d9a11=path/to/picture.png

pack writes the page back into raw-export.html in the same encoding the
export uses ("</" written as "<\\u002F" so the script block can't close
early). --add-image adds a picture to the manifest under that id; use the
same id as the <img src> in the page. Commit raw-export.html as usual: the
GitHub Action splices, prerenders and checks it exactly as for an export.
"""
import base64
import json
import re
import sys

TEMPLATE_RE = re.compile(r'(<script type="__bundler/template"[^>]*>)(.*?)(</script>)', re.S)
MANIFEST_RE = re.compile(r'(<script type="__bundler/manifest"[^>]*>)(\s*\{)', re.S)
ID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
MIME = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}


def encode(page):
    return json.dumps(page, ensure_ascii=False).replace("</", "<\\u002F")


def extract(export_path, page_path):
    data = open(export_path, encoding="utf-8").read()
    m = TEMPLATE_RE.search(data)
    if not m:
        sys.exit("No __bundler/template block found.")
    page = json.loads(m.group(2))
    if encode(page) != m.group(2).strip():
        sys.exit("The template doesn't round-trip exactly; not safe to edit this way.")
    open(page_path, "w", encoding="utf-8").write(page)
    print(f"Wrote {page_path} ({len(page):,} characters).")


def pack(export_path, page_path, images):
    data = open(export_path, encoding="utf-8").read()
    page = open(page_path, encoding="utf-8").read()
    if not page.rstrip().endswith("</html>"):
        sys.exit("The edited page doesn't end with </html>; nothing written.")
    m = TEMPLATE_RE.search(data)
    if not m:
        sys.exit("No __bundler/template block found.")
    data = data[:m.start(2)] + "\n" + encode(page) + "\n  " + data[m.end(2):]
    for spec in images:
        file_id, _, path = spec.partition("=")
        ext = path[path.rfind("."):].lower()
        if not ID_RE.match(file_id) or ext not in MIME:
            sys.exit(f"--add-image wants id=picture.png (got {spec!r}).")
        if f'"{file_id}"' in data:
            sys.exit(f"{file_id} is already in the export; pick a new id.")
        if file_id not in page:
            sys.exit(f"{file_id} isn't used anywhere in the page.")
        entry = json.dumps({file_id: {"mime": MIME[ext], "compressed": False,
                                      "data": base64.b64encode(open(path, "rb").read()).decode()}})
        mm = MANIFEST_RE.search(data)
        if not mm:
            sys.exit("No __bundler/manifest block found.")
        data = data[:mm.end(2)] + entry[1:-1] + "," + data[mm.end(2):]
    open(export_path, "w", encoding="utf-8").write(data)
    # Read it back the way the browser will.
    check = json.loads(TEMPLATE_RE.search(data).group(2))
    assert check == page, "template did not read back identically"
    print(f"Packed {page_path} into {export_path}" + (f" with {len(images)} new picture(s)." if images else "."))


def main(argv):
    if len(argv) >= 3 and argv[0] == "extract":
        extract(argv[1], argv[2])
    elif len(argv) >= 3 and argv[0] == "pack":
        images = []
        rest = argv[3:]
        while rest:
            if rest[0] != "--add-image" or len(rest) < 2:
                sys.exit(__doc__)
            images.append(rest[1])
            rest = rest[2:]
        pack(argv[1], argv[2], images)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
