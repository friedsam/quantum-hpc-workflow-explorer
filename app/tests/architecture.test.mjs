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

test("only the frozen engine runtime owns DES simulation semantics", async () => {
  const files = await sourceFiles(srcRoot);
  for (const file of files) {
    const relative = path.relative(srcRoot, file);
    if (relative === path.join("engine", "runtime.mjs")) continue;
    const content = await readFile(file, "utf8");
    assert.equal(
      /function\s+simulateWorkflow\s*\(/.test(content),
      false,
      relative + " defines simulateWorkflow outside the frozen engine"
    );
  }
});

test("UI validation delegates to the frozen engine validator", async () => {
  const validation = await readFile(
    path.join(srcRoot, "domain", "validation.ts"),
    "utf8"
  );
  assert.match(validation, /validateWorkflowSpec\(spec\)/);
  assert.match(validation, /engine\/runtime\.mjs/);
});

test("accepted design compiler is separate from frozen DES runtime", async () => {
  const compiler = await readFile(
    path.join(srcRoot, "design", "compiler.mjs"),
    "utf8"
  );
  const app = await readFile(path.join(srcRoot, "App.tsx"), "utf8");

  assert.match(compiler, /compileWorkflowDesignDetailed/);
  assert.match(compiler, /schemaVersion/);
  assert.match(compiler, /CompilationManifest|manifest/);
  assert.equal(/simulateWorkflow\s*\(/.test(compiler), false);
  assert.match(app, /compileWorkflowDesignDetailed/);
  assert.match(app, /createRunRecord/);\n  assert.match(app, /detachCompilationProvenance/);
});

test("A-D presets come from the accepted scenario fixture module", async () => {
  const presets = await readFile(
    path.join(srcRoot, "presets", "presets.ts"),
    "utf8"
  );
  assert.match(presets, /qamp-scenarios\.mjs/);
  for (const key of [
    "custom",
    "scenario-a",
    "scenario-b",
    "scenario-c",
    "scenario-d",
    "ibm-sqd"
  ]) {
    assert.ok(presets.includes('key: "' + key + '"'), "missing preset " + key);
  }
  assert.match(presets, /collective-synchronization/);
});

test("causal explanation remains a presentation derivation, not a resource partition", async () => {
  const causal = await readFile(
    path.join(srcRoot, "causal", "systemState.mjs"),
    "utf8"
  );
  assert.match(causal, /policyHeldQuantumTasks/);
  assert.match(causal, /dependencyGatedClassical/);
  assert.doesNotMatch(causal, /blockedUnits/);
  assert.doesNotMatch(causal, /simulateWorkflow/);
});

test("DAG layout is deterministic and runtime state does not relayout it", async () => {
  const layout = await readFile(
    path.join(srcRoot, "components", "graph", "layout.ts"),
    "utf8"
  );
  const dag = await readFile(
    path.join(srcRoot, "components", "graph", "WorkflowDag.tsx"),
    "utf8"
  );
  assert.match(layout, /"elk\.randomSeed":\s*"1"/);
  assert.match(layout, /"elk\.algorithm":\s*"layered"/);
  assert.match(dag, /\}, \[topologyKey\]\);/);
  assert.match(dag, /debugSnapshot/);
  assert.match(dag, /onConnect=/);
  assert.match(dag, /onEdgesDelete=/);
});

test("full-system debugger uses separate exact and causal planes plus linked strips", async () => {
  const debuggerSource = await readFile(
    path.join(srcRoot, "components", "explore", "FullSystemDebugger.tsx"),
    "utf8"
  );
  const strips = await readFile(
    path.join(srcRoot, "components", "explore", "AnalyticalStrips.tsx"),
    "utf8"
  );
  const explore = await readFile(
    path.join(srcRoot, "components", "explore", "ExploreView.tsx"),
    "utf8"
  );

  assert.match(debuggerSource, /Capacity plane/);
  assert.match(debuggerSource, /Causality plane/);\n  assert.match(debuggerSource, /Resource queue/);
  assert.match(debuggerSource, /no blocked-rank inference/);
  assert.match(strips, /CUMULATIVE COST/);
  assert.match(strips, /disabled/);
  assert.match(explore, /deriveSystemStateSnapshot/);
  assert.match(explore, /debugSnapshot=\{snapshot\}/);
  assert.match(explore, /simTimeS=\{inspectionTime\}/);
});

test("App orchestration remains componentized while preserving direct WorkflowSpec compatibility", async () => {
  const app = await readFile(path.join(srcRoot, "App.tsx"), "utf8");
  const lines = app.split(/\r?\n/).length;
  assert.ok(lines < 230, "App.tsx has grown to " + lines + " lines");
  assert.match(app, /localEngineAdapter\.simulate\(simulationSpec\)/);
  assert.match(app, /sourceKind: "direct-workflow-spec"/);
  assert.match(app, /setRuns/);
});

test("accepted graph dependencies are declared", async () => {
  const pkg = JSON.parse(
    await readFile(path.join(appRoot, "package.json"), "utf8")
  );
  assert.ok(pkg.dependencies["@xyflow/react"]);
  assert.ok(pkg.dependencies.elkjs);
});
