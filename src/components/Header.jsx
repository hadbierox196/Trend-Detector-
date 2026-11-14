import { useState } from 'react';
import { VARIABLES } from '../api.js';
import { useEducation } from '../context/EducationContext.jsx';

export default function Header({ variable, onVariable }) {
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState(false);
  const { on: learning, toggle: toggleLearning } = useEducation();
  return (
    <header className="header">
      <div className="topbar">
        <button className="icon-btn" aria-label="Menu" onClick={() => setMenu(true)}>
          <span /><span /><span />
        </button>
        <h1 className="brand">Nature Map</h1>
        <button className={learning ? 'chip on learning-toggle' : 'chip learning-toggle'} onClick={toggleLearning} aria-pressed={learning}>
          📘 {learning ? 'Learning mode: on' : 'Learning mode'}
        </button>
      </div>

      <div className="select-wrap">
        <button className="big-select" onClick={() => setOpen(!open)} aria-expanded={open}>
          <small>Choose Your Variable</small>
          <strong>{variable.label}</strong>
          <i className={open ? 'chev up' : 'chev'} />
        </button>
        {open && (
          <ul className="select-list">
            {VARIABLES.map((v) => (
              <li key={v.id}>
                <button className={v.id === variable.id ? 'active' : ''} onClick={() => { onVariable(v); setOpen(false); }}>
                  {v.label}<span>{v.unit}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {menu && <div className="backdrop" onClick={() => setMenu(false)} />}
      <nav className={menu ? 'drawer show' : 'drawer'}>
        <button className="close" onClick={() => setMenu(false)}>×</button>
        {['Map', 'Dashboards', 'Data', 'About', 'Contact'].map((l) => (
          <a key={l} href="#" onClick={(e) => { e.preventDefault(); setMenu(false); }}>{l}</a>
        ))}
      </nav>
    </header>
  );
}
