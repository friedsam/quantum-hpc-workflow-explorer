import type { ReactNode } from "react";
import type { WorkflowSpec } from "../contracts";

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
  children: ReactNode;
}

export function AppShell({ view, onViewChange, workflow, resultAttached, children }: Props) {
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
        <strong>Source of truth:</strong> workflow edits produce WorkflowSpec; displayed metrics come only from SimulationResult.
      </div>

      <main className="workspace">{children}</main>
    </div>
  );
}
