// ============================================================
// BACKEND HOOKS: every exported function below is mock data.
// Replace the body of each with a real fetch() to MERRA-2 / GLDAS /
// MODIS / AIRS / OMI / GPM endpoints -- the shapes returned are what
// the UI depends on, so keep them when you swap in real data.
// ============================================================
import { VARIABLES, byId } from './data/variables.js';
import { REGION_PRESETS, byRegionId } from './data/regions.js';

export { VARIABLES, byId as getVariable } from './data/variables.js';
export { REGION_PRESETS } from './data/regions.js';

export const YEARS = { min: 2001, max: 2024 };
export const BASEMAPS = [
  { id: 'light', label: 'Light', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attr: '© OpenStreetMap © CARTO' },
  { id: 'satellite', label: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: 'Tiles © Esri' },
  { id: 'terrain', label: 'Terrain', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: '© OpenTopoMap' },
  { id: 'dark', label: 'Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attr: '© OpenStreetMap © CARTO' },
];

// ---- deterministic PRNG so the same variable+region always reads the same ----
function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const boundsKey = (b) => (b ? `${b.s.toFixed(2)},${b.n.toFixed(2)},${b.w.toFixed(2)},${b.e.toFixed(2)}` : 'global');
const centerLat = (b) => (b ? (b.s + b.n) / 2 : 15);
const centerLon = (b) => (b ? (b.w + b.e) / 2 : 0);

// Per-variable generative profile: typical level, seasonal swing, noise, and
// a trend function of (centerLat, regionHash) so different places genuinely
// trend differently -- e.g. warming is stronger near the poles, NDVI can rise
// or fall by region, CO2 rises almost everywhere at nearly the same rate.
const PROFILES = {
  soil_moisture: { base: 0.28, amp: 0.06, noise: 0.012, trend: (lat, h) => -0.0012 - 0.0018 * Math.exp(-((Math.abs(lat) - 22) ** 2) / 200) + (h - 0.5) * 0.0015 },
  evapotranspiration: { base: 2.6, amp: 1.1, noise: 0.15, trend: (lat, h) => 0.004 + (h - 0.5) * 0.01 },
  runoff: { base: 1.4, amp: 0.9, noise: 0.2, trend: (lat, h) => (h - 0.45) * 0.02 },
  air_temp: { base: 15, amp: 9, noise: 0.35, trend: (lat) => 0.018 + 0.0006 * Math.abs(lat) },
  precipitation: { base: 3.2, amp: 2.2, noise: 0.4, trend: (lat, h) => (h - 0.5) * 0.03 + (Math.abs(lat) < 10 ? 0.01 : -0.004) },
  wind_speed: { base: 4.2, amp: 0.8, noise: 0.3, trend: (lat, h) => (h - 0.5) * 0.015 },
  ndvi: { base: 0.45, amp: 0.18, noise: 0.015, trend: (lat, h) => (h - 0.5) * 0.004 - (Math.abs(lat) > 15 && Math.abs(lat) < 35 ? 0.0015 : 0) },
  lst: { base: 18, amp: 11, noise: 0.5, trend: (lat, h) => 0.022 + 0.0004 * Math.abs(lat) + (h - 0.5) * 0.01 },
  snow_cover: { base: 0, amp: 0, noise: 0.5, trend: () => 0, polarOnly: true },
  co2: { base: 390, amp: 1.5, noise: 0.25, trend: () => 2.4 },
  humidity: { base: 60, amp: 10, noise: 1.2, trend: (lat, h) => (h - 0.5) * 0.25 },
  no2: { base: 8, amp: 2.5, noise: 0.5, trend: (lat, h) => (h - 0.5) * 0.35 },
  so2: { base: 1.2, amp: 0.4, noise: 0.15, trend: (lat, h) => (h - 0.55) * 0.05 },
  ozone: { base: 300, amp: 25, noise: 3, trend: (lat, h) => (h - 0.5) * 0.3 },
  gpm_precip: { base: 0.18, amp: 0.12, noise: 0.03, trend: (lat, h) => (h - 0.5) * 0.0025 },
};

function monthsBetween(startYear, endYear) {
  const out = [];
  for (let y = startYear; y <= endYear; y++) for (let m = 0; m < 12; m++) out.push(y + m / 12);
  return out;
}
function daysBetween(startYear, endYear) {
  const out = [];
  const start = Date.UTC(startYear, 0, 1), end = Date.UTC(endYear, 11, 31);
  const msPerDay = 86400000;
  const span = end - start + msPerDay;
  for (let t = start; t <= end; t += msPerDay) out.push(startYear + ((t - start) / span) * (endYear - startYear + 1));
  return out;
}

// Returns { x: decimalYears[], values: number[] } for a variable averaged
// over a region, at monthly or daily cadence.
// TODO: GET /api/timeseries?variable=&bounds=&cadence=&start=&end=
export function getTimeSeries(variableId, bounds, { cadence = 'monthly', startYear = YEARS.min, endYear = YEARS.max } = {}) {
  const profile = PROFILES[variableId] || PROFILES.ndvi;
  const key = `${variableId}|${boundsKey(bounds)}`;
  const rand = mulberry32(Math.floor(hashSeed(key)() * 1e9));
  const h = rand(); // stable per-region "character" in [0,1), drives trend sign/strength
  const lat = centerLat(bounds);
  const isPolar = Math.abs(lat) > 55;
  const x = cadence === 'daily' ? daysBetween(startYear, endYear) : monthsBetween(startYear, endYear);
  const t0 = x[0];
  let base = profile.base, amp = profile.amp;
  if (profile.polarOnly) { base = isPolar ? 55 : Math.max(0, 8 - Math.abs(lat) * 0.1); amp = isPolar ? 40 : 6; }
  const trendPerYear = profile.polarOnly ? (isPolar ? -0.55 - h * 0.4 : -0.05) : profile.trend(lat, h);
  const phase = (centerLon(bounds) / 360) * Math.PI * 2;
  const values = x.map((xi) => {
    const yearsIn = xi - t0;
    const seasonal = Math.sin((xi % 1) * Math.PI * 2 - Math.PI / 2 + phase) * amp;
    const level = base + trendPerYear * yearsIn + seasonal;
    const noise = (rand() - 0.5) * 2 * profile.noise;
    const v = level + noise;
    return variableId === 'co2' ? v : Math.max(0, v);
  });
  return { x, values, cadence, variableId, boundsKey: boundsKey(bounds) };
}

// Coarse per-cell trend for the spatial trend map: built from the same
// generator so it is consistent with the single-region time series above.
// TODO: GET /api/spatial-trend?variable=&start=&end=&resolution=
export function getSpatialTrendGrid(variableId, { startYear = YEARS.min, endYear = YEARS.max, step = 10 } = {}) {
  const cells = [];
  for (let lat = -60; lat <= 75; lat += step) {
    for (let lon = -175; lon < 180; lon += step) {
      const bounds = { s: lat - step / 2, n: lat + step / 2, w: lon - step / 2, e: lon + step / 2 };
      const { x, values } = getTimeSeries(variableId, bounds, { cadence: 'monthly', startYear, endYear });
      cells.push({ lat, lon, bounds, x, values });
    }
  }
  return cells;
}

// Legacy single-year grid (kept for the animated map layer / Timeline scrubber).
export function getGrid(variableId, year) {
  const profile = PROFILES[variableId] || PROFILES.ndvi;
  const cells = [];
  for (let lat = -60; lat <= 75; lat += 5) {
    for (let lon = -180; lon < 180; lon += 5) {
      const { values } = getTimeSeries(variableId, { s: lat - 2.5, n: lat + 2.5, w: lon - 2.5, e: lon + 2.5 }, { cadence: 'monthly', startYear: year, endYear: year });
      const v = values[6] ?? values[0];
      const span = profile.amp + profile.noise * 2 + 1e-6;
      const lo = profile.base - span, hi = profile.base + span;
      const norm = Math.max(0, Math.min(1, (v - lo) / Math.max(hi - lo, 1e-6)));
      cells.push({ lat, lon, value: norm, raw: v });
    }
  }
  return cells;
}

// Stats for a variable inside bounds (kept for backward compatibility with
// older components); prefer getTimeSeries + lib/stats.js for new work.
export function getStats(variableId, year, bounds) {
  const { values } = getTimeSeries(variableId, bounds, { cadence: 'monthly', startYear: YEARS.min, endYear: YEARS.max });
  const trend = [];
  for (let y = YEARS.min; y <= YEARS.max; y++) {
    const idx = Math.round((y - YEARS.min) * 12 + 6);
    trend.push({ year: y, value: Math.round((values[idx] ?? 0) * 100) / 100 });
  }
  const total = trend.find((t) => t.year === year)?.value ?? 0;
  const prev = trend.find((t) => t.year === year - 1)?.value ?? total;
  return { total, change: prev ? ((total - prev) / prev) * 100 : 0, average: total, cells: values.length, trend, regions: [] };
}
