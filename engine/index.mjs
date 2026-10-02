const KINDS = new Set(["cpu", "gpu", "qpu"]);
const CLASSICAL = new Set(["cpu", "gpu"]);
const PRI = { complete: 0, transferComplete: 1 };
const nonneg = x => Number.isFinite(x) && x >= 0;
const posint = x => Number.isInteger(x) && x > 0;
const die = m => { throw new Error(m); };

function duration(model, label) {
  if (!model || model.kind !== "constant" || !nonneg(model.seconds))
    die(`${label} must be { kind: "constant", seconds >= 0 }`);
  return model.seconds;
}
function transferTime(d) {
  const lat = d.fixedLatencyS ?? 0, bytes = d.dataBytes ?? 0;
  if (!nonneg(lat) || !nonneg(bytes)) die(`dependency ${d.id}: invalid transfer parameters`);
  if (!bytes) return lat;
  if (!Number.isFinite(d.bandwidthBytesPerS) || d.bandwidthBytesPerS <= 0)
    die(`dependency ${d.id}: bandwidthBytesPerS must be > 0 when dataBytes > 0`);
  return lat + bytes / d.bandwidthBytesPerS;
}

export function validateWorkflowSpec(spec) {
  if (!spec?.id || !Array.isArray(spec.tasks) || !spec.tasks.length ||
      !Array.isArray(spec.dependencies) || !Array.isArray(spec.resources) || !spec.resources.length)
    die("workflow requires id, tasks, dependencies, and resources");
  if (!["fixed", "release-aware"].includes(spec.policy?.allocation)) die("invalid allocation policy");
  if (spec.policy.maxInFlightQuantum !== undefined && !posint(spec.policy.maxInFlightQuantum))
    die("maxInFlightQuantum must be a positive integer");

  const resources = new Map();
  for (const r of spec.resources) {
    if (!r.id || resources.has(r.id) || !KINDS.has(r.kind) || !posint(r.capacity)) die(`invalid resource ${r.id ?? "?"}`);
    if (r.costPerUnitSecond !== undefined && !nonneg(r.costPerUnitSecond)) die(`invalid cost for ${r.id}`);
    resources.set(r.id, r);
  }
  const tasks = new Map(), order = new Map();
  spec.tasks.forEach((t, i) => {
    const r = resources.get(t.resourcePoolId);
    if (!t.id || tasks.has(t.id)) die(`invalid task ${t.id ?? "?"}`);
    if (!r) die(`task ${t.id}: unknown resource pool ${t.resourcePoolId}`);
    if (!posint(t.resourceCount)) die(`task ${t.id}: resourceCount must be a positive integer`);
    if (t.resourceCount > r.capacity) die(`task ${t.id}: resourceCount exceeds pool ${r.id} capacity`);
    duration(t.serviceTime, `task ${t.id}.serviceTime`);
    tasks.set(t.id, t); order.set(t.id, i);
  });
  const incoming = new Map(spec.tasks.map(t => [t.id, []]));
  const outgoing = new Map(spec.tasks.map(t => [t.id, []]));
  const depIds = new Set();
  for (const d of spec.dependencies) {
    if (!d.id || depIds.has(d.id) || !tasks.has(d.sourceTaskId) || !tasks.has(d.targetTaskId) || d.sourceTaskId === d.targetTaskId)
      die(`invalid dependency ${d.id ?? "?"}`);
    transferTime(d); depIds.add(d.id); incoming.get(d.targetTaskId).push(d); outgoing.get(d.sourceTaskId).push(d);
  }
  const deg = new Map(spec.tasks.map(t => [t.id, incoming.get(t.id).length]));
  const q = spec.tasks.filter(t => !deg.get(t.id)).map(t => t.id); let seen = 0;
  while (q.length) {
    q.sort((a,b)=>order.get(a)-order.get(b)); const id=q.shift(); seen++;
    for (const d of outgoing.get(id)) { const n=d.targetTaskId; deg.set(n,deg.get(n)-1); if (!deg.get(n)) q.push(n); }
  }
  if (seen !== spec.tasks.length) die("workflow dependencies must form a DAG");
  return { resources, tasks, order, incoming, outgoing };
}

