import { useState } from "react";
import type { SimulationResult, WorkflowSpec } from "../../domain/types";
import { WorkflowDag } from "../graph/WorkflowDag";
import { projectWorkflowDag } from "../graph/projectWorkflow";
import { MetricsGrid } from "./MetricsGrid";
import { QueueEvidence, Assumptions } from "./ResultEvidence";
import { ResourceStateDiagram } from "./ResourceStateDiagram";
import { ResourceTimeline } from "./ResourceTimeline";
import { TaskTimeline } from "./TaskTimeline";

interface Props {
  spec: WorkflowSpec;
  result: SimulationResult | null;
  onReturnToBuilder: () => void;
}

export function ExploreView({ spec, result, onReturnToBuilder }: Props) {
  const [inspectionTimeS, setInspectionTimeS] = useState(0);

  if (!result) {
    return (
      <section className="empty-state">
        <p className="section-kicker">No attached result</p>
        <h2>This draft has not been simulated.</h2>
        <p>Run a valid workflow in Builder. The UI does not estimate replacement metrics.</p>
        <button className="primary-action" onClick={onReturnToBuilder}>Return to Builder</button>
      </section>
    );
  }

  const inspectionTime = Math.min(inspectionTimeS, result.metrics.makespanS);

  return (
    <div className="view-stack">
      <div className="view-heading">
        <div>
          <p className="section-kicker">Inspect</p>
          <h2>Explore result</h2>
          <p>The frozen v1 engine is authoritative for execution order, state intervals, queues and metrics.</p>
        </div>
      </div>

      <WorkflowDag model={projectWorkflowDag(spec)} />
      <MetricsGrid spec={spec} result={result} />

      <section className="surface time-inspector" aria-labelledby="time-inspector-heading">
        <div>
          <p className="section-kicker">Inspect simulation time</p>
          <h2 id="time-inspector-heading">{inspectionTime.toFixed(2)} s</h2>
        </div>
        <input
          aria-label="Simulation time"
          type="range"
          min="0"
          max={result.metrics.makespanS}
          step={Math.max(result.metrics.makespanS / 200, 0.01)}
          value={inspectionTime}
          onChange={(event) => setInspectionTimeS(Number(event.target.value))}
        />
        <span className="muted-label">Manual inspection only; Agent B playback will drive the same presentation boundary after compatibility review.</span>
      </section>

      <ResourceStateDiagram spec={spec} result={result} simTimeS={inspectionTime} />
      <TaskTimeline spec={spec} result={result} />
      <ResourceTimeline result={result} />

      <div className="two-up">
        <QueueEvidence result={result} />
        <Assumptions result={result} />
      </div>
    </div>
  );
}
