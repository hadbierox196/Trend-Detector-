// ============================================================
// MOCK / CURATED context notes -- these are hand-written, general
// background for each variable, not a live feed. A real deployment
// would replace this with a fetch() to a news or literature search
// API (e.g. a Crossref/ADS query, or a curated RSS feed) filtered by
// variable keyword and region name.
// TODO: GET /api/context?variable=&region=
// ============================================================
export const CONTEXT_NOTES = {
  soil_moisture: [
    'Satellite-derived soil moisture and groundwater records have been used to document large-scale groundwater depletion in intensively irrigated regions such as northwest India.',
  ],
  ndvi: [
    'Long-running NDVI records are the standard tool for tracking "greening" and "browning" trends, including partial vegetation recovery in parts of the Sahel following the severe droughts of the 1970s–80s.',
  ],
  no2: [
    'Column NO₂ measurements from instruments like OMI showed sharp, short-lived drops over many cities during COVID-19 lockdown periods, illustrating how directly this variable tracks traffic and industrial activity.',
  ],
  lst: [
    'Satellite land surface temperature is widely used to map urban heat islands, since it captures the hot surfaces of roofs and pavement that air-temperature stations next to buildings can miss.',
  ],
  snow_cover: [
    'Multi-decade satellite snow-cover records underpin most assessments of shrinking seasonal snow extent in the Northern Hemisphere.',
  ],
  co2: [
    'Atmospheric CO₂ is one of the most consistent long-term climate records available — concentrations have risen at nearly every monitoring location on Earth for decades.',
  ],
  precipitation: [
    'Reanalysis precipitation products like MERRA-2 are often cross-checked against satellite rainfall products such as GPM, since gauge coverage is sparse over oceans and remote land areas.',
  ],
  runoff: [
    'Runoff and streamflow records are a standard input to flood early-warning systems, especially where river gauges are sparse.',
  ],
  evapotranspiration: [
    'Evapotranspiration estimates help separate how much of a drying trend is due to less rainfall versus more water loss to a warming atmosphere.',
  ],
  wind_speed: [
    'Near-surface wind speed is a key input to both dust-storm and wildfire-spread forecasting.',
  ],
  humidity: [
    'Relative humidity combined with temperature underlies most heat-stress indices used in public health warnings.',
  ],
  so2: [
    'Satellite SO₂ monitoring has been used to detect both industrial pollution sources and volcanic eruptions from orbit.',
  ],
  ozone: [
    'Total column ozone records from instruments like OMI continue the multi-decade monitoring effort that first identified the Antarctic ozone hole.',
  ],
  gpm_precip: [
    'GPM\'s finer time resolution is particularly good at catching short, intense rainfall events that monthly-averaged records can smooth away.',
  ],
};

export function contextFor(variableId) {
  return CONTEXT_NOTES[variableId] || [];
}
