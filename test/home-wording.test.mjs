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
