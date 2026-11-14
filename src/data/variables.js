// ============================================================
// Variable catalog. Each entry is what a real backend would serve
// from the named mission/product; swap the generator in api.js for
// a real fetch() and this catalog stays the same.
// ============================================================
export const MISSIONS = {
  MERRA2: { id: 'MERRA2', label: 'MERRA-2', full: 'Modern-Era Retrospective analysis for Research and Applications', agency: 'NASA GMAO reanalysis' },
  GLDAS: { id: 'GLDAS', label: 'GLDAS', full: 'Global Land Data Assimilation System', agency: 'NASA/NOAA land model' },
  MODIS: { id: 'MODIS', label: 'MODIS', full: 'Moderate Resolution Imaging Spectroradiometer', agency: 'Terra & Aqua satellites' },
  AIRS: { id: 'AIRS', label: 'AIRS', full: 'Atmospheric Infrared Sounder', agency: 'Aqua satellite' },
  OMI: { id: 'OMI', label: 'OMI', full: 'Ozone Monitoring Instrument', agency: 'Aura satellite' },
  GPM: { id: 'GPM', label: 'GPM', full: 'Global Precipitation Measurement', agency: 'GPM Core Observatory' },
};

export const VARIABLES = [
  { id: 'soil_moisture', label: 'Soil Moisture', unit: 'm³/m³', mission: 'GLDAS', category: 'Water',
    def: 'How much water is held in the top layer of soil — low values signal drying ground.', cadence: ['monthly', 'daily'] },
  { id: 'evapotranspiration', label: 'Evapotranspiration', unit: 'mm/day', mission: 'GLDAS', category: 'Water',
    def: 'Water leaving the land surface into the air, from evaporation plus plant transpiration.', cadence: ['monthly', 'daily'] },
  { id: 'runoff', label: 'Surface Runoff', unit: 'mm/day', mission: 'GLDAS', category: 'Water',
    def: 'Water flowing over land into streams and rivers rather than soaking in — a flood-risk signal.', cadence: ['monthly', 'daily'] },
  { id: 'air_temp', label: 'Air Temperature (2m)', unit: '°C', mission: 'MERRA2', category: 'Climate',
    def: 'Near-surface air temperature, the standard measure of how hot or cold a place is.', cadence: ['monthly', 'daily'] },
  { id: 'precipitation', label: 'Precipitation', unit: 'mm/day', mission: 'MERRA2', category: 'Water',
    def: 'Rain and snow reaching the surface, averaged over the region.', cadence: ['monthly', 'daily'] },
  { id: 'wind_speed', label: 'Wind Speed (10m)', unit: 'm/s', mission: 'MERRA2', category: 'Climate',
    def: 'Near-surface wind speed, relevant to dust transport, fire spread and storm risk.', cadence: ['monthly', 'daily'] },
  { id: 'ndvi', label: 'NDVI (Vegetation Greenness)', unit: 'index', mission: 'MODIS', category: 'Vegetation',
    def: 'An index from 0 (bare ground) to 1 (dense healthy vegetation) built from how plants reflect light.', cadence: ['monthly', 'daily'] },
  { id: 'lst', label: 'Land Surface Temperature', unit: '°C', mission: 'MODIS', category: 'Climate',
    def: 'The actual temperature of the ground or canopy surface, as "seen" from orbit — a sharper lens on urban heat than air temperature.', cadence: ['monthly', 'daily'] },
  { id: 'snow_cover', label: 'Snow Cover', unit: '% area', mission: 'MODIS', category: 'Water',
    def: "The share of a region's surface with visible snow — tracks seasonal melt and long-term loss.", cadence: ['monthly', 'daily'] },
  { id: 'co2', label: 'CO₂ Concentration', unit: 'ppm', mission: 'AIRS', category: 'Atmosphere',
    def: 'Mid-tropospheric carbon dioxide concentration, a greenhouse-gas tracer.', cadence: ['monthly'] },
  { id: 'humidity', label: 'Relative Humidity', unit: '%', mission: 'AIRS', category: 'Atmosphere',
    def: 'How close the air is to saturation with water vapor — ties to heat-stress and drought indices.', cadence: ['monthly', 'daily'] },
  { id: 'no2', label: 'NO₂ Column Density', unit: '×10¹⁵ molec/cm²', mission: 'OMI', category: 'Air Quality',
    def: 'Nitrogen dioxide in the atmospheric column — a direct fingerprint of traffic and combustion emissions.', cadence: ['monthly', 'daily'] },
  { id: 'so2', label: 'SO₂ Column Density', unit: 'DU', mission: 'OMI', category: 'Air Quality',
    def: 'Sulfur dioxide in the atmospheric column, from power plants, industry and volcanoes.', cadence: ['monthly', 'daily'] },
  { id: 'ozone', label: 'Total Column Ozone', unit: 'DU', mission: 'OMI', category: 'Atmosphere',
    def: 'Total ozone overhead, relevant to both UV protection and air-quality episodes near the surface.', cadence: ['monthly', 'daily'] },
  { id: 'gpm_precip', label: 'GPM Precipitation Rate', unit: 'mm/hr', mission: 'GPM', category: 'Water',
    def: 'High-resolution satellite rainfall rate, good for catching short, intense storms other records miss.', cadence: ['monthly', 'daily'] },
];

