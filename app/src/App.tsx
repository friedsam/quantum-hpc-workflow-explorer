import { useMemo, useState } from "react";
import {
  cloneWorkflowSpec,
  fixtures,
  getFixture,
  validateWorkflowSpec,
  type FixturePair,
  type Metrics,
  type SimulationResult,
  type TaskSpec,
  type ValidationIssue,
  type WorkflowSpec
} from "./model";

type ViewId = "builder" | "explore" | "compare";

const viewLabels: Record<ViewId, string> = {
  builder: "Builder",
  explore: "Explore",
  compare: "Compare"
};

function formatSeconds(value: number): string {
  return value < 60 ? value.toFixed(2) + " s" : (value / 60).toFixed(2) + " min";
}

function formatRatio(value: number | undefined): string {
  return value === undefined ? "—" : (value * 100).toFixed(1) + "%";
}

function formatNumber(value: number | undefined): string {
  return value === undefined ? "—" : value.toFixed(2);
}

function metricValue(metrics: Metrics, key: string): number {
  if (key === "makespan") return metrics.makespanS;
  if (key === "hpcUtil") return metrics.utilizationByPool.hpc ?? 0;
  if (key === "qpuUtil") return metrics.utilizationByPool.qpu ?? 0;
  if (key === "hpcAllocated") return metrics.allocatedResourceSecondsByPool.hpc ?? 0;
  if (key === "hpcIdle") return metrics.idleAllocatedResourceSecondsByPool.hpc ?? 0;
  if (key === "qpuWait") return metrics.queueWaitSecondsByPool.qpu ?? 0;
  if (key === "communication") return metrics.communicationSeconds;
  return 0;
}

