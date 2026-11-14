// ============================================================
// Preset regions as simple lat/lon bounding boxes (s/n/w/e), in the
// same shape the map's draw-a-box selector produces.
// ============================================================
export const REGION_PRESETS = [
  { id: 'desert', label: 'Desert (Sahara)', bounds: { s: 18, n: 30, w: -5, e: 20 } },
  { id: 'rainforest', label: 'Rainforest (Amazon Basin)', bounds: { s: -10, n: 2, w: -70, e: -50 } },
  { id: 'estuary', label: 'Estuary (Chesapeake Bay)', bounds: { s: 36.8, n: 39.5, w: -77, e: -75.5 } },
  { id: 'city_airshed', label: 'City Airshed (Los Angeles Basin)', bounds: { s: 33.6, n: 34.3, w: -118.7, e: -117.6 } },
  { id: 'arctic', label: 'Arctic (Northern Canada)', bounds: { s: 65, n: 75, w: -110, e: -70 } },
  { id: 'punjab', label: 'Punjab, India/Pakistan', bounds: { s: 28, n: 32.5, w: 71, e: 76.5 } },
  { id: 'sahel', label: 'Sahel Belt', bounds: { s: 10, n: 18, w: -15, e: 35 } },
  { id: 'global', label: 'Global (whole record)', bounds: null },
];

export const byRegionId = (id) => REGION_PRESETS.find((r) => r.id === id);

export const regionLabel = (bounds, presetId) => {
  if (presetId) return byRegionId(presetId)?.label ?? 'Custom area';
  if (!bounds) return 'Global';
  const fmt = (n) => `${Math.abs(n).toFixed(1)}°${n >= 0 ? (n === 0 ? '' : 'N/E') : 'S/W'}`;
  return `${bounds.s.toFixed(1)},${bounds.w.toFixed(1)} to ${bounds.n.toFixed(1)},${bounds.e.toFixed(1)}`;
};
