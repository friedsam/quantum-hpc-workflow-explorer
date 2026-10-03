import { useMemo } from "react";
import type { DependencySpec, TaskSpec, WorkflowSpec } from "../../domain/types";
import type { ValidationIssue } from "../../domain/validation";
import { nextId } from "../../domain/id";
import type { CompilationContext } from "../../uiTypes";
import { WorkflowDag } from "../graph/WorkflowDag";
import { projectWorkflowDag } from "../graph/projectWorkflow";
import { CompilationProvenance } from "../shared/CompilationProvenance";
import { DependencyEditor } from "./DependencyEditor";
import { PresetBar } from "./PresetBar";
import { ResourceEditor } from "./ResourceEditor";
import { TaskInspector } from "./TaskInspector";
import { ValidationPanel } from "./ValidationPanel";
import { WorkflowSettings } from "./WorkflowSettings";

interface Props {
  spec: WorkflowSpec;
  compilationContext: CompilationContext | null;
  selectedTaskId: string;
  onSelectTask: (taskId: string) => void;
  onSpecChange: (spec: WorkflowSpec) => void;
  issues: ValidationIssue[];
  selectedPresetKey: string;
  onLoadPreset: (key: string) => void;
  onRequestSimulation: () => void;
  notice: string;
  simulating: boolean;
}

export function BuilderView({
  spec,
  compilationContext,
  selectedTaskId,
  onSelectTask,
  onSpecChange,
  issues,
  selectedPresetKey,
  onLoadPreset,
  onRequestSimulation,
  notice,
  simulating
}: Props) {
  const selectedTask = spec.tasks.find((task) => task.id === selectedTaskId);
  const hasErrors = issues.some((issue) => issue.severity === "error");
  const dag = useMemo(
    () => projectWorkflowDag(spec),
    [spec.tasks, spec.dependencies, spec.resources]
  );

  function addTask() {
    const resource = spec.resources[0];
    if (!resource) return;
    const id = nextId("task", spec.tasks.map((task) => task.id));
    const task: TaskSpec = {
      id,
      label: "New task",
      resourcePoolId: resource.id,
      resourceCount: 1,
      serviceTime: { kind: "constant", seconds: 1 }
    };
    onSpecChange({ ...spec, tasks: [...spec.tasks, task] });
    onSelectTask(id);
  }

  function updateTask(patch: Partial<TaskSpec>) {
    onSpecChange({
      ...spec,
      tasks: spec.tasks.map((task) =>
        task.id === selectedTaskId ? { ...task, ...patch } : task
      )
    });
  }

  function deleteTask() {
    if (!selectedTask) return;
    const nextTasks = spec.tasks.filter((task) => task.id !== selectedTask.id);
    const nextDependencies = spec.dependencies.filter(
      (dependency) =>
        dependency.sourceTaskId !== selectedTask.id &&
        dependency.targetTaskId !== selectedTask.id
    );
    onSpecChange({
      ...spec,
      tasks: nextTasks,
      dependencies: nextDependencies
    });
    onSelectTask(nextTasks[0]?.id ?? "");
  }

  function addDependency(sourceTaskId: string, targetTaskId: string) {
    if (sourceTaskId === targetTaskId) return;
    if (
      spec.dependencies.some(
        (dependency) =>
          dependency.sourceTaskId === sourceTaskId &&
          dependency.targetTaskId === targetTaskId
      )
    ) return;

    const dependency: DependencySpec = {
      id: nextId("dep", spec.dependencies.map((item) => item.id)),
      sourceTaskId,
      targetTaskId
    };
    onSpecChange({
      ...spec,
      dependencies: [...spec.dependencies, dependency]
    });
  }

  function deleteDependencies(ids: string[]) {
    const remove = new Set(ids);
    onSpecChange({
      ...spec,
      dependencies: spec.dependencies.filter(
        (dependency) => !remove.has(dependency.id)
      )
    });
  }

  return (
    <div className="view-stack">
      <div className="view-heading">
        <div>
          <p className="section-kicker">Define</p>
          <h2>Builder</h2>
          <p>
            Author the compiled WorkflowSpec directly or load a versioned
            design/config/profile preset that compiles above frozen DES v1.
          </p>
        </div>
        <PresetBar
          selectedKey={selectedPresetKey}
          onLoadPreset={onLoadPreset}
          onRequestSimulation={onRequestSimulation}
          canRequest={!hasErrors}
          simulating={simulating}
        />
      </div>

      {notice ? <div className="notice" role="status">{notice}</div> : null}

      {compilationContext ? (
        <CompilationProvenance
          bundle={compilationContext.bundle}
          manifest={compilationContext.manifest}
          compact
        />
      ) : null}

      <div className="builder-grid">
        <div className="builder-main">
          <WorkflowDag
            model={dag}
            selectedTaskId={selectedTaskId}
            onSelectTask={onSelectTask}
            onConnectTasks={addDependency}
            onDeleteDependencies={deleteDependencies}
          />
          <div className="builder-toolbar">
            <button
              className="secondary-action"
              type="button"
              disabled={!spec.resources.length}
              onClick={addTask}
            >
              Add task
            </button>
            <span>
              {spec.tasks.length} tasks · {spec.dependencies.length} dependencies ·{" "}
              {spec.resources.length} pools
            </span>
          </div>
          <WorkflowSettings spec={spec} onChange={onSpecChange} />
          <DependencyEditor
            tasks={spec.tasks}
            dependencies={spec.dependencies}
            onChange={(dependencies) =>
              onSpecChange({ ...spec, dependencies })
            }
          />
          <ValidationPanel issues={issues} />
        </div>
        <aside className="builder-side">
          <TaskInspector
            task={selectedTask}
            resources={spec.resources}
            onUpdate={updateTask}
            onDelete={deleteTask}
          />
          <ResourceEditor
            resources={spec.resources}
            tasks={spec.tasks}
            policy={spec.policy}
            onChange={(resources, policy) =>
              onSpecChange({ ...spec, resources, policy })
            }
          />
        </aside>
      </div>
    </div>
  );
}