function AppShell({
  view,
  setView,
  workflow,
  resultAttached,
  children
}: {
  view: ViewId;
  setView: (view: ViewId) => void;
  workflow: WorkflowSpec;
  resultAttached: boolean;
  children?: React.ReactNode;
}) {
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
        {(Object.keys(viewLabels) as ViewId[]).map((id) => (
          <button
            key={id}
            className={view === id ? "nav-button active" : "nav-button"}
            aria-current={view === id ? "page" : undefined}
            onClick={() => setView(id)}
          >
            {viewLabels[id]}
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

function PresetBar({
  selectedKey,
  loadFixture,
  requestSimulation,
  canRequest
}: {
  selectedKey: string;
  loadFixture: (key: string) => void;
  requestSimulation: () => void;
  canRequest: boolean;
}) {
  return (
    <div className="preset-bar">
      <div>
        <label htmlFor="preset-select">Fixture</label>
        <select id="preset-select" value={selectedKey} onChange={(event) => loadFixture(event.target.value)}>
          {selectedKey === "" ? <option value="" disabled>Custom draft</option> : null}
          {fixtures.map((fixture) => (
            <option key={fixture.key} value={fixture.key}>
              {fixture.label}
            </option>
          ))}
        </select>
      </div>
      <button className="primary-action" disabled={!canRequest} onClick={requestSimulation}>
        Request simulation
      </button>
    </div>
  );
}

function WorkflowMap({
  spec,
  selectedTaskId,
  onSelectTask
}: {
  spec: WorkflowSpec;
  selectedTaskId: string;
  onSelectTask?: (id: string) => void;
}) {
  return (
    <section className="surface workflow-surface" aria-labelledby="workflow-heading">
      <div className="surface-heading">
        <div>
          <p className="section-kicker">Structure</p>
          <h2 id="workflow-heading">Workflow DAG</h2>
        </div>
        <span className="muted-label">layout placeholder pending Agent D</span>
      </div>

      <div className="task-row" role="list" aria-label="Workflow tasks">
        {spec.tasks.map((task, index) => (
          <div className="task-step" key={task.id} role="listitem">
            <button
              className={selectedTaskId === task.id ? "task-card selected" : "task-card"}
              onClick={() => onSelectTask?.(task.id)}
              type="button"
            >
              <span className="task-index">{index + 1}</span>
              <span className="task-title">{task.label}</span>
              <span className="task-meta">
                {task.resourceKind.toUpperCase()} · {task.resourceCount} unit{task.resourceCount === 1 ? "" : "s"}
              </span>
              <span className="task-meta">constant {task.serviceTime.seconds} s</span>
            </button>
            {index < spec.tasks.length - 1 ? <span className="connector" aria-hidden="true">→</span> : null}
          </div>
        ))}
      </div>

      <div className="edge-list" aria-label="Dependencies">
        {spec.dependencies.map((dependency) => (
          <span className="edge-chip" key={dependency.id}>
            {dependency.sourceTaskId} → {dependency.targetTaskId}
            {dependency.fixedLatencyS !== undefined ? " · " + dependency.fixedLatencyS + " s latency" : ""}
          </span>
        ))}
      </div>
    </section>
  );
}

function TaskInspector({ task, updateTask }: { task: TaskSpec | undefined; updateTask: (patch: Partial<TaskSpec>) => void }) {
  if (!task) {
    return (
      <section className="surface inspector-surface">
        <h2>Task inspector</h2>
        <p>Select a task to edit its supported fields.</p>
      </section>
    );
  }

  return (
    <section className="surface inspector-surface" aria-labelledby="task-inspector-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Inspector</p>
          <h2 id="task-inspector-heading">{task.id}</h2>
        </div>
        <span className="resource-badge">{task.resourceKind}</span>
      </div>

      <div className="form-stack">
        <label>
          <span>Label</span>
          <input value={task.label} onChange={(event) => updateTask({ label: event.target.value })} />
        </label>
        <label>
          <span>Resource units</span>
          <input
            type="number"
            min="1"
            step="1"
            value={task.resourceCount}
            onChange={(event) => updateTask({ resourceCount: Number(event.target.value) })}
          />
        </label>
        <label>
          <span>Constant service time (s)</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={task.serviceTime.seconds}
            onChange={(event) => updateTask({ serviceTime: { ...task.serviceTime, seconds: Number(event.target.value) } })}
          />
        </label>
      </div>
      <p className="field-note">No values are clamped or normalized. Invalid values remain explicit until corrected.</p>
    </section>
  );
}

function PolicyEditor({ spec, updatePolicy }: { spec: WorkflowSpec; updatePolicy: (patch: Partial<WorkflowSpec["policy"]>) => void }) {
  return (
    <section className="surface inspector-surface" aria-labelledby="policy-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Policy</p>
          <h2 id="policy-heading">Scheduling assumptions</h2>
        </div>
      </div>
      <div className="form-stack">
        <label>
          <span>Allocation</span>
          <select value={spec.policy.allocation} onChange={(event) => updatePolicy({ allocation: event.target.value as WorkflowSpec["policy"]["allocation"] })}>
            <option value="fixed">fixed</option>
            <option value="release-aware">release-aware</option>
          </select>
        </label>
        <label>
          <span>Max in-flight quantum</span>
          <input
            type="number"
            min="1"
            step="1"
            value={spec.policy.maxInFlightQuantum ?? ""}
            onChange={(event) => updatePolicy({ maxInFlightQuantum: Number(event.target.value) })}
          />
        </label>
        <label>
          <span>Batching</span>
          <input
            type="number"
            min="1"
            step="1"
            value={spec.policy.batching ?? ""}
            onChange={(event) => updatePolicy({ batching: Number(event.target.value) })}
          />
        </label>
      </div>
    </section>
  );
}

function ValidationPanel({ issues }: { issues: ValidationIssue[] }) {
  const errors = issues.filter((issue) => issue.severity === "error");
  return (
    <section className="surface validation-surface" aria-live="polite" aria-labelledby="validation-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Input contract</p>
          <h2 id="validation-heading">Validation</h2>
        </div>
        <span className={errors.length === 0 ? "status-chip ok" : "status-chip error"}>
          {errors.length === 0 ? "valid" : errors.length + " error" + (errors.length === 1 ? "" : "s")}
        </span>
      </div>
      {issues.length === 0 ? (
        <p className="validation-ok">No structural input errors detected.</p>
      ) : (
        <ul className="issue-list">
          {issues.map((issue, index) => (
            <li key={issue.path + index} className={issue.severity}>
              <strong>{issue.path}</strong> — {issue.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BuilderView({
  spec,
  selectedTaskId,
  setSelectedTaskId,
  updateTask,
  updatePolicy,
  issues,
  selectedFixtureKey,
  loadFixture,
  requestSimulation,
  notice
}: {
  spec: WorkflowSpec;
  selectedTaskId: string;
  setSelectedTaskId: (id: string) => void;
  updateTask: (patch: Partial<TaskSpec>) => void;
  updatePolicy: (patch: Partial<WorkflowSpec["policy"]>) => void;
  issues: ValidationIssue[];
  selectedFixtureKey: string;
  loadFixture: (key: string) => void;
  requestSimulation: () => void;
  notice: string;
}) {
  const selectedTask = spec.tasks.find((task) => task.id === selectedTaskId);
  const hasErrors = issues.some((issue) => issue.severity === "error");

  return (
    <div className="view-stack">
      <div className="view-heading">
        <div>
          <p className="section-kicker">Define</p>
          <h2>Builder</h2>
          <p>Create an explicit workflow configuration. Editing detaches any stale simulation result.</p>
        </div>
        <PresetBar selectedKey={selectedFixtureKey} loadFixture={loadFixture} requestSimulation={requestSimulation} canRequest={!hasErrors} />
      </div>

      {notice ? <div className="notice" role="status">{notice}</div> : null}

      <div className="builder-grid">
        <div className="builder-main">
          <WorkflowMap spec={spec} selectedTaskId={selectedTaskId} onSelectTask={setSelectedTaskId} />
          <ValidationPanel issues={issues} />
        </div>
        <aside className="builder-side">
          <TaskInspector task={selectedTask} updateTask={updateTask} />
          <PolicyEditor spec={spec} updatePolicy={updatePolicy} />
        </aside>
      </div>
    </div>
  );
}

function MetricsGrid({ result }: { result: SimulationResult }) {
  const rows = [
    ["Makespan", formatSeconds(result.metrics.makespanS)],
    ["HPC utilization", formatRatio(result.metrics.utilizationByPool.hpc)],
    ["QPU utilization", formatRatio(result.metrics.utilizationByPool.qpu)],
    ["HPC allocated resource-seconds", formatNumber(result.metrics.allocatedResourceSecondsByPool.hpc)],
    ["HPC idle allocated resource-seconds", formatNumber(result.metrics.idleAllocatedResourceSecondsByPool.hpc)],
    ["QPU queue wait", formatSeconds(result.metrics.queueWaitSecondsByPool.qpu ?? 0)],
    ["Communication", formatSeconds(result.metrics.communicationSeconds)]
  ];

  return (
    <section className="surface" aria-labelledby="metrics-heading">
      <div className="surface-heading">
        <div>
          <p className="section-kicker">Authoritative output</p>
          <h2 id="metrics-heading">Metrics</h2>
        </div>
        <span className="muted-label">SimulationResult.metrics</span>
      </div>
      <div className="metric-grid">
        {rows.map(([label, value]) => (
          <div className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function Timeline({ spec, result }: { spec: WorkflowSpec; result: SimulationResult }) {
  const makespan = Math.max(result.metrics.makespanS, 0.000001);
  const taskLabels = new Map(spec.tasks.map((task) => [task.id, task.label]));

  return (
    <section className="surface" aria-labelledby="timeline-heading">
      <div className="surface-heading">
        <div>
          <p className="section-kicker">Trace view</p>
          <h2 id="timeline-heading">Task timeline</h2>
        </div>
        <span className="muted-label">positioned from returned timestamps</span>
      </div>
      <div className="timeline-scale" aria-hidden="true"><span>0 s</span><span>{makespan.toFixed(2)} s</span></div>
      <div className="timeline-list">
        {result.taskIntervals.map((interval, index) => {
          const left = (interval.startS / makespan) * 100;
          const width = Math.max(((interval.endS - interval.startS) / makespan) * 100, 1.5);
          return (
            <div className="timeline-row" key={interval.taskId + interval.state + index}>
              <div className="timeline-label">
                <strong>{taskLabels.get(interval.taskId) ?? interval.taskId}</strong>
                <span>{interval.state} · {interval.startS.toFixed(2)}–{interval.endS.toFixed(2)} s</span>
              </div>
              <div className="timeline-track">
                <div className={"timeline-bar " + interval.state} style={{ left: left + "%", width: width + "%" }}>
                  <span>{interval.state}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}


function ResourceTimeline({ result }: { result: SimulationResult }) {
  const makespan = Math.max(result.metrics.makespanS, 0.000001);

  return (
    <section className="surface" aria-labelledby="resource-timeline-heading">
      <div className="surface-heading">
        <div>
          <p className="section-kicker">Resource state</p>
          <h2 id="resource-timeline-heading">Allocation timeline</h2>
        </div>
        <span className="muted-label">direct ResourceInterval states</span>
      </div>
      <div className="resource-legend" aria-label="Resource state legend">
        <span><i className="legend-swatch active" />active</span>
        <span><i className="legend-swatch allocated-idle" />allocated-idle</span>
        <span><i className="legend-swatch released" />released</span>
      </div>
      <div className="timeline-list">
        {result.resourceIntervals.map((interval, index) => {
          const left = (interval.startS / makespan) * 100;
          const width = Math.max(((interval.endS - interval.startS) / makespan) * 100, 1.5);
          return (
            <div className="timeline-row" key={interval.resourcePoolId + interval.state + index}>
              <div className="timeline-label">
                <strong>{interval.resourcePoolId} · {interval.units} unit{interval.units === 1 ? "" : "s"}</strong>
                <span>{interval.state} · {interval.startS.toFixed(2)}–{interval.endS.toFixed(2)} s</span>
              </div>
              <div className="timeline-track">
                <div className={"timeline-bar resource " + interval.state} style={{ left: left + "%", width: width + "%" }}>
                  <span>{interval.state}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="field-note">Policy-held ready time is not inferred from v0 resource or queue data. It requires an explicit v1 state if adopted.</p>
    </section>
  );
}

function QueueEvidence({ result }: { result: SimulationResult }) {
  return (
    <section className="surface" aria-labelledby="queue-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Queue evidence</p>
          <h2 id="queue-heading">Returned samples</h2>
        </div>
      </div>
      <div className="queue-table" role="table" aria-label="Queue samples">
        {result.queueSeries.map((sample, index) => (
          <div className="queue-row" role="row" key={sample.resourcePoolId + sample.simTimeS + index}>
            <span role="cell">{sample.simTimeS.toFixed(2)} s</span>
            <span role="cell">{sample.resourcePoolId}</span>
            <strong role="cell">depth {sample.depth}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function Assumptions({ result }: { result: SimulationResult }) {
  return (
    <section className="surface assumptions" aria-labelledby="assumptions-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Provenance</p>
          <h2 id="assumptions-heading">Assumptions</h2>
        </div>
      </div>
      <ul>
        {result.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}
      </ul>
    </section>
  );
}

function ExploreView({ spec, result, goToBuilder }: { spec: WorkflowSpec; result: SimulationResult | null; goToBuilder: () => void }) {
  if (!result) {
    return (
      <section className="empty-state">
        <p className="section-kicker">No attached result</p>
        <h2>This draft has not been simulated.</h2>
        <p>The UI intentionally does not estimate replacement metrics. Connect the engine adapter or reload a fixture pair.</p>
        <button className="primary-action" onClick={goToBuilder}>Return to Builder</button>
      </section>
    );
  }

  return (
    <div className="view-stack">
      <div className="view-heading">
        <div>
          <p className="section-kicker">Inspect</p>
          <h2>Explore result</h2>
          <p>Workflow context and exact returned metrics remain visibly separated from presentation.</p>
        </div>
      </div>
      <WorkflowMap spec={spec} selectedTaskId="" />
      <MetricsGrid result={result} />
      <Timeline spec={spec} result={result} />
      <div className="two-up">
        <QueueEvidence result={result} />
        <Assumptions result={result} />
      </div>
    </div>
  );
}

const compareRows = [
  { key: "makespan", label: "Makespan", format: (value: number) => formatSeconds(value) },
  { key: "hpcUtil", label: "HPC utilization", format: (value: number) => formatRatio(value) },
  { key: "qpuUtil", label: "QPU utilization", format: (value: number) => formatRatio(value) },
  { key: "hpcAllocated", label: "HPC allocated resource-seconds", format: (value: number) => formatNumber(value) },
  { key: "hpcIdle", label: "HPC idle allocated resource-seconds", format: (value: number) => formatNumber(value) },
  { key: "qpuWait", label: "QPU queue wait", format: (value: number) => formatSeconds(value) },
  { key: "communication", label: "Communication", format: (value: number) => formatSeconds(value) }
];

function ConfigSummary({ fixture }: { fixture: FixturePair }) {
  return (
    <div className="config-summary">
      <strong>{fixture.spec.name}</strong>
      <span>{fixture.spec.policy.allocation}</span>
      <span>in-flight Q: {fixture.spec.policy.maxInFlightQuantum ?? "—"}</span>
      <span>batch: {fixture.spec.policy.batching ?? "—"}</span>
    </div>
  );
}

function CompareView() {
  const [leftKey, setLeftKey] = useState(fixtures[0].key);
  const [rightKey, setRightKey] = useState(fixtures[1]?.key ?? fixtures[0].key);
  const left = getFixture(leftKey);
  const right = getFixture(rightKey);

  return (
    <div className="view-stack">
      <div className="view-heading">
        <div>
          <p className="section-kicker">Contrast</p>
          <h2>Compare configurations</h2>
          <p>Values come from each attached result. The delta is B minus A and is not an automatic ranking.</p>
        </div>
      </div>

      <section className="surface compare-controls" aria-label="Comparison configuration selectors">
        <label>
          <span>Configuration A</span>
          <select value={leftKey} onChange={(event) => setLeftKey(event.target.value)}>
            {fixtures.map((fixture) => <option value={fixture.key} key={fixture.key}>{fixture.label}</option>)}
          </select>
        </label>
        <label>
          <span>Configuration B</span>
          <select value={rightKey} onChange={(event) => setRightKey(event.target.value)}>
            {fixtures.map((fixture) => <option value={fixture.key} key={fixture.key}>{fixture.label}</option>)}
          </select>
        </label>
      </section>

      <div className="two-up">
        <section className="surface"><p className="section-kicker">A</p><ConfigSummary fixture={left} /><p>{left.description}</p></section>
        <section className="surface"><p className="section-kicker">B</p><ConfigSummary fixture={right} /><p>{right.description}</p></section>
      </div>

      <section className="surface compare-table-wrap" aria-labelledby="compare-metrics-heading">
        <div className="surface-heading"><div><p className="section-kicker">Authoritative outputs</p><h2 id="compare-metrics-heading">Metric comparison</h2></div></div>
        <div className="compare-table" role="table">
          <div className="compare-row compare-header" role="row">
            <strong role="columnheader">Metric</strong><strong role="columnheader">A</strong><strong role="columnheader">B</strong><strong role="columnheader">B − A</strong>
          </div>
          {compareRows.map((row) => {
            const a = metricValue(left.result.metrics, row.key);
            const b = metricValue(right.result.metrics, row.key);
            const delta = b - a;
            return (
              <div className="compare-row" role="row" key={row.key}>
                <span role="cell">{row.label}</span>
                <strong role="cell">{row.format(a)}</strong>
                <strong role="cell">{row.format(b)}</strong>
                <span role="cell">{delta > 0 ? "+" : ""}{row.format(delta)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="two-up">
        <Assumptions result={left.result} />
        <Assumptions result={right.result} />
      </div>
    </div>
  );
}

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

  function requestSimulation() {
    setSelectedFixtureKey("");
    setResult(null);
    setNotice("Engine adapter is not connected on Agent C. No metrics were generated; this draft remains unsimulated.");
  }

  return (
    <AppShell view={view} setView={setView} workflow={draft} resultAttached={result !== null}>
      {view === "builder" ? (
        <BuilderView
          spec={draft}
          selectedTaskId={selectedTaskId}
          setSelectedTaskId={setSelectedTaskId}
          updateTask={updateTask}
          updatePolicy={updatePolicy}
          issues={issues}
          selectedFixtureKey={selectedFixtureKey}
          loadFixture={loadFixture}
          requestSimulation={requestSimulation}
          notice={notice}
        />
      ) : null}
      {view === "explore" ? <ExploreView spec={draft} result={result} goToBuilder={() => setView("builder")} /> : null}
      {view === "compare" ? <CompareView /> : null}
    </AppShell>
  );
}
