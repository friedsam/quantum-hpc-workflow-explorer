import { useMemo, useState } from "react";
import { AppShell, type ViewId } from "./components/AppShell";
import { BuilderView } from "./components/builder/BuilderView";
import { CompareView } from "./components/compare/CompareView";
import { ExploreView } from "./components/explore/ExploreView";
import { compileWorkflowDesignDetailed, createRunRecord } from "./design/compiler.mjs";
import { detachCompilationProvenance } from "./design/detach";
import { nextId } from "./domain/id";
import type { SimulationResult, WorkflowSpec } from "./domain/types";
import { validateForUi } from "./domain/validation";
import { getPreset, materializePreset } from "./presets/presets";
import { localEngineAdapter } from "./services/engineAdapter";
import type {
  CompilationContext,
  DirectRunRecord,
  RunRecord
} from "./uiTypes";

export default function App() {
  const initialPreset = getPreset("custom");
  const initial = materializePreset(initialPreset);

  const [view, setView] = useState<ViewId>("builder");
  const [selectedPresetKey, setSelectedPresetKey] = useState(initialPreset.key);
  const [draft, setDraft] = useState<WorkflowSpec>(() => structuredClone(initial.spec));
  const [compilationContext, setCompilationContext] = useState<CompilationContext | null>(
    initial.designBundle && initial.compilationManifest
      ? {
          bundle: structuredClone(initial.designBundle),
          manifest: structuredClone(initial.compilationManifest)
        }
      : null
  );
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState(initial.spec.tasks[0]?.id ?? "");
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [notice, setNotice] = useState("Loaded editable custom starter.");
  const [simulating, setSimulating] = useState(false);

  const issues = useMemo(() => validateForUi(draft), [draft]);

  function changeDraft(next: WorkflowSpec) {
    const directDraft = compilationContext
      ? detachCompilationProvenance(next, compilationContext.bundle)
      : next;
    setSelectedPresetKey("");
    setCompilationContext(null);
    setDraft(directDraft);
    setResult(null);
    setNotice(
      "Draft changed. Compilation manifest/profile provenance and compiler-only task metadata were detached; this is now a direct WorkflowSpec draft. Prior run evidence remains saved."
    );
  }

  function loadPreset(key: string) {
    const preset = getPreset(key);
    const loaded = materializePreset(preset);
    const next = structuredClone(loaded.spec);

    setSelectedPresetKey(preset.key);
    setDraft(next);
    setCompilationContext(
      loaded.designBundle && loaded.compilationManifest
        ? {
            bundle: structuredClone(loaded.designBundle),
            manifest: structuredClone(loaded.compilationManifest)
          }
        : null
    );
    setResult(null);
    setSelectedTaskId(next.tasks[0]?.id ?? "");
    setNotice(
      "Loaded " +
        preset.label +
        ". " +
        preset.description +
        (loaded.compilationManifest
          ? " Compiled from versioned design/config/profile inputs with manifest provenance."
          : "")
    );
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
      let simulationSpec = draft;
      let runCompilationContext = compilationContext;

      if (compilationContext) {
        const compiled = compileWorkflowDesignDetailed(
          compilationContext.bundle.design,
          compilationContext.bundle.runConfiguration,
          compilationContext.bundle.systemProfile
        );
        simulationSpec = compiled.workflowSpec;
        runCompilationContext = {
          bundle: compilationContext.bundle,
          manifest: compiled.manifest
        };
      }

      localEngineAdapter.validate(simulationSpec);
      const nextResult = await localEngineAdapter.simulate(simulationSpec);
      const runId = nextId("run", runs.map((run) => run.id));
      const label = simulationSpec.name + " · " + runId;

      const record: RunRecord = runCompilationContext
        ? createRunRecord({
            id: runId,
            design: runCompilationContext.bundle.design,
            runConfiguration: runCompilationContext.bundle.runConfiguration,
            systemProfile: runCompilationContext.bundle.systemProfile,
            compiledWorkflowSpec: simulationSpec,
            compilationManifest: runCompilationContext.manifest,
            simulationResult: nextResult,
            metadata: {
              label,
              createdAt: Date.now(),
              presetKey: selectedPresetKey || undefined
            }
          })
        : ({
            schemaVersion: 1,
            sourceKind: "direct-workflow-spec",
            id: runId,
            createdAt: Date.now(),
            label,
            spec: structuredClone(simulationSpec),
            result: structuredClone(nextResult)
          } satisfies DirectRunRecord);

      setDraft(structuredClone(simulationSpec));
      setCompilationContext(runCompilationContext);
      setRuns((current) => [...current, record]);
      setResult(nextResult);
      setNotice("Simulation complete. Saved " + runId + " for comparison.");
      setView("explore");
    } catch (error: unknown) {
      setResult(null);
      setNotice(
        error instanceof Error
          ? "Simulation failed: " + error.message
          : "Simulation failed."
      );
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
          compilationContext={compilationContext}
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
          compilationContext={compilationContext}
          onReturnToBuilder={() => setView("builder")}
        />
      ) : null}

      {view === "compare" ? <CompareView runs={runs} /> : null}
    </AppShell>
  );
}