export const byId = (id) => VARIABLES.find((v) => v.id === id);
export const categories = [...new Set(VARIABLES.map((v) => v.category))];

// ---- Guided "detective" questions ---------------------------------
// Keyword → suggested variable ids + a region preset to jump to.
export const DETECTIVE_TOPICS = [
  { key: 'drought', label: 'Drought', variables: ['soil_moisture', 'precipitation', 'ndvi'], hint: 'Falling soil moisture and precipitation alongside dropping NDVI is the classic drought signature.' },
  { key: 'flooding', label: 'Flooding / heavy rain', variables: ['precipitation', 'runoff', 'gpm_precip'], hint: 'Spikes in precipitation and runoff show where water is accumulating fastest.' },
  { key: 'deforestation', label: 'Deforestation / land change', variables: ['ndvi', 'lst', 'evapotranspiration'], hint: 'Falling NDVI paired with rising land surface temperature often marks cleared forest.' },
  { key: 'urban_heat', label: 'Urban heat island', variables: ['lst', 'air_temp', 'ndvi'], hint: 'Compare land surface temperature in a city core against a nearby green/rural box.' },
  { key: 'air_quality', label: 'Air quality / pollution', variables: ['no2', 'so2', 'ozone'], hint: 'NO₂ tracks traffic and industry; SO₂ tracks heavy industry and power plants.' },
  { key: 'wildfire', label: 'Wildfire risk', variables: ['soil_moisture', 'wind_speed', 'lst'], hint: 'Dry soil, high wind speed and hot land surface together raise fire risk.' },
  { key: 'ice_snow_melt', label: 'Ice / snow melt', variables: ['snow_cover', 'air_temp'], hint: 'Shrinking snow-covered area alongside warming air temperature signals melt.' },
  { key: 'coastal_estuary', label: 'Coastal / estuary health', variables: ['runoff', 'precipitation', 'ndvi'], hint: 'Runoff and precipitation upstream drive nutrient and sediment loads into estuaries.' },
];

export function suggestFromText(text) {
  const t = text.toLowerCase();
  const hits = DETECTIVE_TOPICS.filter((topic) =>
    t.includes(topic.key.replace('_', ' ')) || topic.label.toLowerCase().split(/[\s/]+/).some((w) => w.length > 3 && t.includes(w))
  );
  return hits.length ? hits : [];
}

// ---- One-click demo walkthroughs -----------------------------------
export const DEMOS = [
  { id: 'arctic_snow', title: 'Arctic snow cover decline', variableId: 'snow_cover', regionId: 'arctic', note: 'Snow-covered area trending down over two decades.' },
  { id: 'amazon_rain', title: 'Amazon rainfall & greenness', variableId: 'ndvi', regionId: 'rainforest', note: 'Vegetation greenness against a backdrop of shifting rainfall.' },
  { id: 'la_no2', title: 'Urban NO₂ trend, Los Angeles', variableId: 'no2', regionId: 'city_airshed', note: 'Nitrogen dioxide over a major urban airshed.' },
];
