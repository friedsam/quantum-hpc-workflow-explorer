import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");
const srcRoot = path.join(appRoot, "src");

async function sourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  }));
  return nested.flat();
}

test("temporary v0 model is isolated behind contracts.ts", async () => {
  const files = await sourceFiles(srcRoot);
  for (const file of files) {
    const relative = path.relative(srcRoot, file);
    if (relative === "model.ts" || relative === "contracts.ts") continue;
    const content = await readFile(file, "utf8");
    assert.equal(
      /from\s+["'][^"']*model["']/.test(content),
      false,
      relative + " imports the temporary model directly"
    );
  }
});

test("UI source contains no workflow metric compute implementation", async () => {
  const files = await sourceFiles(srcRoot);
  for (const file of files) {
    if (path.basename(file) === "model.ts") continue;
    const content = await readFile(file, "utf8");
    assert.equal(/\bcompute\s*\(/.test(content), false, path.relative(srcRoot, file) + " contains compute()");
    assert.equal(/\bsimulateWorkflow\s*\(/.test(content), false, path.relative(srcRoot, file) + " contains simulateWorkflow()");
  }
});

test("DAG layout is deterministic and selection does not trigger layout", async () => {
  const layout = await readFile(path.join(srcRoot, "components/graph/layout.ts"), "utf8");
  const dag = await readFile(path.join(srcRoot, "components/graph/WorkflowDag.tsx"), "utf8");
  assert.match(layout, /"elk\.randomSeed":\s*"1"/);
  assert.match(layout, /"elk\.algorithm":\s*"layered"/);
  assert.match(dag, /\}, \[topologyKey\]\);/);
});

test("App orchestration is split below checkpoint-monolith size", async () => {
  const app = await readFile(path.join(srcRoot, "App.tsx"), "utf8");
  const lines = app.split(/\r?\n/).length;
  assert.ok(lines < 180, "App.tsx still has " + lines + " lines");
  assert.match(app, /unavailableEngineAdapter\.simulate\(draft\)/);
});

test("accepted graph dependencies are declared", async () => {
  const pkg = JSON.parse(await readFile(path.join(appRoot, "package.json"), "utf8"));
  assert.ok(pkg.dependencies["@xyflow/react"]);
  assert.ok(pkg.dependencies.elkjs);
});
