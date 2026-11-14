// ============================================================
// Client-side export helpers: CSV of the series, a plain-text
// summary, and a PNG snapshot of whichever chart <svg> is passed in.
// No extra dependencies -- a Blob + an <a download> covers all three.
// ============================================================
function download(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function exportCSV({ variable, x, values, cadence }) {
  const header = `date_decimal_year,${variable.id}_${variable.unit.replace(/\W+/g, '_')}\n`;
  const rows = x.map((xi, i) => `${xi.toFixed(cadence === 'daily' ? 4 : 3)},${values[i]?.toFixed(5) ?? ''}`).join('\n');
  download(`${variable.id}_timeseries.csv`, new Blob([header + rows], { type: 'text/csv' }));
}

export function exportSummary({ lines, variable }) {
  download(`${variable.id}_summary.txt`, new Blob([lines.join('\n')], { type: 'text/plain' }));
}

export function exportChartPNG(containerEl, filename = 'chart.png') {
  if (!containerEl) return;
  const svg = containerEl.querySelector('svg');
  if (!svg) return;
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const bbox = svg.getBoundingClientRect();
  const width = bbox.width || 600, height = bbox.height || 300;
  clone.setAttribute('width', width); clone.setAttribute('height', height);
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', '100%'); bg.setAttribute('height', '100%'); bg.setAttribute('fill', '#ffffff');
  clone.insertBefore(bg, clone.firstChild);
  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width * 2; canvas.height = height * 2; // retina-ish
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0, width, height);
    canvas.toBlob((blob) => { if (blob) download(filename, blob); URL.revokeObjectURL(url); }, 'image/png');
  };
  img.src = url;
}
