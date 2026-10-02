import type { SimulationResult, WorkflowSpec } from "../../domain/types";
import { formatNumber, formatRatio, formatSeconds } from "../shared/format";

export interface MetricRow {
  key: string;
  label: string;
  value: number;
  formatted: string;
  formatValue: (value: number) => string;
}

function money(value: number): string {
  return "$" + value.toFixed(4);
}

export function buildMetricRows(spec: WorkflowSpec, result: SimulationResult): MetricRow[] {
  const metrics = result.metrics;
  const rows: MetricRow[] = [{
    key: "makespan",
    label: "Makespan",
    value: metrics.makespanS,
    formatted: formatSeconds(metrics.makespanS),
    formatValue: formatSeconds
  }];

  for (const pool of spec.resources) {
    const metricFields: Array<[string, string, number, (value: number) => string]> = [
      ["utilization", "utilization", metrics.utilizationByPool[pool.id] ?? 0, formatRatio],
      ["active", "active resource-seconds", metrics.activeResourceSecondsByPool[pool.id] ?? 0, formatNumber],
      ["allocated", "allocated resource-seconds", metrics.allocatedResourceSecondsByPool[pool.id] ?? 0, formatNumber],
      ["idle", "idle allocated resource-seconds", metrics.idleAllocatedResourceSecondsByPool[pool.id] ?? 0, formatNumber],
      ["released", "released resource-seconds", metrics.releasedResourceSecondsByPool[pool.id] ?? 0, formatNumber],
      ["queue", "resource-queue wait", metrics.queueWaitSecondsByPool[pool.id] ?? 0, formatSeconds],
      ["admission", "policy/admission wait", metrics.admissionWaitSecondsByPool[pool.id] ?? 0, formatSeconds],
      ["cost", "modeled cost", metrics.costByPool[pool.id] ?? 0, money]
    ];

    for (const [key, label, value, formatter] of metricFields) {
      if ((key === "queue" || key === "admission" || key === "cost") && value === 0) continue;
      rows.push({
        key: key + ":" + pool.id,
        label: pool.id + " " + label,
        value,
        formatted: formatter(value),
        formatValue: formatter
      });
    }
  }

  rows.push({
    key: "aggregate-communication",
    label: "Aggregate modeled communication",
    value: metrics.aggregateCommunicationSeconds,
    formatted: formatSeconds(metrics.aggregateCommunicationSeconds),
    formatValue: formatSeconds
  });

  rows.push({
    key: "total-cost",
    label: "Total modeled cost",
    value: metrics.totalCost,
    formatted: money(metrics.totalCost),
    formatValue: money
  });

  return rows;
}
