import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Stats({ stats, variable, year, area, onClear }) {
  const up = stats.change >= 0;
  const fmt = (n) => n.toLocaleString();
  return (
    <aside className="stats">
      <div className="stats-head">
        <h2>{area ? 'Selected area' : 'Global'} · {year}</h2>
        {area && <button className="chip" onClick={onClear}>Clear ✕</button>}
      </div>
      <div className="cards">
        <div className="card hero">
          <span>Total {variable.label}</span>
          <b>{fmt(stats.total)}</b><em>{variable.unit}</em>
        </div>
        <div className="card"><span>YoY change</span><b className={up ? 'pos' : 'neg'}>{up ? '▲' : '▼'} {Math.abs(stats.change).toFixed(1)}%</b></div>
        <div className="card"><span>Avg / cell</span><b>{fmt(stats.average)}</b></div>
      </div>
      <div className="chart-card">
        <h3>Trend over time</h3>
        <ResponsiveContainer width="100%" height={170}>
          <AreaChart data={stats.trend}>
            <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6B8E4E" stopOpacity={0.6} /><stop offset="100%" stopColor="#C5E59B" stopOpacity={0.1} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e0da" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={40} /><Tooltip />
            <Area dataKey="value" stroke="#6B8E4E" strokeWidth={2} fill="url(#g)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-card">
        <h3>By region</h3>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={stats.regions}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e0da" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} width={40} /><Tooltip />
            <Bar dataKey="value" fill="#CBA88A" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </aside>
  );
}
