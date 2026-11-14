import { useState } from 'react';
import { DETECTIVE_TOPICS, byId } from '../data/variables.js';
import { REGION_PRESETS } from '../data/regions.js';

export default function DetectiveGuide({ open, onToggle, onApply }) {
  const [topic, setTopic] = useState(null);
  const [regionId, setRegionId] = useState('');

  const apply = (variableId) => {
    onApply({ variableId, regionId: regionId || null });
  };

  return (
    <div className="panel guide">
      <button className="panel-toggle" onClick={onToggle} aria-expanded={open}>
        <span>🕵️ What do you want to investigate?</span>
        <i className={open ? 'chev up' : 'chev'} />
      </button>
      {open && (
        <div className="panel-body">
          <p className="hint">Pick what you're looking into and, optionally, where — we'll suggest the variables that tell that story.</p>
          <div className="chip-row wrap">
            {DETECTIVE_TOPICS.map((t) => (
              <button key={t.key} className={topic?.key === t.key ? 'chip on' : 'chip'} onClick={() => setTopic(t)}>{t.label}</button>
            ))}
          </div>
          <label className="field block">
            <span>Where (optional)</span>
            <select value={regionId} onChange={(e) => setRegionId(e.target.value)}>
              <option value="">Anywhere / I'll pick on the map</option>
              {REGION_PRESETS.filter((r) => r.bounds).map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </label>

          {topic && (
            <div className="suggestion">
              <p className="suggestion-hint">{topic.hint}</p>
              <div className="chip-row wrap">
                {topic.variables.map((vid) => {
                  const v = byId(vid);
                  return <button key={vid} className="chip suggest" onClick={() => apply(vid)}>Use “{v.label}”</button>;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
