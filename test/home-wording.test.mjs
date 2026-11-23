// 23 Nov 2026 (bug hunt): the home page's words checked against the product
// decisions. Reads raw-export.html, the source the Action builds index.html from.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const out = join(mkdtempSync(join(tmpdir(), "home-")), "page.html");
execFileSync("python3", [root + "scripts/export_template.py", "extract", root + "raw-export.html", out], { stdio: "ignore" });
const home = readFileSync(out, "utf8").replace(/<[^>]+>/g, " ");

test("S5: texts only follow a coordinator's nudge (the automatic day-2 text is off)", () => {
  assert.doesNotMatch(home, /A text nudges anyone/);
  assert.match(home, /You can send a text nudge to anyone who hasn't replied\./);
});

// 23 Nov 2026 (bug hunt S4, Guy): one answer to "where is Rostas offered":
// New Zealand and Australia, as the terms, the page title and the country
// allowlist say. Was the bug hunt's proof site-04.
test("S4: home page, llms.txt, beta pop-up and terms agree: New Zealand and Australia", () => {
  const read = (f) => readFileSync(root + f, "utf8");
  const terms = read("terms.html").replace(/<[^>]+>/g, " ");
  const llms = read("llms.txt");
  const popup = read("scripts/checkout-script.html");
  assert.match(terms, /invited organisations in New Zealand and Australia/);
  assert.match(home, /New Zealand and Australia, by invitation while we're in beta\./);
  assert.match(llms, /New Zealand and Australia, by invitation while Rostas is in beta\./);
  assert.match(popup, /We're starting with ten churches in New Zealand and Australia\./);
  for (const [name, text] of [["home", home], ["llms.txt", llms], ["pop-up", popup]]) {
    assert.doesNotMatch(text, /Australia to follow/, name);
    assert.doesNotMatch(text, /ten New Zealand churches|small number of NZ churches/, name);
  }
});
