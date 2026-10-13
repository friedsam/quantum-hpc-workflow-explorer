import { useMemo, useState } from "react";
import type { DependencySpec, TaskSpec, WorkflowSpec } from "../../domain/types";
import type { ValidationIssue } from "../../domain/validation";
import type { DesignDependency, DesignTask } from "../../design/types";
import { nextId } from "../../domain/id";
import type { CompilationContext } from "../../uiTypes";
import { WorkflowDag } from "../graph/WorkflowDag";
import { projectWorkflowDag } from "../graph/projectWorkflow";
import { projectDesignDag } from "../graph/projectDesign";
import { CompilationProvenance } from "../shared/CompilationProvenance";
import { DependencyEditor } from "./DependencyEditor";
import { LogicalDependencyEditor } from "./LogicalDependencyEditor";
import { LogicalResourceEditor } from "./LogicalResourceEditor";
import { LogicalTaskInspector } from "./LogicalTaskInspector";
import { LogicalWorkflowSettings } from "./LogicalWorkflowSettings";
import { PresetBar } from "./PresetBar";
import { ResourceEditor } from "./ResourceEditor";
import { TaskInspector } from "./TaskInspector";
import { ValidationPanel } from "./ValidationPanel";
import { WorkflowSettings } from "./WorkflowSettings";
import { SystemTopologyStrip } from "./SystemTopologyStrip";
import type { WorkflowDesignBundle } from "../../design/bundle";

interface Props {
  spec: WorkflowSpec;
  compilationContext: CompilationContext | null;
  selectedTaskId: string;
  onSelectTask: (taskId: string) => void;
  onSpecChange: (spec: WorkflowSpec) => void;
  onDesignBundleChange: (bundle: WorkflowDesignBundle) => void;
  issues: ValidationIssue[];
  selectedPresetKey: string;
  onLoadPreset: (key: string) => void;
  onRequestSimulation: () => void;
  notice: string;
  simulating: boolean;
}

