import { YEARS } from '../api.js';
import { COLORS } from './MapView.jsx';

export default function Timeline({ year, setYear, range, setRange, playing, setPlaying, speed, setSpeed, unit }) {
  return (
    <div className="timeline">
      <button className="play" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? '❚❚' : '▶'}
      </button>
      <div className="tl-body">
        <div className="tl-row">
          <strong className="year">{year}</strong>
          <input type="range" min={range[0]} max={range[1]} value={Math.min(Math.max(year, range[0]), range[1])}
            onChange={(e) => setYear(+e.target.value)} />
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
          <label className="field"><span>Speed</span>
            <select value={speed} onChange={(e) => setSpeed(+e.target.value)}>
              <option value={1500}>0.5×</option><option value={1000}>1×</option><option value={500}>2×</option>
            </select>
          </label>
        </div>
        <div className="scale">
          <span>Low</span>
          <div className="bar">{COLORS.map((c) => <i key={c} style={{ background: c }} />)}</div>
          <span>High ({unit})</span>
        </div>
      </div>
    </div>
  );
}
const yrs = () => Array.from({ length: YEARS.max - YEARS.min + 1 }, (_, i) => YEARS.min + i);
