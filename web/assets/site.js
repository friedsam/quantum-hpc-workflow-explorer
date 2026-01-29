
// Tiny deterministic "model" so the Runner page works now.
// Replace later with your real simulation engine / scenario logic.

export function compute(params){
  // Inputs
  const iters = +params.iters;
  const hpcWork = +params.hpc_work_s;          // per iteration
  const qpuExec = +params.qpu_exec_s;          // per iteration
  const qpuQueue = +params.qpu_queue_s;        // per iteration (avg)
  const transfer = +params.transfer_s;         // per iteration
  const syncPenalty = +params.sync_penalty_s;  // per iteration (barrier-like)

  const hpcRate = +params.hpc_cost_per_s;
  const qpuRate = +params.qpu_cost_per_s;

  // Simple time accounting
  const hpcRun = iters * hpcWork;
  const qpuRun = iters * qpuExec;

  const qpuNon = iters * (qpuQueue); // queued/not running
  const hpcNon = iters * (qpuQueue + transfer + syncPenalty); // HPC waiting on QPU/transfer/barrier

  const total = hpcRun + hpcNon; // assume critical path dominated by HPC timeline

  const hpcCost = (hpcRun + hpcNon) * hpcRate;
  const qpuCost = (qpuRun + qpuNon) * qpuRate;
  const totalCost = hpcCost + qpuCost;

  return {
    total_s: total,
    hpc_run_s: hpcRun,
    qpu_run_s: qpuRun,
    hpc_non_s: hpcNon,
    qpu_non_s: qpuNon,
    hpc_cost: hpcCost,
    qpu_cost: qpuCost,
    total_cost: totalCost
  };
}

export function fmtSeconds(s){
  if (!isFinite(s)) return "—";
  if (s < 60) return `${s.toFixed(1)} s`;
  const m = Math.floor(s/60);
  const r = s - 60*m;
  return `${m}m ${r.toFixed(0)}s`;
}

export function fmtMoney(x){
  if (!isFinite(x)) return "—";
  return `$${x.toFixed(2)}`;
}

export function ledState(run, non){
  // crude LED logic: if run dominates => green, else if non dominates => red, else yellow.
  const total = run + non;
  if (total <= 0) return "off";
  const runFrac = run / total;
  if (runFrac > 0.65) return "green";
  if (runFrac < 0.35) return "red";
  return "yellow";
}