function LogicalBuilder({
  spec,
  compilationContext,
  selectedTaskId,
  onSelectTask,
  onDesignBundleChange,
  issues
}: {
  spec: WorkflowSpec;
  compilationContext: CompilationContext;
  selectedTaskId: string;
  onSelectTask: (taskId: string) => void;
  onDesignBundleChange: (bundle: WorkflowDesignBundle) => void;
  issues: ValidationIssue[];
}) {

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const expandedPreviewAllowed = spec.tasks.length <= 500;

  const bundle = compilationContext.bundle;
  const selectedTask = bundle.design.tasks.find(
    (task) => task.id === selectedTaskId
  );
  const dag = useMemo(
    () => projectDesignDag(bundle),
    [bundle]
  );

  function addTask() {
    const resource = bundle.runConfiguration.resources[0];
    if (!resource) return;

    const id = nextId("task", bundle.design.tasks.map((task) => task.id));
    const task: DesignTask = {
      id,
      label: "New logical task",
      multiplicity: 1,
      timingKey: id
    };

    onDesignBundleChange({
      ...bundle,
      design: {
        ...bundle.design,
        tasks: [...bundle.design.tasks, task]
      },
      runConfiguration: {
        ...bundle.runConfiguration,
        taskResources: {
          ...bundle.runConfiguration.taskResources,
          [id]: {
            resourcePoolId: resource.id,
            resourceCount: 1
          }
        }
      },
      systemProfile: {
        ...bundle.systemProfile,
        taskServiceTimes: {
          ...bundle.systemProfile.taskServiceTimes,
          [id]: {
            value: { kind: "constant", seconds: 1 },
            provenance: {
              kind: "user-entered",
              source: "Workflow Explorer Builder",
              notes: "Initial service-time assumption for a new logical task."
            }
          }
        }
      }
    });
    onSelectTask(id);
  }

  function deleteTask() {
    if (!selectedTask) return;

    const removedDependencyKeys = bundle.design.dependencies
      .filter(
        (dependency) =>
          dependency.sourceTaskId === selectedTask.id ||
          dependency.targetTaskId === selectedTask.id
      )
      .map((dependency) => dependency.communicationKey ?? dependency.id);

    const dependencies = bundle.design.dependencies.filter(
      (dependency) =>
        dependency.sourceTaskId !== selectedTask.id &&
        dependency.targetTaskId !== selectedTask.id
    );

    const actorWaits = (bundle.design.actorWaits ?? []).filter(
      (wait) =>
        wait.activation.taskId !== selectedTask.id &&
        wait.release.taskId !== selectedTask.id
    );

    const taskResources = {
      ...bundle.runConfiguration.taskResources
    };
    delete taskResources[selectedTask.id];

    const timingKey = selectedTask.timingKey ?? selectedTask.id;
    const taskServiceTimes = {
      ...bundle.systemProfile.taskServiceTimes
    };
    delete taskServiceTimes[timingKey];

    const dependencyCommunication = {
      ...(bundle.systemProfile.dependencyCommunication ?? {})
    };
    for (const key of removedDependencyKeys) {
      delete dependencyCommunication[key];
    }

    const tasks = bundle.design.tasks.filter(
      (task) => task.id !== selectedTask.id
    );

    onDesignBundleChange({
      ...bundle,
      design: {
        ...bundle.design,
        tasks,
        dependencies,
        actorWaits: actorWaits.length ? actorWaits : undefined
      },
      runConfiguration: {
        ...bundle.runConfiguration,
        taskResources
      },
      systemProfile: {
        ...bundle.systemProfile,
        taskServiceTimes,
        dependencyCommunication: Object.keys(dependencyCommunication).length
          ? dependencyCommunication
          : undefined
      }
    });

    onSelectTask(tasks[0]?.id ?? "");
  }

  function addDependency(sourceTaskId: string, targetTaskId: string) {
    if (sourceTaskId === targetTaskId) return;
    if (
      bundle.design.dependencies.some(
        (dependency) =>
          dependency.sourceTaskId === sourceTaskId &&
          dependency.targetTaskId === targetTaskId
      )
    ) return;

    const dependency: DesignDependency = {
      id: nextId(
        "dep",
        bundle.design.dependencies.map((item) => item.id)
      ),
      sourceTaskId,
      targetTaskId
    };

    onDesignBundleChange({
      ...bundle,
      design: {
        ...bundle.design,
        dependencies: [...bundle.design.dependencies, dependency]
      }
    });
  }

  function deleteDependencies(ids: string[]) {
    const remove = new Set(ids);
    const removed = bundle.design.dependencies.filter((dependency) =>
      remove.has(dependency.id)
    );
    const dependencyCommunication = {
      ...(bundle.systemProfile.dependencyCommunication ?? {})
    };
    for (const dependency of removed) {
      delete dependencyCommunication[
        dependency.communicationKey ?? dependency.id
      ];
    }

    onDesignBundleChange({
      ...bundle,
      design: {
        ...bundle.design,
        dependencies: bundle.design.dependencies.filter(
          (dependency) => !remove.has(dependency.id)
        )
      },
      systemProfile: {
        ...bundle.systemProfile,
        dependencyCommunication: Object.keys(dependencyCommunication).length
          ? dependencyCommunication
          : undefined
      }
    });
  }

  return (
    <>
      <div className="builder-grid">
        <div className="builder-main">
          <SystemTopologyStrip
            runConfiguration={bundle.runConfiguration}
          />

          <WorkflowDag
            model={dag}
            selectedTaskId={selectedTaskId}
            onSelectTask={onSelectTask}
            onConnectTasks={addDependency}
            onDeleteDependencies={deleteDependencies}
            logical
            heading="Logical workflow"
          />

          <div className="builder-toolbar">
            <button
              className="secondary-action"
              type="button"
              disabled={!bundle.runConfiguration.resources.length}
              onClick={addTask}
            >
              Add logical task
            </button>
            <span>
              {bundle.design.tasks.length} logical tasks ·{" "}
              {bundle.design.dependencies.length} logical dependencies ·{" "}
              {spec.tasks.length} compiled DES tasks
            </span>
          </div>

          <LogicalWorkflowSettings
            bundle={bundle}
            onChange={onDesignBundleChange}
          />

          <LogicalDependencyEditor
            bundle={bundle}
            onChange={onDesignBundleChange}
          />

          <ValidationPanel issues={issues} />
        </div>

        <aside className="builder-side">
          <LogicalTaskInspector
            bundle={bundle}
            task={selectedTask}
            onChange={onDesignBundleChange}
            onDelete={deleteTask}
          />

          <LogicalResourceEditor
            bundle={bundle}
            onChange={onDesignBundleChange}
          />
        </aside>
      </div>

      <details
        className="advanced-diagnostics builder-advanced"
        onToggle={(event) =>
          setAdvancedOpen(event.currentTarget.open)
        }
      >
        <summary>Advanced · compiled DES preview</summary>
        {advancedOpen ? (
        <div className="advanced-stack">
          {compilationContext.manifest ? (
            <CompilationProvenance
              bundle={bundle}
              manifest={compilationContext.manifest}
              compact
            />
          ) : null}
          {compilationContext.manifest ? (
            <WorkflowDag
              model={projectWorkflowDag(spec)}
              heading="Compiled WorkflowSpec DAG"
            />
          ) : (
            <div className="notice error">
              No current compiled DES preview: the logical draft is invalid.
            </div>
          )}
        </div>
        ) : null}
      </details>
    </>
  );
}

