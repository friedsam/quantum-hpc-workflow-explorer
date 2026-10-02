import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
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
    return /\.(ts|tsx|mjs)$/.test(entry.name) ? [full] : [];
  }));
  return nested.flat();
}

test("legacy v0 UI model and contract shims are removed", async () => {
  await assert.rejects(access(path.join(srcRoot, "model.ts")));
  await assert.rejects(access(path.join(srcRoot, "contracts.ts")));
});

test("only the engine runtime owns simulation semantics", async () => {
  const files = await sourceFiles(srcRoot);
  for (const file of files) {
    const relative = path.relative(srcRoot, file);
    if (relative === path.join("engine", "runtime.mjs")) continue;
    const content = await readFile(file, "utf8");
    assert.equal(
      /function\s+simulateWorkflow\s*\(/.test(content),
      false,
      relative + " defines simulateWorkflow outside the engine"
    );
  }
});

test("UI validation delegates to the frozen engine validator", async () => {
  const validation = await readFile(path.join(srcRoot, "domain", "validation.ts"), "utf8");
  assert.match(validation, /validateWorkflowSpec\(spec\)/);
  assert.match(validation, /engine\/runtime\.mjs/);
});

test("DAG layout uses deterministic ELK and layout is topology-driven", async () => {
  const layout = await readFile(path.join(srcRoot, "components", "graph", "layout.ts"), "utf8");
  const dag = await readFile(path.join(srcRoot, "components", "graph", "WorkflowDag.tsx"), "utf8");
  assert.match(layout, /"elk\.randomSeed":\s*"1"/);
  assert.match(layout, /"elk\.algorithm":\s*"layered"/);
  assert.match(dag, /\}, \[topologyKey\]\);/);
  assert.match(dag, /onConnect=/);
  assert.match(dag, /onEdgesDelete=/);
});

test("App orchestration stays split below checkpoint-monolith size", async () => {
  const app = await readFile(path.join(srcRoot, "App.tsx"), "utf8");
  const lines = app.split(/\r?\n/).length;
  assert.ok(lines < 180, "App.tsx still has " + lines + " lines");
  assert.match(app, /localEngineAdapter\.simulate\(draft\)/);
  assert.match(app, /setRuns/);
});

test("A-D plus custom and IBM/QAMP presets are loadable", async () => {
  const presets = await readFile(path.join(srcRoot, "presets", "presets.ts"), "utf8");
  for (const key of ["custom", "scenario-a", "scenario-b", "scenario-c", "scenario-d", "ibm-sqd"]) {
    assert.ok(presets.includes('key: "' + key + '"'), "missing preset " + key);
  }
});

test("accepted graph dependencies are declared", async () => {
  const pkg = JSON.parse(await readFile(path.join(appRoot, "package.json"), "utf8"));
  assert.ok(pkg.dependencies["@xyflow/react"]);
  assert.ok(pkg.dependencies.elkjs);
});
