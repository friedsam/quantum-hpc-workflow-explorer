import { useCallback, useEffect, useMemo, useState } from "react";
import { deriveSystemStateSnapshot } from "../../causal/systemState.mjs";
import {
  deriveActorGroupSummaryAt,
  deriveActorStateDetailAt
} from "../../design/actor-state.mjs";
import type { SimulationResult, WorkflowSpec } from "../../domain/types";
import {
  attachActorStateToSystemSnapshot
} from "../../playback/actor-aware-view.mjs";
import type { CompilationContext } from "../../uiTypes";
import { WorkflowDag } from "../graph/WorkflowDag";
import { deriveLogicalDagRuntime } from "../graph/logicalRuntime";
import { projectDesignDag } from "../graph/projectDesign";
import { projectWorkflowDag } from "../graph/projectWorkflow";
import { CompilationProvenance } from "../shared/CompilationProvenance";
import { AnalyticalStrips } from "./AnalyticalStrips";
import { FullSystemDebugger } from "./FullSystemDebugger";
import { MetricsGrid } from "./MetricsGrid";
import { PlaybackDiagnostics } from "./PlaybackDiagnostics";
import { QueueEvidence, Assumptions } from "./ResultEvidence";
import { ResourceTimeline } from "./ResourceTimeline";
import { SimpleExplorerSummary } from "./SimpleExplorerSummary";
import { SimplePlaybackBar } from "./SimplePlaybackBar";
import { TaskTimeline } from "./TaskTimeline";
import { useExplorerPlayback } from "./useExplorerPlayback";

interface Props {
  spec: WorkflowSpec;
  result: SimulationResult | null;
  compilationContext: CompilationContext | null;
  onReturnToBuilder: () => void;
}

function SimulatedExplore({
  spec,
  result,
  compilationContext
}: {
  spec: WorkflowSpec;
  result: SimulationResult;
  compilationContext: CompilationContext | null;
}) {
  const [inspectionTimeS, setInspectionTimeS] = useState(0);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const expandedDiagnosticsAllowed = spec.tasks.length <= 500;

  useEffect(() => {
    setInspectionTimeS(0);
  }, [result]);

  const playbackTimeChanged = useCallback((simTimeS: number) => {
    setInspectionTimeS(simTimeS);
  }, []);

  const inspectionTime = Math.min(
    inspectionTimeS,
    result.metrics.makespanS
  );

  const genericSnapshot = useMemo(
    () => deriveSystemStateSnapshot(spec, result, inspectionTime),
    [spec, result, inspectionTime]
  );

  const manifest = compilationContext?.manifest ?? null;

  const snapshot = useMemo(
    () =>
      attachActorStateToSystemSnapshot(
        genericSnapshot,
        manifest ?? undefined,
        result,
        manifest ? deriveActorStateDetailAt : undefined,
        manifest ? deriveActorGroupSummaryAt : undefined
      ),
    [genericSnapshot, manifest, result]
  );

  const playback = useExplorerPlayback(
    result,
    manifest,
    inspectionTime,
    playbackTimeChanged
  );

  const logicalDag = useMemo(
    () =>
      compilationContext
        ? projectDesignDag(compilationContext.bundle)
        : null,
    [compilationContext]
  );

  const logicalRuntime = useMemo(
    () =>
      compilationContext && manifest
        ? deriveLogicalDagRuntime(
            compilationContext.bundle.design,
            manifest,
            genericSnapshot
          )
        : undefined,
    [compilationContext, manifest, genericSnapshot]
  );

  return (
    <div className="view-stack simple-explorer">
      <div className="view-heading simple-explore-heading">
        <div>
          <p className="section-kicker">Explore</p>
          <h2>
            {compilationContext?.bundle.design.name ?? spec.name}
          </h2>
          <p>
            Logical workflow state first. Expanded DES/resource evidence is
            available under Advanced / Diagnostics.
          </p>
        </div>
      </div>

      <SimpleExplorerSummary
        bundle={compilationContext?.bundle ?? null}
        manifest={manifest}
        spec={spec}
        snapshot={snapshot}
      />

      {logicalDag ? (
        <WorkflowDag
          model={logicalDag}
          runtimeByNodeId={logicalRuntime}
          heading="Logical workflow"
          logical
        />
      ) : (
        <WorkflowDag
          model={projectWorkflowDag(spec)}
          debugSnapshot={genericSnapshot}
          heading="Direct WorkflowSpec"
        />
      )}

      <SimplePlaybackBar
        result={result}
        cursorTimeS={inspectionTime}
        onTimeChange={setInspectionTimeS}
        playback={playback}
      />

      <details
        className="advanced-diagnostics explore-advanced"
        onToggle={(event) =>
          setAdvancedOpen(event.currentTarget.open)
        }
      >
        <summary>Advanced / Diagnostics</summary>
        {advancedOpen ? (
        <div className="advanced-stack">
          <p className="field-note advanced-intro">
            Expanded DES structure, exact resource accounting, metrics,
            provenance and source-event details.
          </p>

          {compilationContext && manifest ? (
            <CompilationProvenance
              bundle={compilationContext.bundle}
              manifest={manifest}
              compact
            />
          ) : null}

          <MetricsGrid spec={spec} result={result} />

          {expandedDiagnosticsAllowed ? (
            <>
              <WorkflowDag
                model={projectWorkflowDag(spec)}
                debugSnapshot={genericSnapshot}
                heading="Expanded compiled DES graph"
              />

              <FullSystemDebugger
                spec={spec}
                snapshot={genericSnapshot}
              />

              <AnalyticalStrips
                spec={spec}
                result={result}
                simTimeS={inspectionTime}
                onTimeChange={setInspectionTimeS}
              />

              <TaskTimeline spec={spec} result={result} />
              <ResourceTimeline result={result} />
            </>
          ) : (
            <section className="surface">
              <p className="section-kicker">Scale-aware diagnostics</p>
              <h2>Expanded task-level views omitted</h2>
              <p className="field-note">
                This run contains {spec.tasks.length} compiled tasks. Automatic
                React Flow / ELK layout, per-task timelines, and task-level
                debugger cards are not mounted above 500 tasks. Metrics,
                playback provenance, queue evidence, and assumptions remain
                available.
              </p>
            </section>
          )}

          <PlaybackDiagnostics playback={playback} />

          <div className="two-up">
            {expandedDiagnosticsAllowed ? (
              <QueueEvidence result={result} />
            ) : null}
            <Assumptions result={result} />
          </div>
        </div>
        ) : null}
      </details>
    </div>
  );
}

export function ExploreView({
  spec,
  result,
  compilationContext,
  onReturnToBuilder
}: Props) {
  if (!result) {
    return (
      <section className="empty-state">
        <p className="section-kicker">No attached result</p>
        <h2>This workflow has not been simulated.</h2>
        <p>
          Run a valid workflow in Builder. The UI does not estimate
          replacement metrics.
        </p>
        <button className="primary-action" onClick={onReturnToBuilder}>
          Return to Builder
        </button>
      </section>
    );
  }

  return (
    <SimulatedExplore
      key={result.workflowId}
      spec={spec}
      result={result}
      compilationContext={compilationContext}
    />
  );
}
