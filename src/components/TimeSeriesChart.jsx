import { useEffect, useMemo, useRef } from 'react';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { getTimeSeries, YEARS } from '../api.js';
import { deseasonalize, analyzeTrend } from '../lib/stats.js';
import { dataQualityFlags } from '../lib/quality.js';
import { exportChartPNG, exportCSV } from '../lib/export.js';
import InfoTip from './InfoTip.jsx';

const yrs = () => Array.from({ length: YEARS.max - YEARS.min + 1 }, (_, i) => YEARS.min + i);

export default function TimeSeriesChart({ variable, bounds, cadence, setCadence, range, setRange, deseasonalized, setDeseasonalized, onResult }) {
  const chartRef = useRef(null);
  const raw = useMemo(() => getTimeSeries(variable.id, bounds, { cadence, startYear: range[0], endYear: range[1] }), [variable.id, bounds, cadence, range]);

  // Daily records get long fast; sample for rendering only (stats below still use the full series).
  const display = useMemo(() => {
    const n = raw.x.length;
    const stride = n > 900 ? Math.ceil(n / 900) : 1;
    const x = [], values = [];
    for (let i = 0; i < n; i += stride) { x.push(raw.x[i]); values.push(raw.values[i]); }
    return { x, values };
  }, [raw]);

  const seriesForStats = deseasonalized ? deseasonalize(raw.values, cadence === 'daily' ? 365 : 12) : raw.values;
  const trend = useMemo(() => analyzeTrend(raw.x, seriesForStats), [raw.x, seriesForStats]);
  const quality = useMemo(() => dataQualityFlags(raw.x, raw.values, { cadence }), [raw, cadence]);

  const displayValues = deseasonalized ? deseasonalize(display.values, cadence === 'daily' ? 365 : 12) : display.values;
  const chartData = display.x.map((xi, i) => ({ x: xi, value: displayValues[i] }));
  const trendLine = [
    { x: raw.x[0], t: trend.intercept + trend.slopePerYear * raw.x[0] },
    { x: raw.x[raw.x.length - 1], t: trend.intercept + trend.slopePerYear * raw.x[raw.x.length - 1] },
  ];

  // report the full-resolution trend result up to the parent for the significance panel
  useEffect(() => { onResult && onResult(trend, raw, quality); }, [trend, raw, quality, onResult]);

  return (
    <div className="chart-card">
      <div className="chart-head">
        <h3>{variable.label} over time</h3>
        <div className="chip-row">
          <button className={cadence === 'monthly' ? 'chip on' : 'chip'} onClick={() => setCadence('monthly')}>Monthly</button>
          <button className={cadence === 'daily' ? 'chip on' : 'chip'} onClick={() => setCadence('daily')}>Daily</button>
          <button className={deseasonalized ? 'chip on' : 'chip'} onClick={() => setDeseasonalized(!deseasonalized)} title="Subtract the seasonal cycle to reveal the underlying trend">
            {deseasonalized ? 'Anomalies' : 'Raw'}
          </button>
          <InfoTip label="What does Raw vs. Anomalies mean?">
            "Raw" is the measured value each month, which rises and falls with the seasons. "Anomalies" subtracts each calendar month's average (its climatology), leaving the departure from normal — this is how a slow warming or drying trend hiding underneath a big seasonal swing becomes visible.
          </InfoTip>
        </div>
      </div>
      <div className="fields">
        <label className="field"><span>From</span>
          <select value={range[0]} onChange={(e) => setRange([Math.min(+e.target.value, range[1] - 1), range[1]])}>
            {yrs().map((y) => <option key={y}>{y}</option>)}
          </select>
        </label>
        <label className="field"><span>To</span>
          <select value={range[1]} onChange={(e) => setRange([range[0], Math.max(+e.target.value, range[0] + 1)])}>
            {yrs().map((y) => <option key={y}>{y}</option>)}
          </select>
        </label>
      </div>
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D5DDCF" />
            <XAxis dataKey="x" tickFormatter={(v) => Math.round(v)} type="number" domain={['dataMin', 'dataMax']} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={46} domain={['auto', 'auto']} />
            <Tooltip labelFormatter={(v) => yearLabel(v, cadence)} formatter={(v) => [v?.toFixed(3), variable.unit]} />
            <Line type="monotone" dataKey="value" name={deseasonalized ? 'Anomaly' : variable.label} stroke="#2F6B3F" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line data={trendLine} dataKey="t" name="Trend" stroke="#D55E00" strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} legendType="line" />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-foot">
        <button className="chip" onClick={() => exportChartPNG(chartRef.current, `${variable.id}_chart.png`)}>Download PNG</button>
        <button className="chip" onClick={() => exportCSV({ variable, x: raw.x, values: raw.values, cadence })}>Download CSV</button>
      </div>
    </div>
  );
}

function yearLabel(v, cadence) {
  const year = Math.floor(v);
  if (cadence === 'daily') {
    const dayOfYear = Math.round((v - year) * 365);
    const d = new Date(Date.UTC(year, 0, 1 + dayOfYear));
    return d.toISOString().slice(0, 10);
  }
  const month = Math.round((v - year) * 12);
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}
