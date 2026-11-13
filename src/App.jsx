import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import MapView from './components/MapView.jsx';
import Timeline from './components/Timeline.jsx';
import Stats from './components/Stats.jsx';
import { VARIABLES, YEARS, getGrid, getStats } from './api.js';

export default function App() {
  const [variable, setVariable] = useState(VARIABLES[0]);
  const [year, setYear] = useState(YEARS.max);
  const [range, setRange] = useState([YEARS.min, YEARS.max]);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [area, setArea] = useState(null);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setYear((y) => (y >= range[1] ? range[0] : y + 1)), speed);
    return () => clearInterval(t);
  }, [playing, speed, range]);

  const grid = useMemo(() => getGrid(variable.id, year), [variable, year]);
  const stats = useMemo(() => getStats(variable.id, year, area), [variable, year, area]);

  return (
    <div className="app">
      <Header variable={variable} onVariable={setVariable} />
      <main className="main">
        <section className="map-card">
          <MapView grid={grid} area={area} onArea={setArea} />
          <Timeline {...{ year, setYear, range, setRange, playing, setPlaying, speed, setSpeed }} unit={variable.unit} />
        </section>
        <Stats stats={stats} variable={variable} year={year} area={area} onClear={() => setArea(null)} />
      </main>
    </div>
  );
}
