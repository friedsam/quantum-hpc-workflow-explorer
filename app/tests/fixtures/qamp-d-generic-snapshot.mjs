// Pinned generic fallback evidence for Round 4B.
// Agent A Scenario D fixture + frozen DES, viewed through the accepted integration causal adapter.

export const qampDGenericProducer = Object.freeze({
  engineBlob: "4023b3daf8ae7e50c6e7b7be8a886e2ea392dc84",
  scenarioFixtureBlob: "5c4e64f58d5e0be4e8db5cc1697736b254f12482",
  causalAdapterBlob: "291e85d53ab1d9a9cdc3b6becd4aef3c9ac4a01a",
});

export const qampDGenericSnapshotAt1 = {
  "simTimeS": 1,
  "resources": {
    "classicalByPool": {
      "cpu": {
        "resourcePoolId": "cpu",
        "kind": "cpu",
        "capacity": 6,
        "activeUnits": 0,
        "allocatedIdleUnits": 0,
        "releasedUnits": 6,
        "queuedTaskIds": [],
        "queueDepth": 0
      }
    },
    "qpuByPool": {
      "qpu": {
        "resourcePoolId": "qpu",
        "kind": "qpu",
        "capacity": 1,
        "activeUnits": 1,
        "allocatedIdleUnits": 0,
        "releasedUnits": 0,
        "queuedTaskIds": [
          "quantum-2"
        ],
        "queueDepth": 1
      }
    }
  },
  "causal": {
    "activeCommunications": [],
    "policyHeldQuantumTasks": [
      {
        "taskId": "quantum-3",
        "resourcePoolId": "qpu",
        "qpuDemandUnits": 1,
        "reason": "maxInFlightQuantumByPool",
        "evidence": "derived"
      },
      {
        "taskId": "quantum-4",
        "resourcePoolId": "qpu",
        "qpuDemandUnits": 1,
        "reason": "maxInFlightQuantumByPool",
        "evidence": "derived"
      },
      {
        "taskId": "quantum-5",
        "resourcePoolId": "qpu",
        "qpuDemandUnits": 1,
        "reason": "maxInFlightQuantumByPool",
        "evidence": "derived"
      },
      {
        "taskId": "quantum-6",
        "resourcePoolId": "qpu",
        "qpuDemandUnits": 1,
        "reason": "maxInFlightQuantumByPool",
        "evidence": "derived"
      }
    ],
    "dependencyGatedClassical": [
      {
        "taskId": "consumer-1",
        "classicalDemandUnits": 1,
        "incomingDependencyCount": 1,
        "unresolved": [
          {
            "dependencyId": "d-q-1-consumer",
            "sourceTaskId": "quantum-1",
            "directState": "qpu-predecessor-incomplete"
          }
        ],
        "structuralJoin": false,
        "explanation": "dependency-gate",
        "evidence": "derived"
      },
      {
        "taskId": "consumer-2",
        "classicalDemandUnits": 1,
        "incomingDependencyCount": 1,
        "unresolved": [
          {
            "dependencyId": "d-q-2-consumer",
            "sourceTaskId": "quantum-2",
            "directState": "qpu-predecessor-incomplete"
          }
        ],
        "structuralJoin": false,
        "explanation": "dependency-gate",
        "evidence": "derived"
      },
      {
        "taskId": "consumer-3",
        "classicalDemandUnits": 1,
        "incomingDependencyCount": 1,
        "unresolved": [
          {
            "dependencyId": "d-q-3-consumer",
            "sourceTaskId": "quantum-3",
            "directState": "qpu-predecessor-incomplete"
          }
        ],
        "structuralJoin": false,
        "explanation": "dependency-gate",
        "evidence": "derived"
      },
      {
        "taskId": "consumer-4",
        "classicalDemandUnits": 1,
        "incomingDependencyCount": 1,
        "unresolved": [
          {
            "dependencyId": "d-q-4-consumer",
            "sourceTaskId": "quantum-4",
            "directState": "qpu-predecessor-incomplete"
          }
        ],
        "structuralJoin": false,
        "explanation": "dependency-gate",
        "evidence": "derived"
      },
      {
        "taskId": "consumer-5",
        "classicalDemandUnits": 1,
        "incomingDependencyCount": 1,
        "unresolved": [
          {
            "dependencyId": "d-q-5-consumer",
            "sourceTaskId": "quantum-5",
            "directState": "qpu-predecessor-incomplete"
          }
        ],
        "structuralJoin": false,
        "explanation": "dependency-gate",
        "evidence": "derived"
      },
      {
        "taskId": "consumer-6",
        "classicalDemandUnits": 1,
        "incomingDependencyCount": 1,
        "unresolved": [
          {
            "dependencyId": "d-q-6-consumer",
            "sourceTaskId": "quantum-6",
            "directState": "qpu-predecessor-incomplete"
          }
        ],
        "structuralJoin": false,
        "explanation": "dependency-gate",
        "evidence": "derived"
      }
    ]
  },
  "dag": {
    "taskStateById": {
      "prep-1": "complete",
      "prep-2": "complete",
      "prep-3": "complete",
      "prep-4": "complete",
      "prep-5": "complete",
      "prep-6": "complete",
      "quantum-1": "running",
      "quantum-2": "queued",
      "quantum-3": "policy-held",
      "quantum-4": "policy-held",
      "quantum-5": "policy-held",
      "quantum-6": "policy-held",
      "consumer-1": "dependency-gated",
      "consumer-2": "dependency-gated",
      "consumer-3": "dependency-gated",
      "consumer-4": "dependency-gated",
      "consumer-5": "dependency-gated",
      "consumer-6": "dependency-gated"
    },
    "activeCommunicationDependencyIds": []
  }
};
