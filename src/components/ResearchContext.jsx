import { contextFor } from '../data/context.js';

export default function ResearchContext({ variable }) {
  const notes = contextFor(variable.id);
  if (!notes.length) return null;
  return (
    <div className="chart-card context-card">
      <h3>Why this matters</h3>
      <ul>
        {notes.map((n, i) => <li key={i}>{n}</li>)}
      </ul>
      <p className="hint small no-pad">Curated background, not a live feed — a real deployment would pull this from a news/literature search API.</p>
    </div>
  );
}
