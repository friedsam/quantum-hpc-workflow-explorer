// Pinned from Agent A Round-4 actor model.
// Producer head: 33f588033aa45ad811264e795f06242a2bec5ac9
// Engine blob: 4023b3daf8ae7e50c6e7b7be8a886e2ea392dc84
// Compiler blob: bb487feede9ca0eb2b9f499aea44a21d7fbdb83b
// Actor-state blob: 72d62283115faf63ab941ba643d06771feb81c9d
// Scenario-B actor example blob: f6ae694aec16bf40f3661e0923ece4366214964f

export const round4ActorProducer = Object.freeze({
  head: "33f588033aa45ad811264e795f06242a2bec5ac9",
  engineBlob: "4023b3daf8ae7e50c6e7b7be8a886e2ea392dc84",
  compilerBlob: "bb487feede9ca0eb2b9f499aea44a21d7fbdb83b",
  actorStateBlob: "72d62283115faf63ab941ba643d06771feb81c9d",
  exampleBlob: "f6ae694aec16bf40f3661e0923ece4366214964f",
});

export const qampBActorManifest = {
  "schemaVersion": 1,
  "designId": "qamp-b-actor-design",
  "runConfigurationId": "qamp-b-actor-run",
  "systemProfileId": "qamp-b-actor-profile",
  "workflowSpecId": "qamp-b-actor-compiled",
  "tasks": {
    "prepare#1": {
      "designTaskId": "prepare",
      "logicalMultiplicity": 2,
      "logicalInstanceOrdinal": 1,
      "timingKey": "prepare",
      "timingProvenance": {
        "kind": "synthetic",
        "source": "Round 4A Scenario B actor acceptance fixture",
        "notes": "Illustrative subset preparation duration."
      },
      "actorAssignments": [
        {
          "actorGroupId": "ranks",
          "selection": {
            "kind": "one",
            "actorOrdinal": 1
          },
          "stateDuringTask": "working"
        }
      ]
    },
    "prepare#2": {
      "designTaskId": "prepare",
      "logicalMultiplicity": 2,
      "logicalInstanceOrdinal": 2,
      "timingKey": "prepare",
      "timingProvenance": {
        "kind": "synthetic",
        "source": "Round 4A Scenario B actor acceptance fixture",
        "notes": "Illustrative subset preparation duration."
      },
      "actorAssignments": [
        {
          "actorGroupId": "ranks",
          "selection": {
            "kind": "one",
            "actorOrdinal": 2
          },
          "stateDuringTask": "working"
        }
      ]
    },
    "quantum#1": {
      "designTaskId": "quantum",
      "logicalMultiplicity": 2,
      "logicalInstanceOrdinal": 1,
      "timingKey": "quantum",
      "timingProvenance": {
        "kind": "synthetic",
        "source": "Round 4A Scenario B actor acceptance fixture",
        "notes": "Illustrative serialized QPU service duration."
      }
    },
    "quantum#2": {
      "designTaskId": "quantum",
      "logicalMultiplicity": 2,
      "logicalInstanceOrdinal": 2,
      "timingKey": "quantum",
      "timingProvenance": {
        "kind": "synthetic",
        "source": "Round 4A Scenario B actor acceptance fixture",
        "notes": "Illustrative serialized QPU service duration."
      }
    },
    "collective": {
      "designTaskId": "collective",
      "logicalMultiplicity": 1,
      "logicalInstanceOrdinal": 1,
      "timingKey": "collective",
      "timingProvenance": {
        "kind": "synthetic",
        "source": "Round 4A Scenario B actor acceptance fixture",
        "notes": "Illustrative full collective duration."
      },
      "actorAssignments": [
        {
          "actorGroupId": "ranks",
          "selection": {
            "kind": "all"
          },
          "stateDuringTask": "working"
        }
      ]
    }
  },
  "dependencies": {
    "prepare-quantum#1": {
      "kind": "design-dependency",
      "designDependencyId": "prepare-quantum",
      "sourceLogicalInstanceOrdinal": 1,
      "targetLogicalInstanceOrdinal": 1,
      "communicationKey": "prepare-quantum"
    },
    "prepare-quantum#2": {
      "kind": "design-dependency",
      "designDependencyId": "prepare-quantum",
      "sourceLogicalInstanceOrdinal": 2,
      "targetLogicalInstanceOrdinal": 2,
      "communicationKey": "prepare-quantum"
    },
    "quantum-collective#1->1": {
      "kind": "design-dependency",
      "designDependencyId": "quantum-collective",
      "sourceLogicalInstanceOrdinal": 1,
      "targetLogicalInstanceOrdinal": 1,
      "communicationKey": "quantum-collective"
    },
    "quantum-collective#2->1": {
      "kind": "design-dependency",
      "designDependencyId": "quantum-collective",
      "sourceLogicalInstanceOrdinal": 2,
      "targetLogicalInstanceOrdinal": 1,
      "communicationKey": "quantum-collective"
    }
  },
  "resources": {
    "cpu": {
      "runResourceId": "cpu",
      "costKey": "cpu",
      "costSource": "unset"
    },
    "qpu": {
      "runResourceId": "qpu",
      "costKey": "qpu",
      "costSource": "unset"
    }
  },
  "actorGroups": {
    "ranks": {
      "actorGroupId": "ranks",
      "label": "MPI ranks",
      "kind": "mpi-rank",
      "count": 4
    }
  },
  "actorWaits": {
    "submitter-result-wait#1": {
      "designWaitId": "submitter-result-wait",
      "actorGroupId": "ranks",
      "selection": {
        "kind": "one",
        "actorOrdinal": 1
      },
      "logicalInstanceOrdinal": 1,
      "activation": {
        "eventType": "task_completed",
        "taskIds": [
          "prepare#1"
        ],
        "quantifier": "all"
      },
      "release": {
        "eventType": "task_completed",
        "taskIds": [
          "quantum#1"
        ],
        "quantifier": "all"
      },
      "reason": "quantum-result"
    },
    "submitter-result-wait#2": {
      "designWaitId": "submitter-result-wait",
      "actorGroupId": "ranks",
      "selection": {
        "kind": "one",
        "actorOrdinal": 2
      },
      "logicalInstanceOrdinal": 2,
      "activation": {
        "eventType": "task_completed",
        "taskIds": [
          "prepare#2"
        ],
        "quantifier": "all"
      },
      "release": {
        "eventType": "task_completed",
        "taskIds": [
          "quantum#2"
        ],
        "quantifier": "all"
      },
      "reason": "quantum-result"
    },
    "global-result-gate": {
      "designWaitId": "global-result-gate",
      "actorGroupId": "ranks",
      "selection": {
        "kind": "all"
      },
      "activation": {
        "eventType": "task_completed",
        "taskIds": [
          "quantum#1",
          "quantum#2"
        ],
        "quantifier": "any"
      },
      "release": {
        "eventType": "task_completed",
        "taskIds": [
          "quantum#1",
          "quantum#2"
        ],
        "quantifier": "all"
      },
      "reason": "global-synchronization"
    }
  }
};

