import type { SimulationResult, WorkflowSpec } from "../../contracts";
import { formatNumber, formatRatio, formatSeconds } from "../shared/format";

export interface MetricRow {
  key: string;
  label: string;
  value: number;
  formatted: string;
}

type CandidateMetrics = {
  activeResourceSecondsByPool?: Record<string, number>;
  releasedResourceSecondsByPool?: Record<string, number>;
  admissionWaitSecondsByPool?: Record<string, number>;
  aggregateCommunicationSeconds?: number;
  costByPool?: Record<string, number>;
  totalCost?: number;
  communicationSeconds?: number;
};

export function buildMetricRows(spec: WorkflowSpec, result: SimulationResult): MetricRow[] {
  const metrics = result.metrics as SimulationResult["metrics"] & CandidateMetrics;
  const rows: MetricRow[] = [
    {
      key: "makespan",
      label: "Makespan",
      value: metrics.makespanS,
      formatted: formatSeconds(metrics.makespanS)
    }
  ];

  for (const pool of spec.resources) {
    const utilization = metrics.utilizationByPool[pool.id];
    if (utilization !== undefined) {
      rows.push({
        key: "utilization:" + pool.id,
        label: pool.id + " utilization",
        value: utilization,
        formatted: formatRatio(utilization)
      });
    }

    const allocated = metrics.allocatedResourceSecondsByPool[pool.id];
    if (allocated !== undefined) {
      rows.push({
        key: "allocated:" + pool.id,
        label: pool.id + " allocated resource-seconds",
        value: allocated,
        formatted: formatNumber(allocated)
      });
    }

    const idle = metrics.idleAllocatedResourceSecondsByPool[pool.id];
    if (idle !== undefined) {
      rows.push({
        key: "idle:" + pool.id,
        label: pool.id + " idle allocated resource-seconds",
        value: idle,
        formatted: formatNumber(idle)
      });
    }

    const queueWait = metrics.queueWaitSecondsByPool[pool.id];
    if (queueWait !== undefined && queueWait > 0) {
      rows.push({
        key: "queue:" + pool.id,
        label: pool.id + " resource-queue wait",
        value: queueWait,
        formatted: formatSeconds(queueWait)
      });
    }

    const admissionWait = metrics.admissionWaitSecondsByPool?.[pool.id];
    if (admissionWait !== undefined && admissionWait > 0) {
      rows.push({
        key: "admission:" + pool.id,
        label: pool.id + " policy/admission wait",
        value: admissionWait,
        formatted: formatSeconds(admissionWait)
      });
    }

    const cost = metrics.costByPool?.[pool.id];
    if (cost !== undefined && cost > 0) {
      rows.push({
        key: "cost:" + pool.id,
        label: pool.id + " modeled cost",
        value: cost,
        formatted: "$" + cost.toFixed(4)
      });
    }
  }

  const communication =
    metrics.aggregateCommunicationSeconds ??
    metrics.communicationSeconds;

  if (communication !== undefined) {
    rows.push({
      key: "aggregate-communication",
      label: metrics.aggregateCommunicationSeconds !== undefined
        ? "Aggregate modeled communication"
        : "Communication",
      value: communication,
      formatted: formatSeconds(communication)
    });
  }

  if (metrics.totalCost !== undefined) {
    rows.push({
      key: "total-cost",
      label: "Total modeled cost",
      value: metrics.totalCost,
      formatted: "$" + metrics.totalCost.toFixed(4)
    });
  }

  return rows;
}
