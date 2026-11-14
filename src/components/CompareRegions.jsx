import { useMemo, useState } from 'react';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getTimeSeries, YEARS } from '../api.js';
import { REGION_PRESETS, byRegionId } from '../data/regions.js';
import { analyzeTrend, deseasonalize } from '../lib/stats.js';

const REGIONS_FOR_COMPARE = REGION_PRESETS.filter((r) => r.bounds);

function useRegionTrend(variableId, regionId, deseasonalized) {
  return useMemo(() => {
    const bounds = byRegionId(regionId)?.bounds;
    const { x, values } = getTimeSeries(variableId, bounds, { cadence: 'monthly', startYear: YEARS.min, endYear: YEARS.max });
    const series = deseasonalized ? deseasonalize(values, 12) : values;
    const trend = analyzeTrend(x, series);
    const chartData = x.map((xi, i) => ({ x: xi, value: series[i] }));
    const trendLine = [
      { x: x[0], t: trend.intercept + trend.slopePerYear * x[0] },
      { x: x[x.length - 1], t: trend.intercept + trend.slopePerYear * x[x.length - 1] },
    ];
    return { trend, chartData, trendLine };
  }, [variableId, regionId, deseasonalized]);
}

function MiniChart({ title, chartData, trendLine, unit }) {
  return (
    <div className="chart-card compare-card">
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e0da" />
          <XAxis dataKey="x" tickFormatter={(v) => Math.round(v)} type="number" domain={['dataMin', 'dataMax']} tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} width={40} domain={['auto', 'auto']} />
          <Tooltip formatter={(v) => [v?.toFixed(3), unit]} labelFormatter={(v) => Math.round(v)} />
          <Line type="monotone" dataKey="value" stroke="#6B8E4E" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line data={trendLine} dataKey="t" stroke="#B5533C" strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniStats({ label, trend, unit }) {
  const sign = trend.slopePerYear >= 0 ? '+' : '';
  return (
    <div className="mini-stats">
      <b>{label}</b>
      <span>{sign}{trend.slopePerYear.toFixed(4)} {unit}/yr</span>
      <span className={trend.significant ? 'verdict yes' : 'verdict no'}>{trend.significant ? 'Significant' : 'Not significant'}</span>
    </div>
  );
}

export default function CompareRegions({ variable }) {
  const [regionA, setRegionA] = useState('desert');
  const [regionB, setRegionB] = useState('rainforest');
  const [deseasonalized, setDeseasonalized] = useState(false);

  const a = useRegionTrend(variable.id, regionA, deseasonalized);
  const b = useRegionTrend(variable.id, regionB, deseasonalized);

  const oppositeSigns = Math.sign(a.trend.slopePerYear) !== Math.sign(b.trend.slopePerYear) && a.trend.slopePerYear !== 0 && b.trend.slopePerYear !== 0;
  const labelA = byRegionId(regionA)?.label, labelB = byRegionId(regionB)?.label;

  return (
    <div className="compare">
      <div className="panel">
        <div className="panel-body row">
          <label className="field grow"><span>Region A</span>
            <select value={regionA} onChange={(e) => setRegionA(e.target.value)}>
              {REGIONS_FOR_COMPARE.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </label>
          <label className="field grow"><span>Region B</span>
            <select value={regionB} onChange={(e) => setRegionB(e.target.value)}>
              {REGIONS_FOR_COMPARE.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </label>
          <button className={deseasonalized ? 'chip on' : 'chip'} onClick={() => setDeseasonalized((v) => !v)}>
            {deseasonalized ? 'Anomalies' : 'Raw'}
          </button>
        </div>
      </div>

      <div className="compare-grid">
        <MiniChart title={labelA} chartData={a.chartData} trendLine={a.trendLine} unit={variable.unit} />
        <MiniChart title={labelB} chartData={b.chartData} trendLine={b.trendLine} unit={variable.unit} />
      </div>
      <div className="compare-grid">
        <MiniStats label={labelA} trend={a.trend} unit={variable.unit} />
        <MiniStats label={labelB} trend={b.trend} unit={variable.unit} />
      </div>

      <div className="chart-card">
        <h3>What this shows</h3>
        <p className="hint">
          {variable.label} in <b>{labelA}</b> is {a.trend.slopePerYear >= 0 ? 'rising' : 'falling'} at {Math.abs(a.trend.slopePerYear).toFixed(4)} {variable.unit}/yr
          {a.trend.significant ? ' (significant at 95%)' : ' (not yet significant)'}, while in <b>{labelB}</b> it is {b.trend.slopePerYear >= 0 ? 'rising' : 'falling'} at {Math.abs(b.trend.slopePerYear).toFixed(4)} {variable.unit}/yr
          {b.trend.significant ? ' (significant at 95%)' : ' (not yet significant)'}.
          {oppositeSigns ? ' These two regions are trending in opposite directions — the same global process is playing out differently depending on where you look.' : ' Both regions are trending the same direction here.'}
        </p>
      </div>
    </div>
  );
}
