import test from "node:test";
import assert from "node:assert/strict";
import { deriveActorGroupSummaryAt, deriveActorStateCountsAt } from "../src/design/actor-state.mjs";
import { deriveSystemStateSnapshot } from "../src/causal/systemState.mjs";
import { simulateWorkflow } from "../src/engine/runtime.mjs";
import { deriveActiveTransferSummary } from "../src/components/explore/simpleState.mjs";
import {
 qampScenarioC1000Compilation as compiled,
 qampScenarioC1000Design as design,
 qampScenarioC1000RunConfiguration as config,
 qampScenarioC1000Profile as profile,
 qampScenarioC1000WorkflowSpec as spec
} from "../src/presets/qamp-c-1000-demo.mjs";

const result = simulateWorkflow(spec);
const approx = (x,y) => assert.ok(Math.abs(x-y)<1e-7,`expected ${x} ≈ ${y}`);
const counts = t => deriveActorStateCountsAt(compiled.manifest,result,"ranks",t);
const snapshot = t => deriveSystemStateSnapshot(spec,result,t);
function event(type,taskId){
 const e=result.events.find(e=>e.type===type && e.taskId===taskId);
 assert.ok(e,`missing ${type} on ${taskId}`);
 return e.simTimeS;
}
function expectCounts(t,working,blocked,idle) {
 assert.deepEqual(counts(t),{actorGroupId:"ranks",simTimeS:t,working,blocked,idle});
}
test("C has 1000 individual QPU jobs and 2000 transfer dependencies, not five aggregate jobs",()=>{
 assert.equal(design.tasks.length,3);
 assert.deepEqual(design.tasks.map(x=>x.multiplicity),[1000,1000,1000]);
 assert.equal(spec.tasks.length,3000);
 assert.equal(spec.dependencies.length,2000);
 assert.equal(Object.keys(compiled.manifest.actorWaits).length,1000);
 assert.equal(config.actorGroupCounts.ranks,1000);
 assert.equal(config.resources.find(x=>x.kind==="qpu").capacity,1);
 assert.equal(config.policy.maxInFlightQuantumByPool,undefined);
 assert.equal(design.metadata.synchronization,"none");
 assert.equal(design.metadata.requestGranularity,"individual-per-rank");
 for(const [ordinal,expected] of [[1,5],[2,5.7],[1000,704.3]]){
  const edge=spec.dependencies.find(d=>d.id===`prepare-quantum#${ordinal}`);
  assert.ok(edge);
  approx(edge.fixedLatencyS,expected);
  assert.ok(!("instanceStaggerS" in edge));
  assert.equal(compiled.manifest.dependencies[edge.id].communicationProvenance.kind,"synthetic");
 }
});
test("1000 Blocked while all 1000 outbound transfers are in flight before QPU sees any job",()=>{
 expectCounts(0.1,1000,0,0);
 expectCounts(0.3,0,1000,0);
 expectCounts(4.5,0,1000,0);
 for(const time of [0.3,4.5]){
  const ss=snapshot(time),summary=deriveActiveTransferSummary(spec,ss);
  assert.equal(ss.resources.qpuByPool.qpu.activeUnits,0);
  assert.equal(ss.resources.qpuByPool.qpu.queueDepth,0);
  assert.equal(ss.causal.policyHeldQuantumTasks.length,0);
  assert.equal(ss.causal.activeCommunications.length,1000);
  assert.equal(ss.dag.activeCommunicationDependencyIds.length,1000);
  assert.deepEqual(summary,{outbound:1000,returning:0,other:0,total:1000,beforeFirstQpuExecution:true});
 }
 assert.equal(result.metrics.queueWaitSecondsByPool.qpu,0);
 assert.equal(result.metrics.admissionWaitSecondsByPool.qpu,0);
});
test("first result gets back and unblocks exactly one rank before second job arrives",()=>{
 approx(event("task_started","quantum#1"),5.2);
 approx(event("task_completed","quantum#1"),5.25);
 approx(event("task_started","consumer#1"),5.5);
 approx(event("task_completed","consumer#1"),5.8);
 approx(event("task_started","quantum#2"),5.9);
 expectCounts(5.22,0,1000,0);
 expectCounts(5.6,1,999,0);
 expectCounts(5.85,0,999,1);
 assert.equal(snapshot(5.6).resources.qpuByPool.qpu.activeUnits,0);
 assert.equal(snapshot(5.6).resources.qpuByPool.qpu.queueDepth,0);
 assert.equal(deriveActiveTransferSummary(spec,snapshot(5.6)).outbound,999);
});
test("all 1000 QPU jobs execute individually and all ranks resume independently",()=>{
 for(const i of [1,2,3,150,500,999,1000]){
  const start=event("task_started",`quantum#${i}`);
  const resumed=event("task_started",`consumer#${i}`);
  approx(start,5.2+(i-1)*0.7);
  approx(resumed,start+0.05+0.25);
  if(i<1000)assert.ok(resumed<5.2+i*0.7);
 }
 assert.equal(result.events.filter(e=>e.type==="task_started"&&e.taskId?.startsWith("quantum#")).length,1000);
 assert.equal(result.events.filter(e=>e.type==="task_started"&&e.taskId?.startsWith("consumer#")).length,1000);
 assert.ok(!design.actorWaits.some(w=>w.reason==="global-synchronization"));
 assert.ok(result.metrics.utilizationByPool.qpu<0.1);
 approx(result.metrics.makespanS,705.1);
 expectCounts(705.1,0,0,1000);
});
test("transfer wall is traceable to engine communication and authored per-rank waits",()=>{
 const ss=snapshot(4.5),ids=new Set(spec.dependencies.map(d=>d.id));
 for(const tr of ss.causal.activeCommunications){
  assert.ok(ids.has(tr.dependencyId));
  assert.ok(tr.targetTaskId.startsWith("quantum#"));
 }
 const summary=deriveActorGroupSummaryAt(compiled.manifest,result,"ranks",4.5);
 assert.equal(summary.blockedReasonCounts["quantum-result"],1000);
 assert.equal(summary.blockedReasonCounts["global-synchronization"]??0,0);
 assert.ok(result.metrics.aggregateCommunicationSeconds>spec.tasks.reduce((n,t)=>n+t.serviceTime.seconds,0));
 assert.equal(profile.dependencyCommunication["outbound-transfer"].value.instanceStaggerS,0.7);
 assert.equal(profile.dependencyCommunication["outbound-transfer"].provenance.kind,"synthetic");
 assert.match(profile.dependencyCommunication["outbound-transfer"].provenance.notes,/not a shared-network contention/i);
});
