import { useMemo, useState } from 'react';
import { VARIABLES, MISSIONS, categories } from '../data/variables.js';

export default function VariableFinder({ variable, onVariable, open, onToggle }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');

  const results = useMemo(() => {
    const text = q.trim().toLowerCase();
    return VARIABLES.filter((v) => {
      const matchesCat = cat === 'All' || v.category === cat;
      const matchesText = !text || v.label.toLowerCase().includes(text) || v.def.toLowerCase().includes(text) || v.mission.toLowerCase().includes(text);
      return matchesCat && matchesText;
    });
  }, [q, cat]);

  return (
    <div className="panel finder">
      <button className="panel-toggle" onClick={onToggle} aria-expanded={open}>
        <span>Variable finder</span>
        <strong>{variable.label}</strong>
        <i className={open ? 'chev up' : 'chev'} />
      </button>
      {open && (
        <div className="panel-body">
          <input
            className="search-input"
            placeholder="Search variables (e.g. soil moisture, NO2, temperature)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="chip-row scroll">
            <button className={cat === 'All' ? 'chip on' : 'chip'} onClick={() => setCat('All')}>All</button>
            {categories.map((c) => (
              <button key={c} className={cat === c ? 'chip on' : 'chip'} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          <ul className="var-list">
            {results.map((v) => {
              const mission = MISSIONS[v.mission];
              return (
                <li key={v.id}>
                  <button className={v.id === variable.id ? 'var-card active' : 'var-card'} onClick={() => { onVariable(v); onToggle(); }}>
                    <div className="var-card-head">
                      <strong>{v.label}</strong>
                      <span className="badge" title={mission?.full}>{mission?.label}</span>
                    </div>
                    <p>{v.def}</p>
                    <div className="var-card-foot">
                      <span>{v.unit}</span>
                      <span>{v.cadence.join(' · ')}</span>
                    </div>
                  </button>
                </li>
              );
            })}
            {results.length === 0 && <li className="empty">No variables match "{q}".</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