class Events {
  constructor(){ this.a=[]; this.seq=0; }
  push(time,type,data){ this.a.push({time,type,data,seq:this.seq++}); }
  next(){ return this.a.length ? Math.min(...this.a.map(e=>e.time)) : null; }
  has(t){ return this.a.some(e=>e.time===t); }
  at(t){ const x=this.a.filter(e=>e.time===t); this.a=this.a.filter(e=>e.time!==t); return x.sort((a,b)=>(PRI[a.type]??9)-(PRI[b.type]??9)||a.seq-b.seq); }
}

function resourceAccounting(spec, runs, makespan) {
  const intervals=[], metric={utilizationByPool:{},activeResourceSecondsByPool:{},allocatedResourceSecondsByPool:{},idleAllocatedResourceSecondsByPool:{},releasedResourceSecondsByPool:{},costByPool:{}};
  for (const r of spec.resources) {
    const rr=runs.filter(x=>x.resourcePoolId===r.id); rr.forEach(x=>intervals.push({...x,state:"active"}));
    let active=rr.reduce((s,x)=>s+(x.endS-x.startS)*x.units,0), idle=0, released=0;
    const cuts=[...new Set([0,makespan,...rr.flatMap(x=>[x.startS,x.endS])])].sort((a,b)=>a-b);
    for(let i=0;i<cuts.length-1;i++){
      const a=cuts[i],b=cuts[i+1]; if(b<=a)continue; const p=(a+b)/2;
      const used=rr.filter(x=>x.startS<=p&&p<x.endS).reduce((s,x)=>s+x.units,0); if(used>r.capacity)die(`capacity exceeded: ${r.id}`);
      const free=r.capacity-used, fixed=CLASSICAL.has(r.kind)&&spec.policy.allocation==="fixed";
      if(free){ const state=fixed?"allocated-idle":"released"; intervals.push({resourcePoolId:r.id,startS:a,endS:b,state,units:free}); if(fixed)idle+=(b-a)*free; else released+=(b-a)*free; }
    }
    const allocated=active+idle, denom=r.capacity*makespan;
    metric.utilizationByPool[r.id]=denom?active/denom:0; metric.activeResourceSecondsByPool[r.id]=active;
    metric.allocatedResourceSecondsByPool[r.id]=allocated; metric.idleAllocatedResourceSecondsByPool[r.id]=idle;
    metric.releasedResourceSecondsByPool[r.id]=released; metric.costByPool[r.id]=allocated*(r.costPerUnitSecond??0);
  }
  intervals.sort((a,b)=>a.startS-b.startS||a.endS-b.endS||a.resourcePoolId.localeCompare(b.resourcePoolId)||a.state.localeCompare(b.state));
  return { intervals, metric };
}

