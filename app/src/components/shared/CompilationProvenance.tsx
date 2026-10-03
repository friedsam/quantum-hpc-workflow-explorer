import type { CompilationManifest } from "../../design/types";
import type { WorkflowDesignBundle } from "../../design/bundle";

interface Props {
  bundle: WorkflowDesignBundle;
  manifest: CompilationManifest;
  compact?: boolean;
}

export function CompilationProvenance({ bundle, manifest, compact = false }: Props) {
  const timingKinds = [...new Set(
    Object.values(manifest.tasks).map((entry) => entry.timingProvenance.kind)
  )];
  const communicationKinds = [...new Set(
    Object.values(manifest.dependencies)
      .map((entry) => entry.communicationProvenance?.kind)
      .filter((value): value is "synthetic" | "user-entered" | "measured" | "fitted" => Boolean(value))
  )];

  return (
    <section className={compact ? "surface compilation-provenance compact" : "surface compilation-provenance"} aria-labelledby="compilation-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Design compilation</p>
          <h2 id="compilation-heading">Authored → frozen WorkflowSpec</h2>
        </div>
        <span className="status-chip ok">manifest v{manifest.schemaVersion}</span>
      </div>
      <div className="manifest-grid">
        <div><span>WorkflowDesign</span><strong>{bundle.design.id}</strong></div>
        <div><span>RunConfiguration</span><strong>{bundle.runConfiguration.id}</strong></div>
        <div><span>SystemProfile</span><strong>{bundle.systemProfile.id}</strong></div>
        <div><span>Compiled WorkflowSpec</span><strong>{manifest.workflowSpecId}</strong></div>
        <div><span>Task provenance</span><strong>{timingKinds.join(", ") || "—"}</strong></div>
        <div><span>Communication provenance</span><strong>{communicationKinds.join(", ") || "control edges only"}</strong></div>
      </div>
      <p className="field-note">
        Stable authored IDs map through CompilationManifest to {Object.keys(manifest.tasks).length} compiled tasks and {Object.keys(manifest.dependencies).length} compiled dependencies. Editing the compiled WorkflowSpec directly detaches this provenance context.
      </p>
    </section>
  );
}
