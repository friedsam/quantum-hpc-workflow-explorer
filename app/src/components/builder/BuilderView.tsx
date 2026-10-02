import type { TaskSpec, ValidationIssue, WorkflowSpec } from "../../contracts";
import { WorkflowDag } from "../graph/WorkflowDag";
import { projectWorkflowDag } from "../graph/projectWorkflow";
import { PolicyEditor } from "./PolicyEditor";
import { PresetBar } from "./PresetBar";
import { TaskInspector } from "./TaskInspector";
import { ValidationPanel } from "./ValidationPanel";

interface Props {
  spec: WorkflowSpec;
  selectedTaskId: string;
  onSelectTask: (taskId: string) => void;
  onUpdateTask: (patch: Partial<TaskSpec>) => void;
  onUpdatePolicy: (patch: Partial<WorkflowSpec["policy"]>) => void;
  issues: ValidationIssue[];
  selectedFixtureKey: string;
  onLoadFixture: (key: string) => void;
  onRequestSimulation: () => void;
  notice: string;
}

export function BuilderView({
  spec,
  selectedTaskId,
  onSelectTask,
  onUpdateTask,
  onUpdatePolicy,
  issues,
  selectedFixtureKey,
  onLoadFixture,
  onRequestSimulation,
  notice
}: Props) {
  const selectedTask = spec.tasks.find((task) => task.id === selectedTaskId);
  const hasErrors = issues.some((issue) => issue.severity === "error");
  const dag = projectWorkflowDag(spec);

  return (
    <div className="view-stack">
      <div className="view-heading">
        <div>
          <p className="section-kicker">Define</p>
          <h2>Builder</h2>
          <p>Create an explicit workflow configuration. Editing detaches any stale simulation result.</p>
        </div>
        <PresetBar
          selectedKey={selectedFixtureKey}
          onLoadFixture={onLoadFixture}
          onRequestSimulation={onRequestSimulation}
          canRequest={!hasErrors}
        />
      </div>

      {notice ? <div className="notice" role="status">{notice}</div> : null}

      <div className="builder-grid">
        <div className="builder-main">
          <WorkflowDag model={dag} selectedTaskId={selectedTaskId} onSelectTask={onSelectTask} />
          <ValidationPanel issues={issues} />
        </div>
        <aside className="builder-side">
          <TaskInspector task={selectedTask} onUpdate={onUpdateTask} />
          <PolicyEditor spec={spec} onUpdate={onUpdatePolicy} />
        </aside>
      </div>
    </div>
  );
}
