import { useMemo, useState } from "react";
import { AppShell, type ViewId } from "./components/AppShell";
import { BuilderView } from "./components/builder/BuilderView";
import { CompareView } from "./components/compare/CompareView";
import { ExploreView } from "./components/explore/ExploreView";
import { nextId } from "./domain/id";
import type { SimulationResult, WorkflowSpec } from "./domain/types";
import { validateForUi } from "./domain/validation";
import { cloneSpec, getPreset } from "./presets/presets";
import { localEngineAdapter } from "./services/engineAdapter";
import type { RunRecord } from "./uiTypes";

export default function App() {
  const initialPreset = getPreset("custom");
  const [view, setView] = useState<ViewId>("builder");
  const [selectedPresetKey, setSelectedPresetKey] = useState(initialPreset.key);
  const [draft, setDraft] = useState<WorkflowSpec>(() => cloneSpec(initialPreset.spec));
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState(initialPreset.spec.tasks[0]?.id ?? "");
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [notice, setNotice] = useState("Loaded editable custom starter.");
  const [simulating, setSimulating] = useState(false);

  const issues = useMemo(() => validateForUi(draft), [draft]);

  function changeDraft(next: WorkflowSpec) {
    setSelectedPresetKey("");
    setDraft(next);
    setResult(null);
    setNotice("Draft changed. The previous result was detached; metrics remain attached only to saved runs.");
  }

  function loadPreset(key: string) {
    const preset = getPreset(key);
    const next = cloneSpec(preset.spec);
    setSelectedPresetKey(preset.key);
    setDraft(next);
    setResult(null);
    setSelectedTaskId(next.tasks[0]?.id ?? "");
    setNotice("Loaded " + preset.label + ". " + preset.description);
    setView("builder");
  }

  async function simulate() {
    if (issues.some((issue) => issue.severity === "error")) {
      setNotice("Simulation blocked: fix validation errors first.");
      return;
    }

    setSimulating(true);
    setNotice("Running deterministic frozen-v1 simulation…");

    try {
      localEngineAdapter.validate(draft);
      const nextResult = await localEngineAdapter.simulate(draft);
      const runId = nextId("run", runs.map((run) => run.id));
      const record: RunRecord = {
        id: runId,
        createdAt: Date.now(),
        label: draft.name + " · " + runId,
        spec: structuredClone(draft),
        result: structuredClone(nextResult)
      };

      setRuns((current) => [...current, record]);
      setResult(nextResult);
      setNotice("Simulation complete. Saved " + runId + " for comparison.");
      setView("explore");
    } catch (error: unknown) {
      setResult(null);
      setNotice(error instanceof Error ? "Simulation failed: " + error.message : "Simulation failed.");
      setView("builder");
    } finally {
      setSimulating(false);
    }
  }

  return (
    <AppShell
      view={view}
      onViewChange={setView}
      workflow={draft}
      resultAttached={result !== null}
      runCount={runs.length}
    >
      {view === "builder" ? (
        <BuilderView
          spec={draft}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
          onSpecChange={changeDraft}
          issues={issues}
          selectedPresetKey={selectedPresetKey}
          onLoadPreset={loadPreset}
          onRequestSimulation={simulate}
          notice={notice}
          simulating={simulating}
        />
      ) : null}

      {view === "explore" ? (
        <ExploreView
          spec={draft}
          result={result}
          onReturnToBuilder={() => setView("builder")}
        />
      ) : null}

      {view === "compare" ? <CompareView runs={runs} /> : null}
    </AppShell>
  );
}
