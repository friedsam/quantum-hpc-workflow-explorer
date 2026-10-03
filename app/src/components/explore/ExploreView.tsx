import { useCallback, useEffect, useMemo, useState } from "react";
import { deriveSystemStateSnapshot } from "../../causal/systemState.mjs";
import type { SimulationResult, WorkflowSpec } from "../../domain/types";
import type { CompilationContext } from "../../uiTypes";
import { WorkflowDag } from "../graph/WorkflowDag";
import { projectWorkflowDag } from "../graph/projectWorkflow";
import { CompilationProvenance } from "../shared/CompilationProvenance";
import { AnalyticalStrips } from "./AnalyticalStrips";
import { FullSystemDebugger } from "./FullSystemDebugger";
import { MetricsGrid } from "./MetricsGrid";
import { PlaybackPanel } from "./PlaybackPanel";
import { QueueEvidence, Assumptions } from "./ResultEvidence";
import { ResourceTimeline } from "./ResourceTimeline";
import { TaskTimeline } from "./TaskTimeline";

interface Props {
  spec: WorkflowSpec;
  result: SimulationResult | null;
  compilationContext: CompilationContext | null;
  onReturnToBuilder: () => void;
}

export function ExploreView({
  spec,
  result,
  compilationContext,
  onReturnToBuilder
}: Props) {
  const [inspectionTimeS, setInspectionTimeS] = useState(0);

  useEffect(() => {
    setInspectionTimeS(0);
  }, [result?.workflowId]);

  const playbackTimeChanged = useCallback((simTimeS: number) => {
    setInspectionTimeS(simTimeS);
  }, []);

  const inspectionTime = result
    ? Math.min(inspectionTimeS, result.metrics.makespanS)
    : 0;

  const snapshot = useMemo(
    () =>
      result
        ? deriveSystemStateSnapshot(spec, result, inspectionTime)
        : null,
    [spec, result, inspectionTime]
  );

  if (!result || !snapshot) {
    return (
      <section className="empty-state">
        <p className="section-kicker">No attached result</p>
        <h2>This draft has not been simulated.</h2>
        <p>
          Run a valid workflow in Builder. The UI does not estimate
          replacement metrics.
        </p>
        <button
          className="primary-action"
          onClick={onReturnToBuilder}
        >
          Return to Builder
        </button>
      </section>
    );
  }

  return (
    <div className="view-stack">
      <div className="view-heading">
        <div>
          <p className="section-kicker">Inspect</p>
          <h2>Explore / causal debugger</h2>
          <p>
            One simulation-time cursor drives exact resource state,
            causal explanations, DAG highlighting, analytical strips and
            semantic playback.
          </p>
        </div>
      </div>

      {compilationContext ? (
        <CompilationProvenance
          bundle={compilationContext.bundle}
          manifest={compilationContext.manifest}
          compact
        />
      ) : null}

      <MetricsGrid spec={spec} result={result} />

      <PlaybackPanel
        result={result}
        cursorTimeS={inspectionTime}
        onTimeChange={playbackTimeChanged}
      />

      <section
        className="surface time-inspector"
        aria-labelledby="time-inspector-heading"
      >
        <div>
          <p className="section-kicker">Shared simulation cursor</p>
          <h2 id="time-inspector-heading">
            {inspectionTime.toFixed(2)} s
          </h2>
        </div>
        <input
          aria-label="Simulation time"
          type="range"
          min="0"
          max={result.metrics.makespanS}
          step={Math.max(result.metrics.makespanS / 200, 0.01)}
          value={inspectionTime}
          onChange={(event) =>
            setInspectionTimeS(Number(event.target.value))
          }
        />
        <span className="muted-label">
          Playback, this slider and the analytical strips share this
          cursor. Geometry remains fixed.
        </span>
      </section>

      <FullSystemDebugger spec={spec} snapshot={snapshot} />

      <WorkflowDag
        model={projectWorkflowDag(spec)}
        debugSnapshot={snapshot}
        heading="Workflow DAG lens"
      />

      <AnalyticalStrips
        spec={spec}
        result={result}
        simTimeS={inspectionTime}
        onTimeChange={setInspectionTimeS}
      />

      <TaskTimeline spec={spec} result={result} />
      <ResourceTimeline result={result} />

      <div className="two-up">
        <QueueEvidence result={result} />
        <Assumptions result={result} />
      </div>
    </div>
  );
}
