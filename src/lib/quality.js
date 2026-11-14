import { linregress, mean } from './stats.js';

// Flags that affect how much to trust a trend/significance result:
// - a short record makes any trend estimate noisy
// - missing values (gaps) reduce effective sample size
// - autocorrelated residuals violate the independence assumption behind
//   both the OLS t-test and the Mann-Kendall test, so a "significant"
//   result on strongly autocorrelated data deserves a grain of salt.
export function dataQualityFlags(xYears, values, { cadence = 'monthly' } = {}) {
  const n = values.length;
  const years = xYears[n - 1] - xYears[0];
  const missingIdx = values.map((v, i) => (Number.isFinite(v) ? null : i)).filter((i) => i !== null);
  const missingPct = n ? (missingIdx.length / n) * 100 : 0;

  const clean = values.filter((v) => Number.isFinite(v));
  const cleanX = xYears.filter((_, i) => Number.isFinite(values[i]));
  const { slope, intercept } = clean.length > 2 ? linregress(cleanX, clean) : { slope: 0, intercept: mean(clean) };
  const residuals = clean.map((v, i) => v - (intercept + slope * cleanX[i]));
  const autocorr = lag1Autocorr(residuals);

  const notes = [];
  const shortRecord = years < 5;
  if (shortRecord) notes.push(`Record spans only ${years.toFixed(1)} years — trend estimates on records under 5 years are noisy; treat the rate per year as provisional.`);
  if (missingPct > 0) notes.push(`${missingPct.toFixed(1)}% of points are missing in this window.`);
  const highAutocorr = Math.abs(autocorr) > 0.3;
  if (highAutocorr) notes.push(`Residuals are autocorrelated (lag-1 r = ${autocorr.toFixed(2)}); the usual significance tests assume independent points, so the reported p-value may be a bit optimistic.`);
  if (cadence === 'daily' && years > 15) notes.push('Full daily resolution over a long window is a lot of points — consider the monthly view for a cleaner read of the long-term trend.');

  return { shortRecord, missingPct, autocorr, highAutocorr, notes, years };
}

function lag1Autocorr(residuals) {
  const n = residuals.length;
  if (n < 3) return 0;
  const m = mean(residuals);
  let num = 0, den = 0;
  for (let i = 0; i < n - 1; i++) num += (residuals[i] - m) * (residuals[i + 1] - m);
  for (let i = 0; i < n; i++) den += (residuals[i] - m) ** 2;
  return den === 0 ? 0 : num / den;
}