export const qampBActorSimulationResult = {
  "workflowId": "qamp-b-actor-compiled",
  "events": [
    {
      "seq": 0,
      "simTimeS": 0,
      "type": "task_ready",
      "taskId": "prepare#1",
      "resourcePoolId": "cpu"
    },
    {
      "seq": 1,
      "simTimeS": 0,
      "type": "task_ready",
      "taskId": "prepare#2",
      "resourcePoolId": "cpu"
    },
    {
      "seq": 2,
      "simTimeS": 0,
      "type": "task_queued",
      "taskId": "prepare#1",
      "resourcePoolId": "cpu",
      "metadata": {
        "queueDepth": 1
      }
    },
    {
      "seq": 3,
      "simTimeS": 0,
      "type": "task_started",
      "taskId": "prepare#1",
      "resourcePoolId": "cpu",
      "metadata": {
        "resourceCount": 1,
        "serviceTimeS": 1
      }
    },
    {
      "seq": 4,
      "simTimeS": 0,
      "type": "task_queued",
      "taskId": "prepare#2",
      "resourcePoolId": "cpu",
      "metadata": {
        "queueDepth": 1
      }
    },
    {
      "seq": 5,
      "simTimeS": 0,
      "type": "task_started",
      "taskId": "prepare#2",
      "resourcePoolId": "cpu",
      "metadata": {
        "resourceCount": 1,
        "serviceTimeS": 1
      }
    },
    {
      "seq": 6,
      "simTimeS": 1,
      "type": "task_completed",
      "taskId": "prepare#1",
      "resourcePoolId": "cpu",
      "metadata": {}
    },
    {
      "seq": 7,
      "simTimeS": 1,
      "type": "task_ready",
      "taskId": "quantum#1",
      "resourcePoolId": "qpu"
    },
    {
      "seq": 8,
      "simTimeS": 1,
      "type": "task_completed",
      "taskId": "prepare#2",
      "resourcePoolId": "cpu",
      "metadata": {}
    },
    {
      "seq": 9,
      "simTimeS": 1,
      "type": "task_ready",
      "taskId": "quantum#2",
      "resourcePoolId": "qpu"
    },
    {
      "seq": 10,
      "simTimeS": 1,
      "type": "task_queued",
      "taskId": "quantum#1",
      "resourcePoolId": "qpu",
      "metadata": {
        "queueDepth": 1,
        "qpuInFlight": 1
      }
    },
    {
      "seq": 11,
      "simTimeS": 1,
      "type": "task_started",
      "taskId": "quantum#1",
      "resourcePoolId": "qpu",
      "metadata": {
        "resourceCount": 1,
        "serviceTimeS": 3
      }
    },
    {
      "seq": 12,
      "simTimeS": 1,
      "type": "task_throttled",
      "taskId": "quantum#2",
      "resourcePoolId": "qpu",
      "metadata": {
        "reason": "maxInFlightQuantumByPool",
        "maxInFlightQuantum": 1
      }
    },
    {
      "seq": 13,
      "simTimeS": 4,
      "type": "task_completed",
      "taskId": "quantum#1",
      "resourcePoolId": "qpu",
      "metadata": {
        "qpuInFlight": 0
      }
    },
    {
      "seq": 14,
      "simTimeS": 4,
      "type": "task_queued",
      "taskId": "quantum#2",
      "resourcePoolId": "qpu",
      "metadata": {
        "queueDepth": 1,
        "qpuInFlight": 1
      }
    },
    {
      "seq": 15,
      "simTimeS": 4,
      "type": "task_started",
      "taskId": "quantum#2",
      "resourcePoolId": "qpu",
      "metadata": {
        "resourceCount": 1,
        "serviceTimeS": 3
      }
    },
    {
      "seq": 16,
      "simTimeS": 7,
      "type": "task_completed",
      "taskId": "quantum#2",
      "resourcePoolId": "qpu",
      "metadata": {
        "qpuInFlight": 0
      }
    },
    {
      "seq": 17,
      "simTimeS": 7,
      "type": "task_ready",
      "taskId": "collective",
      "resourcePoolId": "cpu"
    },
    {
      "seq": 18,
      "simTimeS": 7,
      "type": "task_queued",
      "taskId": "collective",
      "resourcePoolId": "cpu",
      "metadata": {
        "queueDepth": 1
      }
    },
    {
      "seq": 19,
      "simTimeS": 7,
      "type": "task_started",
      "taskId": "collective",
      "resourcePoolId": "cpu",
      "metadata": {
        "resourceCount": 4,
        "serviceTimeS": 1
      }
    },
    {
      "seq": 20,
      "simTimeS": 8,
      "type": "task_completed",
      "taskId": "collective",
      "resourcePoolId": "cpu",
      "metadata": {}
    }
  ],
  "resourceIntervals": [
    {
      "taskId": "prepare#1",
      "resourcePoolId": "cpu",
      "startS": 0,
      "endS": 1,
      "units": 1,
      "state": "active"
    },
    {
      "taskId": "prepare#2",
      "resourcePoolId": "cpu",
      "startS": 0,
      "endS": 1,
      "units": 1,
      "state": "active"
    },
    {
      "resourcePoolId": "cpu",
      "startS": 0,
      "endS": 1,
      "state": "allocated-idle",
      "units": 2
    },
    {
      "resourcePoolId": "qpu",
      "startS": 0,
      "endS": 1,
      "state": "released",
      "units": 1
    },
    {
      "taskId": "quantum#1",
      "resourcePoolId": "qpu",
      "startS": 1,
      "endS": 4,
      "units": 1,
      "state": "active"
    },
    {
      "resourcePoolId": "cpu",
      "startS": 1,
      "endS": 7,
      "state": "allocated-idle",
      "units": 4
    },
    {
      "taskId": "quantum#2",
      "resourcePoolId": "qpu",
      "startS": 4,
      "endS": 7,
      "units": 1,
      "state": "active"
    },
    {
      "taskId": "collective",
      "resourcePoolId": "cpu",
      "startS": 7,
      "endS": 8,
      "units": 4,
      "state": "active"
    },
    {
      "resourcePoolId": "qpu",
      "startS": 7,
      "endS": 8,
      "state": "released",
      "units": 1
    }
  ],
  "taskIntervals": [
    {
      "taskId": "prepare#1",
      "startS": 0,
      "endS": 1,
      "state": "running"
    },
    {
      "taskId": "prepare#2",
      "startS": 0,
      "endS": 1,
      "state": "running"
    },
    {
      "taskId": "quantum#1",
      "startS": 1,
      "endS": 4,
      "state": "running"
    },
    {
      "taskId": "quantum#2",
      "startS": 1,
      "endS": 4,
      "state": "ready"
    },
    {
      "taskId": "quantum#2",
      "startS": 4,
      "endS": 7,
      "state": "running"
    },
    {
      "taskId": "collective",
      "startS": 7,
      "endS": 8,
      "state": "running"
    }
  ],
  "queueSeries": [
    {
      "simTimeS": 0,
      "resourcePoolId": "cpu",
      "depth": 0
    },
    {
      "simTimeS": 0,
      "resourcePoolId": "qpu",
      "depth": 0
    },
    {
      "simTimeS": 0,
      "resourcePoolId": "cpu",
      "depth": 1
    },
    {
      "simTimeS": 0,
      "resourcePoolId": "cpu",
      "depth": 0
    },
    {
      "simTimeS": 0,
      "resourcePoolId": "cpu",
      "depth": 1
    },
    {
      "simTimeS": 0,
      "resourcePoolId": "cpu",
      "depth": 0
    },
    {
      "simTimeS": 1,
      "resourcePoolId": "qpu",
      "depth": 1
    },
    {
      "simTimeS": 1,
      "resourcePoolId": "qpu",
      "depth": 0
    },
    {
      "simTimeS": 4,
      "resourcePoolId": "qpu",
      "depth": 1
    },
    {
      "simTimeS": 4,
      "resourcePoolId": "qpu",
      "depth": 0
    },
    {
      "simTimeS": 7,
      "resourcePoolId": "cpu",
      "depth": 1
    },
    {
      "simTimeS": 7,
      "resourcePoolId": "cpu",
      "depth": 0
    }
  ],
  "metrics": {
    "makespanS": 8,
    "utilizationByPool": {
      "cpu": 0.1875,
      "qpu": 0.75
    },
    "activeResourceSecondsByPool": {
      "cpu": 6,
      "qpu": 6
    },
    "allocatedResourceSecondsByPool": {
      "cpu": 32,
      "qpu": 6
    },
    "idleAllocatedResourceSecondsByPool": {
      "cpu": 26,
      "qpu": 0
    },
    "releasedResourceSecondsByPool": {
      "cpu": 0,
      "qpu": 2
    },
    "costByPool": {
      "cpu": 0,
      "qpu": 0
    },
    "queueWaitSecondsByPool": {
      "cpu": 0,
      "qpu": 0
    },
    "admissionWaitSecondsByPool": {
      "cpu": 0,
      "qpu": 3
    },
    "aggregateCommunicationSeconds": 0,
    "totalCost": 0
  },
  "assumptions": [
    "Synthetic scaled Scenario B actor fixture; no provider queue model.",
    "Two of four persistent ranks prepare/submit quantum work; wait gates model dependency blocking separately from QPU execution participation.",
    "The QPU phase is serialized with one admitted quantum task at a time so resource-queue buildup is suppressed while the later collective still depends on the complete result set.",
    "Task multiplicity, actor count, and resourceCount are independent inputs.",
    "All service times are synthetic constants used only to expose Scenario B semantics.",
    "Compiled from WorkflowDesign qamp-b-actor-design, RunConfiguration qamp-b-actor-run, SystemProfile qamp-b-actor-profile.",
    "Resolved WorkflowSpec contains deterministic constants only; exact input provenance is retained in RunRecord."
  ]
};

