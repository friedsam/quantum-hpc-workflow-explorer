import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(here, "../src");

test("Round 4J public D uses dedicated D1000 preset", async () => {
  const logical = await readFile(
    path.join(srcRoot, "presets", "logical-presets.mjs"),
    "utf8"
  );
  const presets = await readFile(
    path.join(srcRoot, "presets", "presets.ts"),
    "utf8"
  );

  assert.match(logical, /qamp-d-1000-demo\.mjs/);
  assert.match(logical, /qampScenarioD1000Design/);
  assert.match(presets, /Synthetic 1,000-rank asynchronous QPU throughput demo/);
});

test("Round 4J high-scale Advanced diagnostics are bounded", async () => {
  const explore = await readFile(
    path.join(srcRoot, "components", "explore", "ExploreView.tsx"),
    "utf8"
  );
  const builder = await readFile(
    path.join(srcRoot, "components", "builder", "BuilderView.tsx"),
    "utf8"
  );

  assert.match(
    explore,
    /expandedDiagnosticsAllowed = spec\.tasks\.length <= 500/
  );
  assert.match(explore, /Expanded task-level views omitted/);
  assert.match(explore, /expandedDiagnosticsAllowed \? \(/);

  assert.match(
    builder,
    /expandedPreviewAllowed = spec\.tasks\.length <= 500/
  );
  assert.match(builder, /Compiled preview omitted/);
});
