import { useState } from 'react';
import { MapContainer, TileLayer, Rectangle, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import { BASEMAPS } from '../api.js';

export const COLORS = ['#E3EFD3', '#A9D18E', '#5FA46A', '#2C7A6B', '#124A55'];
export const colorFor = (v) => COLORS[Math.min(COLORS.length - 1, Math.floor(v * COLORS.length))];

function Selector({ active, onDone, setDraft }) {
  const map = useMap();
  const [start, setStart] = useState(null);
  useMapEvents({
    mousedown(e) { if (!active) return; map.dragging.disable(); setStart(e.latlng); },
    mousemove(e) { if (start) setDraft(toBounds(start, e.latlng)); },
    mouseup(e) {
      if (!start) return;
      map.dragging.enable();
      onDone(toBounds(start, e.latlng)); setStart(null); setDraft(null);
    },
  });
  return null;
}
const toBounds = (a, b) => ({ s: Math.min(a.lat, b.lat), n: Math.max(a.lat, b.lat), w: Math.min(a.lng, b.lng), e: Math.max(a.lng, b.lng) });
const rect = (b) => [[b.s, b.w], [b.n, b.e]];

export default function MapView({ grid, area, onArea }) {
  const [base, setBase] = useState(BASEMAPS[0]);
  const [menu, setMenu] = useState(false);
  const [layer, setLayer] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [draft, setDraft] = useState(null);

  return (
    <div className="map-wrap">
      <MapContainer center={[20, 10]} zoom={2} minZoom={2} worldCopyJump className={selecting ? 'map selecting' : 'map'}>
        <TileLayer key={base.id} url={base.url} attribution={base.attr} />
        {layer && grid.map((c) => (
          <CircleMarker key={`${c.lat}${c.lon}`} center={[c.lat, c.lon]} radius={6}
            pathOptions={{ color: 'transparent', fillColor: colorFor(c.value), fillOpacity: 0.7 }} />
        ))}
        {area && <Rectangle bounds={rect(area)} pathOptions={{ color: '#14302B', weight: 2, fillOpacity: 0.1 }} />}
        {draft && <Rectangle bounds={rect(draft)} pathOptions={{ color: '#6B8E4E', dashArray: '4' }} />}
        <Selector active={selecting} setDraft={setDraft} onDone={(b) => { onArea(b); setSelecting(false); }} />
      </MapContainer>

      <div className="map-tools">
        <button className={selecting ? 'chip on' : 'chip'} onClick={() => setSelecting(!selecting)}>
          {selecting ? 'Drag on map…' : 'Select area'}
        </button>
        <div className="dots-wrap">
          <button className="chip dots" aria-label="Map options" onClick={() => setMenu(!menu)}>⋮</button>
          {menu && (
            <div className="dots-menu">
              <p>Map view</p>
              {BASEMAPS.map((b) => (
                <button key={b.id} className={b.id === base.id ? 'active' : ''} onClick={() => { setBase(b); setMenu(false); }}>{b.label}</button>
              ))}
              <label><input type="checkbox" checked={layer} onChange={(e) => setLayer(e.target.checked)} /> Data layer</label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
