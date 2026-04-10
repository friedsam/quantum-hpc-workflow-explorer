const STORAGE_KEY = "qhpc_workflow_config_v1";

export function defaultVqeWorkflow(){
  return {
    template: "vqe",
    name: "VQE",
    global: {
      total_hpc_ranks: 128,
      total_qpus: 1,
      max_iterations: 25,
      hpc_cost_per_rank_s: 0.0015,
      qpu_cost_per_s: 0.22
    },
    layers: [
      {
        id: "layer_0",
        name: "Resource Setup",
        type: "resource_setup",
        scope: "global",
        params: {
          total_hpc_ranks: 128,
          total_qpus: 1,
          max_iterations: 25,
          hpc_cost_per_rank_s: 0.0015,
          qpu_cost_per_s: 0.22
        }
      },
      {
        id: "layer_1",
        name: "Initialization",
        type: "classical",
        scope: "once",
        params: { requested_ranks: 16, duration_s: 8, blocking_behavior: "local" }
      },
      {
        id: "layer_2",
        name: "Classical Prepare",
        type: "classical",
        scope: "loop",
        params: { requested_ranks: 128, duration_s: 3.5, blocking_behavior: "local" }
      },
      {
        id: "layer_3",
        name: "Quantum Evaluate",
        type: "quantum",
        scope: "loop",
        params: {
          requested_ranks: 1,
          submit_latency_s: 0.35,
          queue_time_s: 1.1,
          quantum_runtime_s: 1.8,
          result_latency_s: 0.25,
          blocking_behavior: "global_barrier"
        }
      },
      {
        id: "layer_4",
        name: "Classical Update",
        type: "classical",
        scope: "loop",
        params: { requested_ranks: 64, duration_s: 1.7, blocking_behavior: "local" }
      },
      {
        id: "layer_5",
        name: "Finalize",
        type: "classical",
        scope: "once",
        params: { requested_ranks: 8, duration_s: 2, blocking_behavior: "local" }
      }
    ]
  };
}

export function getStoredWorkflow(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.layers) || !parsed.global) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function storeWorkflow(workflow){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflow));
}

export function getLayerFormSpec(layer){
  if(layer.type === "resource_setup"){
    return [
      { key: "total_hpc_ranks", label: "Total HPC ranks", type: "number", min: 1, step: 1 },
      { key: "total_qpus", label: "QPUs", type: "number", min: 1, step: 1 },
      { key: "max_iterations", label: "Max iterations", type: "number", min: 1, step: 1 },
      { key: "hpc_cost_per_rank_s", label: "HPC cost per rank-second ($)", type: "number", min: 0, step: "any" },
      { key: "qpu_cost_per_s", label: "QPU cost per second ($)", type: "number", min: 0, step: "any" }
    ];
  }
  if(layer.type === "quantum"){
    return [
      { key: "requested_ranks", label: "Requested HPC ranks", type: "number", min: 1, step: 1 },
      { key: "submit_latency_s", label: "Submit latency (s)", type: "number", min: 0, step: "any" },
      { key: "queue_time_s", label: "Queue / wait time (s)", type: "number", min: 0, step: "any" },
      { key: "quantum_runtime_s", label: "QPU runtime (s)", type: "number", min: 0, step: "any" },
      { key: "result_latency_s", label: "Result latency (s)", type: "number", min: 0, step: "any" },
      { key: "blocking_behavior", label: "Blocking behavior", type: "select", options: [
        { value: "global_barrier", label: "Global barrier" },
        { value: "local", label: "Local / partial" }
      ] }
    ];
  }
  return [
    { key: "requested_ranks", label: "Requested HPC ranks", type: "number", min: 1, step: 1 },
    { key: "duration_s", label: "Duration (s)", type: "number", min: 0, step: "any" },
    { key: "blocking_behavior", label: "Blocking behavior", type: "select", options: [
      { value: "local", label: "Local" },
      { value: "global_barrier", label: "Global barrier" }
    ] }
  ];
}

export function formatLayerSummary(layer){
  if(layer.type === "resource_setup") return `${layer.params.total_hpc_ranks} ranks • ${layer.params.total_qpus} QPU • ${layer.params.max_iterations} iterations`;
  if(layer.type === "quantum") return `${layer.params.requested_ranks} ranks • submit ${layer.params.submit_latency_s}s • queue ${layer.params.queue_time_s}s • run ${layer.params.quantum_runtime_s}s • return ${layer.params.result_latency_s}s • ${layer.params.blocking_behavior}`;
  return `${layer.params.requested_ranks} ranks • ${layer.params.duration_s}s • ${layer.params.blocking_behavior}`;
}

