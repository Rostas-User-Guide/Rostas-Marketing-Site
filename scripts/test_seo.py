#!/usr/bin/env python3
"""SEO checks for the marketing site (22 Oct 2026 SEO review).

Run from the repo root:  python3 scripts/test_seo.py
Splices raw-export.html into a temporary file with splice-checkout.py and
checks the finished home page, plus the static files the review asked for.
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPLICE = os.path.join(ROOT, "scripts", "splice-checkout.py")


def build():
    out = os.path.join(tempfile.mkdtemp(), "index.html")
    r = subprocess.run([sys.executable, SPLICE, os.path.join(ROOT, "raw-export.html"), out],
                       capture_output=True, text=True)
    if r.returncode != 0:
        raise AssertionError("splice failed:\n" + r.stdout + r.stderr)
    return open(out, encoding="utf-8").read()


class HomePage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = build()
        cut = cls.data.find('<script type="__bundler/')
        cls.outer_head = cls.data[:cut].split("</head>")[0]
        m = re.search(r'<script type="__bundler/template">\n(.*?)\n\s*</script>', cls.data, re.S)
        page = json.loads(m.group(1))
        cls.page_head = re.search(r"<head[^>]*>(.*?)</head>", page, re.S).group(1)

    def test_title_has_search_terms(self):
        for head in (self.outer_head, self.page_head):
            title = re.search(r"<title>(.*?)</title>", head, re.S).group(1)
            self.assertIn("Volunteer Roster Software", title)
            self.assertLessEqual(len(title.replace("&amp;", "&")), 65)

    def test_large_twitter_card(self):
        for head in (self.outer_head, self.page_head):
            self.assertIn('<meta name="twitter:card" content="summary_large_image">', head)
            self.assertIn('name="twitter:image"', head)
            self.assertNotIn('content="summary">', head)

    def test_structured_data_real_prices(self):
        block = re.search(r'<script type="application/ld\+json">(.*?)</script>',
                          self.outer_head, re.S).group(1)
        ld = json.loads(block)
        offers = ld["offers"]
        self.assertIsInstance(offers, list)
        prices = {(o["priceCurrency"], o["price"], o["priceSpecification"]["unitCode"])
                  for o in offers}
        self.assertEqual(prices, {("NZD", "30", "MON"), ("NZD", "299", "ANN"),
                                  ("AUD", "30", "MON"), ("AUD", "299", "ANN")})
        self.assertNotIn('"price":"0"', self.outer_head)

    def test_icon_in_outer_head(self):
        self.assertIn('<link rel="icon" href="/favicon.ico" sizes="any">', self.outer_head)

    def test_checkout_still_spliced(self):
        self.assertIn("data-rostas-wired", self.data)


class PlainHomePage(unittest.TestCase):
    """The deployed index.html is plain HTML (scripts/prerender.py), not the
    5.7 MB bundle. Runs against the index.html in the repo, so it passes only
    after the Action (or prerender.py by hand) has rebuilt it."""

    @classmethod
    def setUpClass(cls):
        with open(os.path.join(ROOT, "index.html"), encoding="utf-8") as f:
            cls.html = f.read()
        cls.head = cls.html.split("</head>")[0]
        body = cls.html[cls.html.find("<body"):]
        cls.text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ",
                          re.sub(r"<(script|style)[^>]*>.*?</\1>", "", body, flags=re.S)))

    def test_small_and_unbundled(self):
        self.assertLess(len(self.html.encode()), 250_000)
        self.assertNotIn("__bundler", self.html)
        self.assertNotIn('type="text/babel"', self.html)

    def test_words_are_plain_html(self):
        for words in ("Automated rostering", "Pricing", "Join the beta"):
            self.assertIn(words, self.text)
        self.assertGreater(len(self.text), 8000)

    def test_search_tags_in_head(self):
        for needle in ('<link rel="canonical" href="https://rostas.app/">',
                       '<meta name="description" content="',
                       '<meta name="twitter:card" content="summary_large_image">',
                       '"priceCurrency":"NZD","unitCode":"MON"',
                       'href="/favicon.ico"',
                       "<title>Rostas — Church Volunteer Roster Software"):
            self.assertEqual(self.head.count(needle), 1, needle)

    def test_every_asset_exists(self):
        refs = set(re.findall(r'/assets/[0-9a-f]{16}\.\w+', self.html))
        self.assertTrue(refs)
        css = [r for r in refs if r.endswith(".css")]
        for r in css:   # fonts and pictures named inside the stylesheets
            with open(os.path.join(ROOT, r.lstrip("/")), encoding="utf-8") as f:
                refs |= set(re.findall(r'/assets/[0-9a-f]{16}\.\w+', f.read()))
        for r in refs:
            self.assertTrue(os.path.exists(os.path.join(ROOT, r.lstrip("/"))), r)

    def test_checkout_script_present_and_unwired(self):
        code = self.html
        for r in set(re.findall(r'<script src="(/assets/[0-9a-f]{16}\.js)"', self.html)):
            with open(os.path.join(ROOT, r.lstrip("/")), encoding="utf-8") as f:
                code += f.read()
        self.assertIn("rostas-licence.newsletters-432.workers.dev", code)
        self.assertNotIn('data-rostas-wired="1"', self.html)


class StaticFiles(unittest.TestCase):
    def test_assets_cached_long(self):
        with open(os.path.join(ROOT, "_headers"), encoding="utf-8") as f:
            h = f.read()
        self.assertIn("/assets/*", h)
        self.assertIn("immutable", h)

    def test_404_page_exists(self):
        p = os.path.join(ROOT, "404.html")
        self.assertTrue(os.path.exists(p))
        self.assertIn('name="robots" content="noindex"', open(p, encoding="utf-8").read())

    def test_icon_files_exist(self):
        for name in ("favicon.ico", "favicon.png", "apple-touch-icon.png"):
            p = os.path.join(ROOT, name)
            self.assertTrue(os.path.exists(p), name)
            self.assertLess(os.path.getsize(p), 100_000, name)

    def test_plain_pages_link_icon(self):
        pages = ["privacy.html", "terms.html", "welcome.html", "beta.html", "guide.html",
                 "404.html", "guides/index.html", "guides/volunteer-roster-template.html",
                 "guides/no-show-replacement-guide.html", "guides/church-volunteer-roster.html",
                 "guides/volunteer-reminder-templates.html", "guides/prevent-volunteer-burnout.html"]
        for name in pages:
            self.assertIn('href="/favicon.ico"', open(os.path.join(ROOT, name),
                                                      encoding="utf-8").read(), name)


class Guides(unittest.TestCase):
    """Every guide page is listed on /guides/ and in sitemap.xml, has its own
    canonical address and description, and links only to pages that exist
    (23 Oct 2026: three new guides)."""
    NEW = ("church-volunteer-roster", "volunteer-reminder-templates", "prevent-volunteer-burnout")

    @classmethod
    def setUpClass(cls):
        d = os.path.join(ROOT, "guides")
        cls.slugs = sorted(f[:-5] for f in os.listdir(d) if f.endswith(".html") and f != "index.html")
        cls.index = open(os.path.join(d, "index.html"), encoding="utf-8").read()
        cls.sitemap = open(os.path.join(ROOT, "sitemap.xml"), encoding="utf-8").read()

    def test_new_guides_exist(self):
        for slug in self.NEW:
            self.assertIn(slug, self.slugs)

    def test_listed_and_in_sitemap(self):
        for slug in self.slugs:
            self.assertIn(f'href="/guides/{slug}"', self.index, slug)
            self.assertIn(f"<loc>https://rostas.app/guides/{slug}</loc>", self.sitemap, slug)

    def test_head_tags(self):
        for slug in self.slugs:
            html = open(os.path.join(ROOT, "guides", slug + ".html"), encoding="utf-8").read()
            self.assertIn(f'<link rel="canonical" href="https://rostas.app/guides/{slug}">', html)
            self.assertEqual(html.count('<meta name="description"'), 1, slug)
            title = re.search(r"<title>(.*?)</title>", html).group(1).replace("&amp;", "&")
            self.assertLessEqual(len(title), 70, slug)
            self.assertEqual(len(re.findall(r"<h1[ >]", html)), 1, slug)

    def test_internal_links_exist(self):
        for slug in self.slugs + ["index"]:
            html = open(os.path.join(ROOT, "guides", slug + ".html"), encoding="utf-8").read()
            for href in re.findall(r'href="(/guides/[a-z0-9-]+)"', html):
                self.assertTrue(os.path.exists(os.path.join(ROOT, href.lstrip("/") + ".html")), f"{slug}: {href}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
