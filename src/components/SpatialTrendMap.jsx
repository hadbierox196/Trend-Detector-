import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { getSpatialTrendGrid, YEARS, BASEMAPS } from '../api.js';
import { linregress } from '../lib/stats.js';

const yrs = () => Array.from({ length: YEARS.max - YEARS.min + 1 }, (_, i) => YEARS.min + i);
const RES_OPTIONS = [20, 15, 10];

// Colorblind-safe diverging scale (Okabe-Ito blue <-> orange, through white)
// instead of red/green or red/blue, so the rising/falling contrast still
// reads clearly for the most common forms of color vision deficiency.
const BLUE = [0, 114, 178], ORANGE = [230, 159, 0];
function colorFor(slope, maxAbs) {
  const t = maxAbs ? Math.max(-1, Math.min(1, slope / maxAbs)) : 0;
  const mix = (c) => Math.round(255 + (c - 255) * Math.abs(t));
  const [r, g, b] = t >= 0 ? ORANGE : BLUE;
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

export default function SpatialTrendMap({ variable }) {
  const [range, setRange] = useState([YEARS.min, YEARS.max]);
  const [step, setStep] = useState(15);

  // Cheap per-cell OLS (not Sen's slope / Mann-Kendall) so hundreds of cells
  // stay fast; the single-region Explore tab still uses the fuller stats.
  const { cells, maxAbs } = useMemo(() => {
    const raw = getSpatialTrendGrid(variable.id, { startYear: range[0], endYear: range[1], step });
    const scored = raw.map((c) => {
      const { slope, pValue } = linregress(c.x, c.values);
      return { lat: c.lat, lon: c.lon, slope, significant: pValue < 0.05 };
    });
    const maxAbs = scored.reduce((m, c) => Math.max(m, Math.abs(c.slope)), 1e-9);
    return { cells: scored, maxAbs };
  }, [variable.id, range, step]);

  const radius = step >= 20 ? 14 : step >= 15 ? 11 : 8;

  return (
    <section className="map-card">
      <div className="panel-body row" style={{ padding: '14px 16px 0' }}>
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
        <label className="field"><span>Resolution</span>
          <select value={step} onChange={(e) => setStep(+e.target.value)}>
            {RES_OPTIONS.map((r) => <option key={r} value={r}>{r}° grid</option>)}
          </select>
        </label>
      </div>
      <div className="map-wrap">
        <MapContainer center={[20, 10]} zoom={2} minZoom={2} worldCopyJump className="map">
          <TileLayer url={BASEMAPS[0].url} attribution={BASEMAPS[0].attr} />
          {cells.map((c) => (
            <CircleMarker key={`${c.lat}-${c.lon}`} center={[c.lat, c.lon]} radius={radius}
              pathOptions={{ color: 'transparent', fillColor: colorFor(c.slope, maxAbs), fillOpacity: 0.85 }} />
          ))}
          {cells.filter((c) => c.significant).map((c) => (
            <CircleMarker key={`sig-${c.lat}-${c.lon}`} center={[c.lat, c.lon]} radius={2.5}
              pathOptions={{ color: '#222', weight: 0, fillColor: '#222', fillOpacity: 0.85 }} />
          ))}
        </MapContainer>
      </div>
      <div className="scale spatial-legend">
        <span>Falling</span>
        <div className="bar grad" />
        <span>Rising ({variable.unit}/yr)</span>
        <span className="dot-note">• dot = significant at 95%</span>
      </div>
    </section>
  );
}
