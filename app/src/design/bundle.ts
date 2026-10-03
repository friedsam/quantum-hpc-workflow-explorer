import type { WorkflowSpec } from "../domain/types";
import type {
  ActorGroup,
  RunConfiguration,
  SystemProfile,
  WorkflowDesign
} from "./types";

export interface WorkflowDesignBundle {
  design: WorkflowDesign;
  runConfiguration: RunConfiguration;
  systemProfile: SystemProfile;
}

interface BundleOptions {
  source: string;
  semanticTypeByTask?: Record<string, string>;
  actorGroups?: ActorGroup[];
  actorGroupIdsByTask?: Record<string, string[]>;
}

const synthetic = (source: string, notes?: string) => ({
  kind: "synthetic" as const,
  source,
  ...(notes ? { notes } : {})
});

export function designBundleFromWorkflowSpec(
  spec: WorkflowSpec,
  options: BundleOptions
): WorkflowDesignBundle {
  const actorGroups = structuredClone(options.actorGroups ?? []);
  const actorGroupCounts = Object.fromEntries(actorGroups.map((group) => [group.id, 1]));

  const design: WorkflowDesign = {
    schemaVersion: 1,
    id: spec.id + "::design",
    name: spec.name,
    tasks: spec.tasks.map((task) => ({
      id: task.id,
      label: task.label,
      timingKey: task.id,
      ...(options.semanticTypeByTask?.[task.id]
        ? { semanticType: options.semanticTypeByTask[task.id] }
        : {}),
      ...(options.actorGroupIdsByTask?.[task.id]?.length
        ? { actorGroupIds: [...options.actorGroupIdsByTask[task.id]] }
        : {})
    })),
    dependencies: spec.dependencies.map((dependency) => ({
      id: dependency.id,
      sourceTaskId: dependency.sourceTaskId,
      targetTaskId: dependency.targetTaskId,
      communicationKey: dependency.id
    })),
    ...(actorGroups.length ? { actorGroups } : {}),
    assumptions: structuredClone(spec.assumptions ?? []),
    metadata: {
      sourceWorkflowSpecId: spec.id,
      provenance: "accepted-qamp-scenario"
    }
  };

  const runConfiguration: RunConfiguration = {
    schemaVersion: 1,
    id: spec.id + "::run",
    workflowId: spec.id,
    resources: spec.resources.map((resource) => ({
      id: resource.id,
      kind: resource.kind,
      capacity: resource.capacity,
      costKey: resource.id
    })),
    taskResources: Object.fromEntries(
      spec.tasks.map((task) => [
        task.id,
        {
          resourcePoolId: task.resourcePoolId,
          resourceCount: task.resourceCount
        }
      ])
    ),
    policy: structuredClone(spec.policy),
    ...(Object.keys(actorGroupCounts).length ? { actorGroupCounts } : {}),
    assumptions: [
      "Run configuration compiled above frozen DES v1; resource choices are synthetic acceptance values."
    ]
  };

  const dependencyCommunication = Object.fromEntries(
    spec.dependencies
      .filter((dependency) =>
        (dependency.fixedLatencyS ?? 0) > 0 ||
        (dependency.dataBytes ?? 0) > 0
      )
      .map((dependency) => [
        dependency.id,
        {
          value: {
            ...(dependency.fixedLatencyS !== undefined
              ? { fixedLatencyS: dependency.fixedLatencyS }
              : {}),
            ...(dependency.dataBytes !== undefined
              ? { dataBytes: dependency.dataBytes }
              : {}),
            ...(dependency.bandwidthBytesPerS !== undefined
              ? { bandwidthBytesPerS: dependency.bandwidthBytesPerS }
              : {})
          },
          provenance: synthetic(
            options.source,
            "Synthetic QAMP acceptance communication assumption."
          )
        }
      ])
  );

  const costPerUnitSecond = Object.fromEntries(
    spec.resources
      .filter((resource) => resource.costPerUnitSecond !== undefined)
      .map((resource) => [
        resource.id,
        {
          value: resource.costPerUnitSecond as number,
          provenance: synthetic(
            options.source,
            "Illustrative cost rate; not provider billing."
          )
        }
      ])
  );

  const systemProfile: SystemProfile = {
    schemaVersion: 1,
    id: spec.id + "::profile",
    name: spec.name + " synthetic acceptance profile",
    taskServiceTimes: Object.fromEntries(
      spec.tasks.map((task) => [
        task.id,
        {
          value: structuredClone(task.serviceTime),
          provenance: synthetic(
            options.source,
            "Synthetic acceptance timing; not measured production performance."
          )
        }
      ])
    ),
    ...(Object.keys(dependencyCommunication).length
      ? { dependencyCommunication }
      : {}),
    ...(Object.keys(costPerUnitSecond).length
      ? { costPerUnitSecond }
      : {}),
    assumptions: [
      "All service/communication values in this QAMP acceptance profile are synthetic."
    ]
  };

  return { design, runConfiguration, systemProfile };
}
