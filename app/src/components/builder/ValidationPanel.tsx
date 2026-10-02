import type { ValidationIssue } from "../../domain/validation";

export function ValidationPanel({ issues }: { issues: ValidationIssue[] }) {
  const errors = issues.filter((issue) => issue.severity === "error");
  return (
    <section className="surface validation-surface" aria-live="polite" aria-labelledby="validation-heading">
      <div className="surface-heading compact">
        <div>
          <p className="section-kicker">Engine contract</p>
          <h2 id="validation-heading">Validation</h2>
        </div>
        <span className={errors.length === 0 ? "status-chip ok" : "status-chip error"}>
          {errors.length === 0 ? "valid" : errors.length + " error" + (errors.length === 1 ? "" : "s")}
        </span>
      </div>
      {issues.length === 0 ? (
        <p className="validation-ok">Frozen v1 engine validator accepts this workflow.</p>
      ) : (
        <ul className="issue-list">
          {issues.map((issue, index) => (
            <li key={issue.path + index} className={issue.severity}>
              <strong>{issue.path}</strong> — {issue.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
