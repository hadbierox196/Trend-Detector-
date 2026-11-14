import { DEMOS } from '../data/variables.js';

export default function DemoBar({ onRun }) {
  return (
    <div className="demo-bar">
      {DEMOS.map((d) => (
        <button key={d.id} className="demo-card" onClick={() => onRun(d)}>
          <strong>{d.title}</strong>
          <span>{d.note}</span>
        </button>
      ))}
    </div>
  );
}
