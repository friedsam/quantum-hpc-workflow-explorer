import { useMemo, useState } from "react";
import {
  cloneWorkflowSpec,
  getFixture,
  validateWorkflowSpec,
  type SimulationResult,
  type TaskSpec,
  type WorkflowSpec
} from "./contracts";
import { AppShell, type ViewId } from "./components/AppShell";
import { BuilderView } from "./components/builder/BuilderView";
import { CompareView } from "./components/compare/CompareView";
import { ExploreView } from "./components/explore/ExploreView";
import { unavailableEngineAdapter } from "./services/engineAdapter";

export default function App() {
  const initialFixture = getFixture("baseline");
  const [view, setView] = useState<ViewId>("builder");
  const [selectedFixtureKey, setSelectedFixtureKey] = useState(initialFixture.key);
  const [draft, setDraft] = useState<WorkflowSpec>(() => cloneWorkflowSpec(initialFixture.spec));
  const [result, setResult] = useState<SimulationResult | null>(initialFixture.result);
  const [selectedTaskId, setSelectedTaskId] = useState(initialFixture.spec.tasks[0]?.id ?? "");
  const [notice, setNotice] = useState("");

  const issues = useMemo(() => validateWorkflowSpec(draft), [draft]);

  function markDraft(next: WorkflowSpec) {
    setSelectedFixtureKey("");
    setDraft(next);
    setResult(null);
    setNotice("Draft changed. The previous result was detached rather than recomputed in the UI.");
  }

  function updateTask(patch: Partial<TaskSpec>) {
    markDraft({
      ...draft,
      tasks: draft.tasks.map((task) => task.id === selectedTaskId ? { ...task, ...patch } : task)
    });
  }

  function updatePolicy(patch: Partial<WorkflowSpec["policy"]>) {
    markDraft({ ...draft, policy: { ...draft.policy, ...patch } });
  }

  function loadFixture(key: string) {
    const fixture = getFixture(key);
    setSelectedFixtureKey(fixture.key);
    setDraft(cloneWorkflowSpec(fixture.spec));
    setResult(fixture.result);
    setSelectedTaskId(fixture.spec.tasks[0]?.id ?? "");
    setNotice("Loaded paired fixture: explicit WorkflowSpec + SimulationResult.");
  }

  async function requestSimulation() {
    setSelectedFixtureKey("");
    setResult(null);
    setNotice("Simulation request sent to the UI engine-adapter seam.");

    try {
      const nextResult = await unavailableEngineAdapter.simulate(draft);
      setResult(nextResult);
      setView("explore");
      setNotice("Simulation result attached.");
    } catch (error: unknown) {
      setNotice(
        error instanceof Error
          ? error.message + " No fallback metrics were generated."
          : "Simulation engine unavailable. No fallback metrics were generated."
      );
    }
  }

  return (
    <AppShell view={view} onViewChange={setView} workflow={draft} resultAttached={result !== null}>
      {view === "builder" ? (
        <BuilderView
          spec={draft}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
          onUpdateTask={updateTask}
          onUpdatePolicy={updatePolicy}
          issues={issues}
          selectedFixtureKey={selectedFixtureKey}
          onLoadFixture={loadFixture}
          onRequestSimulation={requestSimulation}
          notice={notice}
        />
      ) : null}
      {view === "explore" ? (
        <ExploreView spec={draft} result={result} onReturnToBuilder={() => setView("builder")} />
      ) : null}
      {view === "compare" ? <CompareView /> : null}
    </AppShell>
  );
}
