import { useState } from 'react';
import { REGION_PRESETS } from '../data/regions.js';

export default function RegionPicker({ presetId, bounds, onPreset, onClear, onManualBounds }) {
  const custom = !presetId && bounds;
  const [manual, setManual] = useState(() => bounds || { s: '', n: '', w: '', e: '' });
  const [manualOpen, setManualOpen] = useState(false);

  const applyManual = () => {
    const { s, n, w, e } = manual;
    if ([s, n, w, e].some((v) => v === '' || Number.isNaN(Number(v)))) return;
    onManualBounds({ s: Number(s), n: Number(n), w: Number(w), e: Number(e) });
  };

  return (
    <div className="panel region-picker">
      <div className="panel-body row">
        <label className="field grow">
          <span>Region</span>
          <select value={presetId || (custom ? '__custom__' : 'global')} onChange={(e) => onPreset(e.target.value === 'global' ? null : e.target.value)}>
            {REGION_PRESETS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            {custom && <option value="__custom__">Custom (drawn on map)</option>}
          </select>
        </label>
        {(custom || presetId) && presetId !== 'global' && (
          <button className="chip" onClick={onClear}>Reset to global</button>
        )}
      </div>
      <p className="hint small">Drag "Select area" on the map, or set a box by hand below (handy without a mouse).</p>
      <div className="panel-body">
        <button className="chip" onClick={() => setManualOpen((v) => !v)} aria-expanded={manualOpen}>
          {manualOpen ? 'Hide manual entry' : 'Enter coordinates manually'}
        </button>
        {manualOpen && (
          <div className="manual-bounds">
            {['s', 'n', 'w', 'e'].map((k) => (
              <label className="field" key={k}>
                <span>{{ s: 'South', n: 'North', w: 'West', e: 'East' }[k]}</span>
                <input
                  type="number" step="0.1" inputMode="decimal"
                  value={manual[k]}
                  onChange={(e) => setManual((m) => ({ ...m, [k]: e.target.value }))}
                  aria-label={`${{ s: 'South', n: 'North', w: 'West', e: 'East' }[k]} bound, degrees`}
                />
              </label>
            ))}
            <button className="chip on" onClick={applyManual}>Apply box</button>
          </div>
        )}
      </div>
    </div>
  );
}