function zeroMetrics(){
  return { total_runtime_s:0,hpc_active_rank_s:0,hpc_blocked_rank_s:0,hpc_idle_rank_s:0,qpu_active_s:0,qpu_queued_s:0,hpc_cost:0,qpu_cost:0,total_cost:0 };
}
function cloneMetrics(metrics){ return { ...metrics }; }
function clampRanks(requested,total){ const req=Math.max(0,Math.round(+requested||0)); return Math.min(req,total); }
function addMetrics(base,delta){ for(const key of Object.keys(base)) base[key]+=delta[key]||0; }
function makeFlags(){ return { working_active:false,idle_active:false,blocked_active:false,qpu_running:false,qpu_queued:false,transfer_out_active:false,transfer_in_active:false }; }
function buildState({layer,phase,description,counts,flags,metrics,iterationIndex,workflow}){ return { layer,phase,description,counts,flags,metrics:cloneMetrics(metrics),iterationIndex,scopeLabel:layer.scope==="loop"?"loop layer":"one-time layer",iterationLabel:layer.scope==="loop"?`iteration ${iterationIndex+1} / ${workflow.global.max_iterations}`:"one-time phase" }; }

export function simulateWorkflow(workflow){
  const totalRanks = Math.max(1, Math.round(workflow.global.total_hpc_ranks));
  const iterations = Math.max(1, Math.round(workflow.global.max_iterations));
  const metrics = zeroMetrics();
  const states = [];
  const layers = workflow.layers.filter(layer => layer.type !== "resource_setup");
  function updateCosts(){ metrics.hpc_cost = metrics.total_runtime_s * totalRanks * workflow.global.hpc_cost_per_rank_s; metrics.qpu_cost = metrics.qpu_active_s * workflow.global.qpu_cost_per_s; metrics.total_cost = metrics.hpc_cost + metrics.qpu_cost; }
  function pushClassical(layer, phase, description, iterationIndex){
    const active = clampRanks(layer.params.requested_ranks, totalRanks);
    const duration = Math.max(0, +layer.params.duration_s || 0);
    const blocking = layer.params.blocking_behavior || "local";
    const delta = zeroMetrics();
    delta.total_runtime_s = duration;
    delta.hpc_active_rank_s = active * duration;
    if(blocking === "global_barrier") delta.hpc_blocked_rank_s = (totalRanks-active)*duration; else delta.hpc_idle_rank_s = (totalRanks-active)*duration;
    addMetrics(metrics, delta); updateCosts();
    const flags = makeFlags(); flags.working_active = active>0; if(blocking === "global_barrier") flags.blocked_active = totalRanks-active>0; else flags.idle_active = totalRanks-active>0;
    states.push(buildState({ layer, phase, description, counts:{ working:active, idle:blocking==="global_barrier"?0:totalRanks-active, blocked:blocking==="global_barrier"?totalRanks-active:0, queue_depth:0 }, flags, metrics, iterationIndex, workflow }));
  }
  function pushQuantum(layer, iterationIndex){
    const managerRanks = clampRanks(layer.params.requested_ranks, totalRanks);
    const submit = Math.max(0, +layer.params.submit_latency_s || 0);
    const queue = Math.max(0, +layer.params.queue_time_s || 0);
    const runtime = Math.max(0, +layer.params.quantum_runtime_s || 0);
    const result = Math.max(0, +layer.params.result_latency_s || 0);
    const blocking = layer.params.blocking_behavior || "global_barrier";
    const queueDepth = Math.max(1, Math.ceil(queue / Math.max(runtime || 1, 1)));
    const segments = [
      { phase:"submit", description:"Submitting quantum work to the serialized QPU resource.", duration:submit, counts:{ working:managerRanks, idle:blocking==="global_barrier"?0:totalRanks-managerRanks, blocked:blocking==="global_barrier"?totalRanks-managerRanks:0, queue_depth:queueDepth }, flags:{ working_active:managerRanks>0, transfer_out_active:submit>0, blocked_active:blocking==="global_barrier"?totalRanks-managerRanks>0:false, idle_active:blocking==="local"?totalRanks-managerRanks>0:false }, delta:{ hpc_active_rank_s:managerRanks*submit, hpc_blocked_rank_s:blocking==="global_barrier"?(totalRanks-managerRanks)*submit:0, hpc_idle_rank_s:blocking==="local"?(totalRanks-managerRanks)*submit:0, qpu_queued_s:submit } },
      { phase:"queued", description:"Quantum work is queued behind an external serial resource.", duration:queue, counts:{ working:0, idle:blocking==="global_barrier"?0:totalRanks-managerRanks, blocked:blocking==="global_barrier"?totalRanks:managerRanks, queue_depth:queueDepth }, flags:{ qpu_queued:queue>0, blocked_active:blocking==="global_barrier"?totalRanks>0:managerRanks>0, idle_active:blocking==="local"?totalRanks-managerRanks>0:false }, delta:{ hpc_blocked_rank_s:blocking==="global_barrier"?totalRanks*queue:managerRanks*queue, hpc_idle_rank_s:blocking==="local"?(totalRanks-managerRanks)*queue:0, qpu_queued_s:queue } },
      { phase:"running", description:"QPU runtime dominates while classical ranks wait on the serialized result.", duration:runtime, counts:{ working:0, idle:blocking==="global_barrier"?0:totalRanks-managerRanks, blocked:blocking==="global_barrier"?totalRanks:managerRanks, queue_depth:queueDepth }, flags:{ qpu_running:runtime>0, blocked_active:blocking==="global_barrier"?totalRanks>0:managerRanks>0, idle_active:blocking==="local"?totalRanks-managerRanks>0:false }, delta:{ hpc_blocked_rank_s:blocking==="global_barrier"?totalRanks*runtime:managerRanks*runtime, hpc_idle_rank_s:blocking==="local"?(totalRanks-managerRanks)*runtime:0, qpu_active_s:runtime } },
      { phase:"return", description:"Quantum results return to the classical side.", duration:result, counts:{ working:managerRanks, idle:blocking==="global_barrier"?0:totalRanks-managerRanks, blocked:blocking==="global_barrier"?totalRanks-managerRanks:0, queue_depth:Math.max(0,queueDepth-1) }, flags:{ working_active:managerRanks>0, transfer_in_active:result>0, blocked_active:blocking==="global_barrier"?totalRanks-managerRanks>0:false, idle_active:blocking==="local"?totalRanks-managerRanks>0:false }, delta:{ hpc_active_rank_s:managerRanks*result, hpc_blocked_rank_s:blocking==="global_barrier"?(totalRanks-managerRanks)*result:0, hpc_idle_rank_s:blocking==="local"?(totalRanks-managerRanks)*result:0, qpu_queued_s:result } }
    ];
    for(const seg of segments){ const delta = zeroMetrics(); delta.total_runtime_s = seg.duration; Object.assign(delta, seg.delta); addMetrics(metrics, delta); updateCosts(); states.push(buildState({ layer, phase:seg.phase, description:seg.description, counts:seg.counts, flags:Object.assign(makeFlags(), seg.flags), metrics, iterationIndex, workflow })); }
  }
  for(const layer of layers){
    if(layer.scope === "once"){ if(layer.type === "quantum") pushQuantum(layer,0); else pushClassical(layer,"once",`${layer.name} executes once before/after the loop.`,0); continue; }
    if(layer.scope === "loop"){ for(let iter=0; iter<iterations; iter+=1){ if(layer.type === "quantum") pushQuantum(layer,iter); else pushClassical(layer,"loop",`${layer.name} executes during the main VQE loop.`,iter); } }
  }
  if(states.length === 0) states.push({ layer:{ name:"Empty workflow", scope:"once" }, phase:"idle", description:"No states generated.", counts:{ working:0, idle:totalRanks, blocked:0, queue_depth:0 }, flags:makeFlags(), metrics:zeroMetrics(), iterationIndex:0, scopeLabel:"empty", iterationLabel:"n/a" });
  return { states };
}

export function fmtSeconds(s){ if(!isFinite(s)) return "—"; if(s < 60) return `${s.toFixed(1)} s`; const m=Math.floor(s/60); const r=s-60*m; return `${m}m ${r.toFixed(0)}s`; }
export function fmtMoney(x){ if(!isFinite(x)) return "—"; return `$${x.toFixed(2)}`; }
