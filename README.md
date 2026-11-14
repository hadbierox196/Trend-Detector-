# Nature Map

```
npm install
npm run dev
```

## What's in this build

**Data layer** (`src/data/`, `src/api.js`)
- `data/variables.js` — catalog of 15 variables across MERRA-2, GLDAS, MODIS, AIRS, OMI and GPM, each with a plain-language definition, unit and cadence; plus the "detective" topic → variable mapping and the demo list.
- `data/regions.js` — preset regions (desert, rainforest, estuary, city airshed, Arctic, Punjab, Sahel, global).
- `api.js` — **mock data only.** `getTimeSeries(variableId, bounds, {cadence, startYear, endYear})` is the main hook to replace with a real fetch(); `getGrid`/`getStats` are kept for backward compatibility with the animated map layer.

**Stats** (`src/lib/stats.js`) — dependency-free: OLS regression with a t-test/95% CI on the slope, Mann-Kendall trend test, Theil-Sen slope, and seasonal-cycle removal (`deseasonalize`).

**Export** (`src/lib/export.js`) — CSV of the series, a PNG snapshot of the chart `<svg>`, and a plain-text summary.

**UI** (`src/components/`)
- `DetectiveGuide` — "what do you want to investigate?" topic chips that suggest variables + a region.
- `VariableFinder` — searchable/filterable variable catalog.
- `RegionPicker` + `MapView` — preset dropdown or draw-a-box on the map.
- `TimeSeriesChart` — monthly/daily toggle, date range, raw vs. deseasonalized anomalies, trend overlay, PNG/CSV export.
- `SignificancePanel` — the What / Where / How much / Significant? plain-English readout plus Sen's slope, OLS CI, t-stat and Mann-Kendall Z/p.
- `DemoBar` — three one-click walkthroughs.
- `SpatialTrendMap` — per-pixel OLS slope across a coarse world grid, colored on a diverging (falling/rising) scale, with a small stipple dot over cells significant at 95%. Resolution (10°/15°/20°) and date range are adjustable; uses the lighter OLS test rather than Mann-Kendall so a few hundred cells stay fast.
- `CompareRegions` — pick two preset regions for the current variable and see both time series, trend rates and significance side by side, plus a one-line plain-English read of whether they're trending the same way or opposite ways.

Tabs in `App.jsx` switch between **Explore** (variable finder + guide + map + single-region time series), **Spatial Trend Map**, and **Compare Regions**.

## Polish/stretch, now included
- **Learning mode** (`src/context/EducationContext.jsx`, `components/InfoTip.jsx`) — a header toggle that reveals small "i" explainers next to Mann-Kendall, Sen's slope, the 95% CI, and raw-vs-anomalies, without cluttering the UI when it's off.
- **Data-quality flags** (`src/lib/quality.js`) — flags a short record (<5 years), any missing/non-finite points, and autocorrelated regression residuals (lag-1 r > 0.3), since autocorrelation quietly makes the OLS/Mann-Kendall p-values optimistic. Surfaced as warnings in the significance panel and in the downloaded summary.
- **Research/news context** (`src/data/context.js`, `components/ResearchContext.jsx`) — one or two curated, hand-written background notes per variable (e.g. GRACE/soil-moisture and Indian groundwater depletion, OMI NO₂ and COVID-19 lockdown drops). This is static, not a live feed — the file has a `TODO: GET /api/context?...` marking where a real news/literature search API would plug in.
- **Shareable links** (`src/lib/shareLink.js`) — the "🔗 Share" button encodes the current variable, region (preset or custom box), cadence, date range, anomaly toggle, and tab into the URL's query string and copies it; opening that URL restores the same view.
- **Accessibility pass** — the spatial trend map's diverging color scale is now colorblind-safe (Okabe-Ito blue/orange instead of red/blue or red/green); every interactive element has a visible `:focus-visible` outline; and the region picker has a manual South/North/West/East number-entry fallback for selecting a custom box without a mouse, since dragging on the Leaflet map has no built-in keyboard equivalent.

## Getting started

```
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # serve the production build
```

Commit the `package-lock.json` that `npm install` generates so builds are reproducible.

## Design notes

Styling lives in a single file, `src/styles.css`, driven by CSS variables at the top (`--ink`, `--moss`, `--leaf`, `--paper`, `--rise`, `--fall`). Fonts are Schibsted Grotesk (UI) and Newsreader (headings, year, plain-English results), loaded from Google Fonts in `index.html`. The map data ramp is `COLORS` in `src/components/MapView.jsx`; trend lines use the Okabe-Ito orange/blue pair so they match the Spatial Trend Map.
