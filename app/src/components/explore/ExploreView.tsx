import type { SimulationResult, WorkflowSpec } from "../../contracts";
import { WorkflowDag } from "../graph/WorkflowDag";
import { projectWorkflowDag } from "../graph/projectWorkflow";
import { MetricsGrid } from "./MetricsGrid";
import { QueueEvidence, Assumptions } from "./ResultEvidence";
import { ResourceTimeline } from "./ResourceTimeline";
import { TaskTimeline } from "./TaskTimeline";

interface Props {
  spec: WorkflowSpec;
  result: SimulationResult | null;
  onReturnToBuilder: () => void;
}

export function ExploreView({ spec, result, onReturnToBuilder }: Props) {
  if (!result) {
    return (
      <section className="empty-state">
        <p className="section-kicker">No attached result</p>
        <h2>This draft has not been simulated.</h2>
        <p>The UI intentionally does not estimate replacement metrics. Connect the engine adapter or reload a fixture pair.</p>
        <button className="primary-action" onClick={onReturnToBuilder}>Return to Builder</button>
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
      <WorkflowDag model={projectWorkflowDag(spec)} />
      <MetricsGrid spec={spec} result={result} />
      <TaskTimeline spec={spec} result={result} />
      <ResourceTimeline result={result} />
      <div className="two-up">
        <QueueEvidence result={result} />
        <Assumptions result={result} />
      </div>
    </div>
  );
}
