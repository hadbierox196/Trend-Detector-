// ============================================================
// Shareable links: pack the current variable, region, and chart
// settings into the URL's query string, and read them back on load.
// Plain query params (not a hash route) since this is a normal
// client-rendered page, not a sandboxed published artifact.
// ============================================================
export function buildShareUrl(state) {
  const p = new URLSearchParams();
  p.set('variable', state.variableId);
  if (state.presetId && state.presetId !== 'global') p.set('region', state.presetId);
  else if (state.area) p.set('bounds', [state.area.s, state.area.n, state.area.w, state.area.e].map((n) => n.toFixed(2)).join(','));
  p.set('cadence', state.cadence);
  p.set('from', state.range[0]);
  p.set('to', state.range[1]);
  if (state.deseasonalized) p.set('anomaly', '1');
  if (state.tab && state.tab !== 'explore') p.set('tab', state.tab);
  const url = new URL(window.location.href);
  url.search = p.toString();
  return url.toString();
}

export function parseShareUrl() {
  const p = new URLSearchParams(window.location.search);
  if (![...p.keys()].length) return null;
  const bounds = p.get('bounds');
  const area = bounds ? (() => { const [s, n, w, e] = bounds.split(',').map(Number); return { s, n, w, e }; })() : null;
  return {
    variableId: p.get('variable') || null,
    presetId: p.get('region') || null,
    area,
    cadence: p.get('cadence') || 'monthly',
    range: [Number(p.get('from')) || undefined, Number(p.get('to')) || undefined],
    deseasonalized: p.get('anomaly') === '1',
    tab: p.get('tab') || 'explore',
  };
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
