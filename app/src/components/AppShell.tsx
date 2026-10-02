import type { ReactNode } from "react";
import type { WorkflowSpec } from "../domain/types";

export type ViewId = "builder" | "explore" | "compare";

const labels: Record<ViewId, string> = {
  builder: "Builder",
  explore: "Explore",
  compare: "Compare"
};

interface Props {
  view: ViewId;
  onViewChange: (view: ViewId) => void;
  workflow: WorkflowSpec;
  resultAttached: boolean;
  runCount: number;
  children: ReactNode;
}

export function AppShell({ view, onViewChange, workflow, resultAttached, runCount, children }: Props) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <div className="eyebrow">Quantum–HPC Workflow Explorer</div>
          <h1>Pre-execution workflow planning</h1>
        </div>
        <div className="header-status" aria-label="Current workflow state">
          <span className="status-label">{workflow.name}</span>
          <span className={resultAttached ? "status-chip ok" : "status-chip stale"}>
            {resultAttached ? "result attached" : "draft · unsimulated"}
          </span>
          <span className="status-chip">{runCount} saved run{runCount === 1 ? "" : "s"}</span>
        </div>
      </header>

      <nav className="primary-nav" aria-label="Primary">
        {(Object.keys(labels) as ViewId[]).map((id) => (
          <button
            key={id}
            className={view === id ? "nav-button active" : "nav-button"}
            aria-current={view === id ? "page" : undefined}
            onClick={() => onViewChange(id)}
          >
            {labels[id]}
          </button>
        ))}
      </nav>

      <div className="source-strip">
        <strong>Source of truth:</strong> Builder creates the frozen-v1 WorkflowSpec; the ported v1 engine produces SimulationResult; UI only renders or compares returned values.
      </div>

      <main className="workspace">{children}</main>
    </div>
  );
}