export function simulateWorkflow(spec) {
  const {resources,tasks,order,incoming,outgoing}=validateWorkflowSpec(spec), evq=new Events(), events=[], queueSeries=[], runs=[], taskIntervals=[];
  const qs=Object.fromEntries(spec.resources.map(r=>[r.id,0])), aw=Object.fromEntries(spec.resources.map(r=>[r.id,0]));
  const st=new Map(spec.tasks.map(t=>[t.id,{t,status:"pending",deps:incoming.get(t.id).length,ready:null,queued:null,start:null,end:null,throttled:false}]));
  const pools=new Map(spec.resources.map(r=>[r.id,{r,used:0,q:[],depth:0}])); spec.resources.forEach(r=>queueSeries.push({simTimeS:0,resourcePoolId:r.id,depth:0}));
  let seq=0,inflight=0; const max=spec.policy.maxInFlightQuantum??Infinity;
  const emit=(time,type,x={})=>events.push({seq:seq++,simTimeS:time,type,...x});
  const depth=(p,t,d)=>{ if(d<0)die("negative queue depth"); if(p.depth!==d){p.depth=d;queueSeries.push({simTimeS:t,resourcePoolId:p.r.id,depth:d});} };
  const ready=(s,t)=>{ if(s.status!=="pending")return; s.status="ready";s.ready=t;emit(t,"task_ready",{taskId:s.t.id,resourcePoolId:s.t.resourcePoolId}); };
  const sortReady=(a,b)=>a.ready-b.ready||order.get(a.t.id)-order.get(b.t.id);
  const sortQueued=(a,b)=>a.queued-b.queued||order.get(a.t.id)-order.get(b.t.id);

  function admit(t){
    for(const s of [...st.values()].filter(x=>x.status==="ready").sort(sortReady)){
      const r=resources.get(s.t.resourcePoolId); if(r.kind==="qpu"&&inflight>=max){ if(!s.throttled){emit(t,"task_throttled",{taskId:s.t.id,resourcePoolId:r.id,metadata:{reason:"maxInFlightQuantum",maxInFlightQuantum:max}});s.throttled=true;} continue; }
      s.status="queued";s.queued=t;const p=pools.get(r.id);p.q.push(s);p.q.sort(sortQueued);if(r.kind==="qpu")inflight++;depth(p,t,p.q.length);emit(t,"task_queued",{taskId:s.t.id,resourcePoolId:r.id,metadata:{queueDepth:p.q.length}});
    }
  }
  function start(t){
    for(const r of spec.resources){const p=pools.get(r.id);while(p.q.length){const s=p.q[0],task=s.t;if(task.resourceCount>r.capacity-p.used)break;p.q.shift();depth(p,t,p.q.length);s.status="running";s.start=t;p.used+=task.resourceCount;
      aw[r.id]+=s.queued-s.ready;qs[r.id]+=s.start-s.queued;if(s.queued>s.ready)taskIntervals.push({taskId:task.id,startS:s.ready,endS:s.queued,state:"ready"});if(s.start>s.queued)taskIntervals.push({taskId:task.id,startS:s.queued,endS:s.start,state:"queued"});
      const d=duration(task.serviceTime,`task ${task.id}.serviceTime`),end=t+d;emit(t,"task_started",{taskId:task.id,resourcePoolId:r.id,metadata:{resourceCount:task.resourceCount,serviceTimeS:d}});runs.push({taskId:task.id,resourcePoolId:r.id,startS:t,endS:end,units:task.resourceCount});taskIntervals.push({taskId:task.id,startS:t,endS:end,state:"running"});evq.push(end,"complete",{id:task.id});}}
  }
  const settle=t=>{admit(t);start(t);};
  function complete(t,id){const s=st.get(id),task=s.t,r=resources.get(task.resourcePoolId),p=pools.get(r.id);if(s.status!=="running")die(`invalid completion ${id}`);s.status="complete";s.end=t;p.used-=task.resourceCount;if(r.kind==="qpu")inflight--;emit(t,"task_completed",{taskId:id,resourcePoolId:r.id});taskIntervals.push({taskId:id,startS:t,endS:t,state:"complete"});
    for(const d of outgoing.get(id)){const dt=transferTime(d);emit(t,"communication_started",{taskId:id,metadata:{dependencyId:d.id,sourceTaskId:id,targetTaskId:d.targetTaskId,durationS:dt}});evq.push(t+dt,"transferComplete",{d});}}
  function transferDone(t,d){emit(t,"communication_completed",{taskId:d.targetTaskId,metadata:{dependencyId:d.id,targetTaskId:d.targetTaskId}});const s=st.get(d.targetTaskId);s.deps--;if(!s.deps)ready(s,t);}

  for(const s of st.values())if(!s.deps)ready(s,0);settle(0);
  while(true){const t=evq.next();if(t===null)break;do{for(const e of evq.at(t)){if(e.type==="complete")complete(t,e.data.id);else transferDone(t,e.data.d);}settle(t);}while(evq.has(t));}
  const incomplete=[...st.values()].filter(s=>s.status!=="complete");if(incomplete.length)die(`simulation stalled: ${incomplete.map(s=>s.t.id).join(",")}`);
  const makespanS=Math.max(...[...st.values()].map(s=>s.end??0)),communicationSeconds=spec.dependencies.reduce((s,d)=>s+transferTime(d),0);
  const {intervals:resourceIntervals,metric}=resourceAccounting(spec,runs,makespanS);const totalCost=Object.values(metric.costByPool).reduce((a,b)=>a+b,0);
  taskIntervals.sort((a,b)=>a.startS-b.startS||a.endS-b.endS||order.get(a.taskId)-order.get(b.taskId)||a.state.localeCompare(b.state));
  return {workflowId:spec.id,events,resourceIntervals,taskIntervals,queueSeries,metrics:{makespanS,...metric,queueWaitSecondsByPool:qs,admissionWaitSecondsByPool:aw,communicationSeconds,totalCost},assumptions:[...(spec.assumptions??[])]};
}
