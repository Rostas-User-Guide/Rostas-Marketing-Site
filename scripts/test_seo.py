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


class StaticFiles(unittest.TestCase):
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
                 "guides/no-show-replacement-guide.html"]
        for name in pages:
            self.assertIn('href="/favicon.ico"', open(os.path.join(ROOT, name),
                                                      encoding="utf-8").read(), name)


if __name__ == "__main__":
    unittest.main(verbosity=2)
