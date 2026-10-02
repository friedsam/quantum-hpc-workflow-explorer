import { presets } from "../../presets/presets";

interface Props {
  selectedKey: string;
  onLoadPreset: (key: string) => void;
  onRequestSimulation: () => void;
  canRequest: boolean;
  simulating: boolean;
}

export function PresetBar({ selectedKey, onLoadPreset, onRequestSimulation, canRequest, simulating }: Props) {
  return (
    <div className="preset-bar">
      <div>
        <label htmlFor="preset-select">Template / preset</label>
        <select id="preset-select" value={selectedKey} onChange={(event) => onLoadPreset(event.target.value)}>
          {selectedKey === "" ? <option value="" disabled>Custom draft</option> : null}
          {presets.map((preset) => (
            <option key={preset.key} value={preset.key}>{preset.label}</option>
          ))}
        </select>
      </div>
      <button className="primary-action" disabled={!canRequest || simulating} onClick={onRequestSimulation}>
        {simulating ? "Simulating…" : "Simulate"}
      </button>
    </div>
  );
}
