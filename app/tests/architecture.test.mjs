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

test("Round 4 compiler and actor state remain outside frozen DES", async () => {
  const compiler = await readFile(
    path.join(srcRoot, "design", "compiler.mjs"),
    "utf8"
  );
  const actor = await readFile(
    path.join(srcRoot, "design", "actor-state.mjs"),
    "utf8"
  );

  assert.match(compiler, /taskMultiplicity/);
  assert.match(compiler, /instanceMapping/);
  assert.match(compiler, /actorWaits/);
  assert.equal(/simulateWorkflow\s*\(/.test(compiler), false);
  assert.match(actor, /deriveActorStateDetailAt/);
  assert.equal(/simulateWorkflow\s*\(/.test(actor), false);
});

test("Builder defaults to logical WorkflowDesign and keeps compiled graph advanced", async () => {
  const builder = await readFile(
    path.join(srcRoot, "components", "builder", "BuilderView.tsx"),
    "utf8"
  );
  const inspector = await readFile(
    path.join(srcRoot, "components", "builder", "LogicalTaskInspector.tsx"),
    "utf8"
  );
  const dependency = await readFile(
    path.join(srcRoot, "components", "builder", "LogicalDependencyEditor.tsx"),
    "utf8"
  );

  assert.match(builder, /projectDesignDag/);
  assert.match(builder, /heading="Logical workflow"/);
  assert.match(builder, /Advanced · compiled DES preview/);
  assert.match(builder, /Advanced · direct WorkflowSpec editor/);
  assert.match(inspector, />Multiplicity</);
  assert.match(inspector, /Resource units \/ instance/);
  assert.match(inspector, /service time \/ instance/i);
  assert.match(dependency, /pairwise/);
  assert.match(dependency, /all-to-all/);
  assert.match(dependency, /multiplicities differ/);
});

test("logical node grammar separates multiplicity and per-instance resource demand", async () => {
  const projection = await readFile(
    path.join(srcRoot, "components", "graph", "projectDesign.ts"),
    "utf8"
  );
  const node = await readFile(
    path.join(srcRoot, "components", "graph", "WorkflowNode.tsx"),
    "utf8"
  );

  assert.match(projection, /logical multiplicity/);
  assert.match(projection, /unit.*\/ instance/s);
  assert.match(node, /multiplicity-badge/);
  assert.match(node, /resource-instance-tag/);
});

test("default Explore is simple actor-aware hierarchy and diagnostics are disclosed", async () => {
  const explore = await readFile(
    path.join(srcRoot, "components", "explore", "ExploreView.tsx"),
    "utf8"
  );
  const summary = await readFile(
    path.join(srcRoot, "components", "explore", "SimpleExplorerSummary.tsx"),
    "utf8"
  );

  assert.match(explore, /SimpleExplorerSummary/);
  assert.match(explore, /SimplePlaybackBar/);
  assert.match(explore, /projectDesignDag/);
  assert.match(explore, /Advanced \/ Diagnostics/);
  assert.match(explore, /Expanded compiled DES graph/);
  assert.match(summary, /What is happening now\?/);
  assert.match(summary, /Working \/ Blocked \/ Idle/);
  assert.match(summary, /resource queued/);
  assert.match(summary, /policy held/);
  assert.match(summary, /NO GLOBAL SYNCHRONIZATION/);
});

test("one actor-aware playback controller drives the shared simulation cursor", async () => {
  const explore = await readFile(
    path.join(srcRoot, "components", "explore", "ExploreView.tsx"),
    "utf8"
  );
  const hook = await readFile(
    path.join(srcRoot, "components", "explore", "useExplorerPlayback.ts"),
    "utf8"
  );

  assert.match(explore, /useExplorerPlayback/);
  assert.match(explore, /cursorTimeS=\{inspectionTime\}/);
  assert.match(explore, /runtimeByNodeId=\{logicalRuntime\}/);
  assert.match(explore, /simTimeS=\{inspectionTime\}/);
  assert.match(hook, /buildActorAwareVisualKeyframes/);
  assert.match(hook, /deriveActorStateDetailAt/);
});

test("Round 3 diagnostics remain present behind Advanced", async () => {
  const explore = await readFile(
    path.join(srcRoot, "components", "explore", "ExploreView.tsx"),
    "utf8"
  );

  for (const name of [
    "MetricsGrid",
    "CompilationProvenance",
    "FullSystemDebugger",
    "AnalyticalStrips",
    "TaskTimeline",
    "ResourceTimeline",
    "QueueEvidence",
    "Assumptions",
    "PlaybackDiagnostics"
  ]) {
    assert.match(explore, new RegExp(name));
  }
});

test("App preserves save-run, Compare and direct WorkflowSpec compatibility", async () => {
  const app = await readFile(path.join(srcRoot, "App.tsx"), "utf8");
  const compare = await readFile(
    path.join(srcRoot, "components", "compare", "CompareView.tsx"),
    "utf8"
  );
  const lines = app.split(/\r?\n/).length;

  assert.ok(lines < 260, "App.tsx has grown to " + lines + " lines");
  assert.match(app, /createRunRecord/);
  assert.match(app, /sourceKind: "direct-workflow-spec"/);
  assert.match(app, /setRuns/);
  assert.match(compare, /runSpec/);
  assert.match(compare, /runResult/);
});

test("DAG layout remains deterministic and runtime state never drives layout", async () => {
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
  assert.doesNotMatch(dag, /\[topologyKey,.*runtime/s);
});

test("accepted graph dependencies remain the only new runtime frameworks", async () => {
  const pkg = JSON.parse(
    await readFile(path.join(appRoot, "package.json"), "utf8")
  );
  assert.ok(pkg.dependencies["@xyflow/react"]);
  assert.ok(pkg.dependencies.elkjs);
  assert.equal(Object.keys(pkg.dependencies).length, 4);
});