export const qampBExpectedActorStateByTime = {
  "0": [
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 1,
      "simTimeS": 0,
      "state": "working",
      "blockedReasons": []
    },
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 2,
      "simTimeS": 0,
      "state": "working",
      "blockedReasons": []
    },
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 3,
      "simTimeS": 0,
      "state": "idle",
      "blockedReasons": []
    },
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 4,
      "simTimeS": 0,
      "state": "idle",
      "blockedReasons": []
    }
  ],
  "1": [
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 1,
      "simTimeS": 1,
      "state": "blocked",
      "blockedReasons": [
        "quantum-result"
      ]
    },
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 2,
      "simTimeS": 1,
      "state": "blocked",
      "blockedReasons": [
        "quantum-result"
      ]
    },
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 3,
      "simTimeS": 1,
      "state": "idle",
      "blockedReasons": []
    },
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 4,
      "simTimeS": 1,
      "state": "idle",
      "blockedReasons": []
    }
  ],
  "4": [
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 1,
      "simTimeS": 4,
      "state": "blocked",
      "blockedReasons": [
        "global-synchronization"
      ]
    },
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 2,
      "simTimeS": 4,
      "state": "blocked",
      "blockedReasons": [
        "global-synchronization",
        "quantum-result"
      ]
    },
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 3,
      "simTimeS": 4,
      "state": "blocked",
      "blockedReasons": [
        "global-synchronization"
      ]
    },
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 4,
      "simTimeS": 4,
      "state": "blocked",
      "blockedReasons": [
        "global-synchronization"
      ]
    }
  ],
  "7": [
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 1,
      "simTimeS": 7,
      "state": "working",
      "blockedReasons": []
    },
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 2,
      "simTimeS": 7,
      "state": "working",
      "blockedReasons": []
    },
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 3,
      "simTimeS": 7,
      "state": "working",
      "blockedReasons": []
    },
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 4,
      "simTimeS": 7,
      "state": "working",
      "blockedReasons": []
    }
  ],
  "8": [
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 1,
      "simTimeS": 8,
      "state": "idle",
      "blockedReasons": []
    },
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 2,
      "simTimeS": 8,
      "state": "idle",
      "blockedReasons": []
    },
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 3,
      "simTimeS": 8,
      "state": "idle",
      "blockedReasons": []
    },
    {
      "actorGroupId": "ranks",
      "actorOrdinal": 4,
      "simTimeS": 8,
      "state": "idle",
      "blockedReasons": []
    }
  ]
};
