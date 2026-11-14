import { useCallback, useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import MapView from './components/MapView.jsx';
import Timeline from './components/Timeline.jsx';
import VariableFinder from './components/VariableFinder.jsx';
import DetectiveGuide from './components/DetectiveGuide.jsx';
import RegionPicker from './components/RegionPicker.jsx';
import TimeSeriesChart from './components/TimeSeriesChart.jsx';
import SignificancePanel from './components/SignificancePanel.jsx';
import DemoBar from './components/DemoBar.jsx';
import SpatialTrendMap from './components/SpatialTrendMap.jsx';
import CompareRegions from './components/CompareRegions.jsx';
import ResearchContext from './components/ResearchContext.jsx';
import { VARIABLES, YEARS, getGrid, getVariable } from './api.js';
import { byRegionId, regionLabel } from './data/regions.js';
import { exportSummary } from './lib/export.js';
import { buildShareUrl, parseShareUrl, copyToClipboard } from './lib/shareLink.js';

const shared = parseShareUrl(); // read once; null if the URL carries no share params

export default function App() {
  const initialVariable = (shared && getVariable(shared.variableId)) || VARIABLES[0];
  const [variable, setVariable] = useState(initialVariable);
  const [year, setYear] = useState(YEARS.max);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);

  // region: either a presetId (string) or custom drawn bounds
  const [presetId, setPresetId] = useState(shared?.presetId || (shared?.area ? null : 'global'));
  const [area, setArea] = useState(shared?.area || null); // custom drawn bounds
  const bounds = presetId && presetId !== 'global' ? byRegionId(presetId)?.bounds : area;

  // time-series controls
  const [cadence, setCadence] = useState(shared?.cadence || 'monthly');
  const [range, setRange] = useState([shared?.range?.[0] || YEARS.min, shared?.range?.[1] || YEARS.max]);
  const [deseasonalized, setDeseasonalized] = useState(shared?.deseasonalized || false);
  const [trendResult, setTrendResult] = useState(null);
  const [quality, setQuality] = useState(null);

  const [findOpen, setFindOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [tab, setTab] = useState(shared?.tab || 'explore'); // 'explore' | 'spatial' | 'compare'
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setYear((y) => (y >= range[1] ? range[0] : y + 1)), speed);
    return () => clearInterval(t);
  }, [playing, speed, range]);

  const grid = getGrid(variable.id, year);

  const handlePreset = (id) => { setPresetId(id || 'global'); setArea(null); };
  const handleArea = (b) => { setArea(b); setPresetId(null); };
  const clearRegion = () => { setPresetId('global'); setArea(null); };

  const handleGuideApply = ({ variableId, regionId }) => {
    const v = getVariable(variableId);
    if (v) setVariable(v);
    if (regionId) { setPresetId(regionId); setArea(null); }
    setGuideOpen(false);
  };

  const runDemo = (demo) => {
    const v = getVariable(demo.variableId);
    if (v) setVariable(v);
    setPresetId(demo.regionId);
    setArea(null);
    setDeseasonalized(false);
    setCadence('monthly');
    setRange([YEARS.min, YEARS.max]);
    setTab('explore');
  };

  const onTrendResult = useCallback((trend, _raw, qualityFlags) => {
    setTrendResult(trend);
    setQuality(qualityFlags);
  }, []);

  const currentRegionLabel = presetId && presetId !== 'global' ? byRegionId(presetId)?.label : regionLabel(area, null);

  const downloadSummary = () => {
    if (!trendResult) return;
    const sign = trendResult.slopePerYear >= 0 ? '+' : '';
    exportSummary({
      variable,
      lines: [
        `Nature Map — ${variable.label}`,
        `What: ${variable.label} (${variable.unit})${deseasonalized ? ', seasonal cycle removed' : ''}`,
        `Where: ${currentRegionLabel}`,
        `How much: ${sign}${trendResult.slopePerYear.toFixed(4)} ${variable.unit}/year over ${range[1] - range[0]} years (${sign}${trendResult.totalChange.toFixed(2)} ${variable.unit} total)`,
        `Significant?: ${trendResult.significant ? 'Yes (95%)' : 'Not yet significant'} — Mann-Kendall p=${trendResult.mk.pValue.toFixed(3)}, trend is ${trendResult.mk.direction}`,
        `Sen's slope: ${trendResult.senSlopePerYear.toFixed(4)} /yr`,
        `OLS 95% CI: [${trendResult.ci95[0].toFixed(4)}, ${trendResult.ci95[1].toFixed(4)}]`,
        ...(quality?.notes.length ? ['', 'Data quality notes:', ...quality.notes.map((n) => `- ${n}`)] : []),
      ],
    });
  };

  const shareLink = async () => {
    const url = buildShareUrl({ variableId: variable.id, presetId, area, cadence, range, deseasonalized, tab });
    window.history.replaceState(null, '', url);
    const ok = await copyToClipboard(url);
    setCopied(ok);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="app">
      <Header variable={variable} onVariable={setVariable} />
      <DemoBar onRun={runDemo} />
      <div className="tabs">
        <button className={tab === 'explore' ? 'on' : ''} onClick={() => setTab('explore')}>Explore</button>
        <button className={tab === 'spatial' ? 'on' : ''} onClick={() => setTab('spatial')}>Spatial Trend Map</button>
        <button className={tab === 'compare' ? 'on' : ''} onClick={() => setTab('compare')}>Compare Regions</button>
        <button className="share-btn" onClick={shareLink}>{copied ? 'Link copied' : 'Share link'}</button>
      </div>

      {tab === 'explore' && (
        <main className="main">
          <div className="left-col">
            <DetectiveGuide open={guideOpen} onToggle={() => setGuideOpen((v) => !v)} onApply={handleGuideApply} />
            <VariableFinder variable={variable} onVariable={setVariable} open={findOpen} onToggle={() => setFindOpen((v) => !v)} />
            <RegionPicker presetId={presetId === 'global' ? 'global' : presetId} bounds={area} onPreset={handlePreset} onClear={clearRegion} onManualBounds={handleArea} />
            <section className="map-card">
              <MapView grid={grid} area={bounds} onArea={handleArea} />
              <Timeline {...{ year, setYear, range, setRange, playing, setPlaying, speed, setSpeed }} unit={variable.unit} />
            </section>
          </div>
          <div className="right-col">
            <TimeSeriesChart
              variable={variable}
              bounds={bounds}
              cadence={cadence}
              setCadence={setCadence}
              range={range}
              setRange={setRange}
              deseasonalized={deseasonalized}
              setDeseasonalized={setDeseasonalized}
              onResult={onTrendResult}
            />
            <SignificancePanel
              variable={variable}
              regionLabel={currentRegionLabel}
              range={range}
              cadence={cadence}
              deseasonalized={deseasonalized}
              trend={trendResult}
              quality={quality}
            />
            <ResearchContext variable={variable} />
            <button className="chip" onClick={downloadSummary} style={{ alignSelf: 'flex-start' }}>Download summary (.txt)</button>
          </div>
        </main>
      )}

      {tab === 'spatial' && (
        <main className="main one-col">
          <VariableFinder variable={variable} onVariable={setVariable} open={findOpen} onToggle={() => setFindOpen((v) => !v)} />
          <SpatialTrendMap variable={variable} />
        </main>
      )}

      {tab === 'compare' && (
        <main className="main one-col">
          <VariableFinder variable={variable} onVariable={setVariable} open={findOpen} onToggle={() => setFindOpen((v) => !v)} />
          <CompareRegions variable={variable} />
        </main>
      )}
    </div>
  );
}
