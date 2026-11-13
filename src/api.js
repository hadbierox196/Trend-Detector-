// ============================================================
// BACKEND HOOKS: replace the bodies of these functions with
// real fetch() calls. The UI only depends on the shapes below.
// ============================================================
export const VARIABLES = [
  { id: 'tree_cover', label: 'Tree Cover', unit: 'kha' },
  { id: 'tree_loss', label: 'Tree Cover Loss', unit: 'kha' },
  { id: 'carbon', label: 'Carbon Stock', unit: 'Mt' },
  { id: 'fires', label: 'Fire Alerts', unit: 'alerts' },
  { id: 'water', label: 'Surface Water', unit: 'km²' },
];
export const YEARS = { min: 2001, max: 2024 };
export const BASEMAPS = [
  { id: 'light', label: 'Light', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attr: '© OpenStreetMap © CARTO' },
  { id: 'satellite', label: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: 'Tiles © Esri' },
  { id: 'terrain', label: 'Terrain', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: '© OpenTopoMap' },
  { id: 'dark', label: 'Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attr: '© OpenStreetMap © CARTO' },
];

const seed = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };

// Returns [{lat, lon, value}] grid cells for a variable + year.  (MOCK DATA)
// TODO: GET /api/grid?variable=&year=
export function getGrid(variable, year) {
  const v = VARIABLES.findIndex((x) => x.id === variable) + 1 || 1;
  const cells = [];
  for (let lat = -60; lat <= 75; lat += 5)
    for (let lon = -180; lon < 180; lon += 5) {
      const base = (Math.sin(lat * 0.09 * v) + Math.cos(lon * 0.06 + v) + 2) / 4;
      const drift = Math.sin((year - 2000) * 0.25 + lat * 0.05) * 0.12;
      const value = Math.max(0, Math.min(1, base + drift + (seed(lat * 31 + lon * 17 + v) - 0.5) * 0.2));
      cells.push({ lat, lon, value });
    }
  return cells;
}

// Totals, trend and breakdown for a variable (optionally inside bounds). (MOCK DATA)
// TODO: GET /api/stats?variable=&year=&bounds=
export function getStats(variable, year, bounds) {
  const inside = (c) => !bounds || (c.lat >= bounds.s && c.lat <= bounds.n && c.lon >= bounds.w && c.lon <= bounds.e);
  const sum = (y) => getGrid(variable, y).filter(inside).reduce((a, c) => a + c.value * 100, 0);
  const trend = [];
  for (let y = YEARS.min; y <= YEARS.max; y++) trend.push({ year: y, value: Math.round(sum(y)) });
  const cells = getGrid(variable, year).filter(inside);
  const regions = [
    ['N. America', (c) => c.lon < -30 && c.lat > 12], ['S. America', (c) => c.lon < -30 && c.lat <= 12],
    ['Europe', (c) => c.lon >= -30 && c.lon < 50 && c.lat > 35], ['Africa', (c) => c.lon >= -30 && c.lon < 50 && c.lat <= 35],
    ['Asia', (c) => c.lon >= 50], 
  ].map(([name, f]) => ({ name, value: Math.round(cells.filter(f).reduce((a, c) => a + c.value * 100, 0)) }));
  const total = trend.find((t) => t.year === year)?.value ?? 0;
  const prev = trend.find((t) => t.year === year - 1)?.value ?? total;
  return { total, change: prev ? ((total - prev) / prev) * 100 : 0, average: Math.round(total / Math.max(cells.length, 1)), cells: cells.length, trend, regions };
}
