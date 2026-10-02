import { fixtures } from "../../contracts";

interface Props {
  selectedKey: string;
  onLoadFixture: (key: string) => void;
  onRequestSimulation: () => void;
  canRequest: boolean;
}

export function PresetBar({ selectedKey, onLoadFixture, onRequestSimulation, canRequest }: Props) {
  return (
    <div className="preset-bar">
      <div>
        <label htmlFor="preset-select">Fixture</label>
        <select id="preset-select" value={selectedKey} onChange={(event) => onLoadFixture(event.target.value)}>
          {selectedKey === "" ? <option value="" disabled>Custom draft</option> : null}
          {fixtures.map((fixture) => (
            <option key={fixture.key} value={fixture.key}>{fixture.label}</option>
          ))}
        </select>
      </div>
      <button className="primary-action" disabled={!canRequest} onClick={onRequestSimulation}>
        Request simulation
      </button>
    </div>
  );
}