function DirectBuilder({
  spec,
  selectedTaskId,
  onSelectTask,
  onSpecChange,
  issues
}: Pick<
  Props,
  | "spec"
  | "selectedTaskId"
  | "onSelectTask"
  | "onSpecChange"
  | "issues"
>) {
  const selectedTask = spec.tasks.find(
    (task) => task.id === selectedTaskId
  );
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
    const nextTasks = spec.tasks.filter(
      (task) => task.id !== selectedTask.id
    );
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
    <details className="advanced-diagnostics direct-builder" open>
      <summary>Advanced · direct WorkflowSpec editor</summary>
      <p className="field-note">
        Compatibility mode. Logical multiplicity and authored actor semantics
        are unavailable unless this workflow is represented as WorkflowDesign.
      </p>
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
              {spec.tasks.length} compiled tasks ·{" "}
              {spec.dependencies.length} dependencies
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
    </details>
  );
}

export function BuilderView({
  spec,
  compilationContext,
  selectedTaskId,
  onSelectTask,
  onSpecChange,
  onDesignBundleChange,
  issues,
  selectedPresetKey,
  onLoadPreset,
  onRequestSimulation,
  notice,
  simulating
}: Props) {
  const hasErrors = issues.some((issue) => issue.severity === "error");

  return (
    <div className="view-stack">
      <div className="view-heading">
        <div>
          <p className="section-kicker">Define</p>
          <h2>Builder</h2>
          <p>
            {compilationContext
              ? "Author the logical workflow. Multiplicity, actors and resource units per instance remain separate inputs."
              : "Advanced direct WorkflowSpec compatibility mode."}
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
        <LogicalBuilder
          spec={spec}
          compilationContext={compilationContext}
          selectedTaskId={selectedTaskId}
          onSelectTask={onSelectTask}
          onDesignBundleChange={onDesignBundleChange}
          issues={issues}
        />
      ) : (
        <DirectBuilder
          spec={spec}
          selectedTaskId={selectedTaskId}
          onSelectTask={onSelectTask}
          onSpecChange={onSpecChange}
          issues={issues}
        />
      )}
    </div>
  );
}
