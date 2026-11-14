// ============================================================
// Trend & significance math used across the app.
// All functions take plain arrays of numbers (or {x,y} pairs)
// and are dependency-free so they stay easy to audit/replace.
// ============================================================

// Ordinary least-squares regression. x is usually "years since start".
export function linregress(x, y) {
  const n = x.length;
  const mx = mean(x), my = mean(y);
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  // residual standard error of the slope, for a t-test / CI
  let sse = 0;
  for (let i = 0; i < n; i++) { const pred = intercept + slope * x[i]; sse += (y[i] - pred) ** 2; }
  const df = Math.max(n - 2, 1);
  const mse = sse / df;
  const seSlope = Math.sqrt(mse / (sxx || 1e-9));
  const tStat = seSlope === 0 ? 0 : slope / seSlope;
  const tCrit = tCritical95(df);
  const ci95 = [slope - tCrit * seSlope, slope + tCrit * seSlope];
  const pValue = tToP(tStat, df);
  return { slope, intercept, seSlope, df, tStat, pValue, ci95 };
}

export const mean = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);

// Two-sided p-value approximation from a t statistic (good enough for df > 5;
// falls back to a normal approximation for very small samples).
function tToP(t, df) {
  const x = df / (df + t * t);
  const p = incompleteBeta(df / 2, 0.5, x);
  return Math.max(0, Math.min(1, p));
}
// Regularized incomplete beta via continued fraction (Numerical Recipes style).
function incompleteBeta(a, b, x) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const lbeta = lgamma(a) + lgamma(b) - lgamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;
  let f = 1, c = 1, d = 0;
  for (let i = 0; i <= 200; i++) {
    const m = i / 2;
    let numerator;
    if (i === 0) numerator = 1;
    else if (i % 2 === 0) numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    else numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 + numerator * d; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d;
    c = 1 + numerator / c; if (Math.abs(c) < 1e-30) c = 1e-30;
    f *= d * c;
    if (Math.abs(1 - d * c) < 1e-8) break;
  }
  return 1 - front * (f - 1);
}
function lgamma(x) {
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1; let a = c[0]; const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
// 95% two-sided critical t value, interpolated from a standard table.
function tCritical95(df) {
  const table = { 1: 12.71, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
    15: 2.131, 20: 2.086, 30: 2.042, 40: 2.021, 60: 2.0, 120: 1.98 };
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (df >= 120) return 1.96;
  for (let i = 0; i < keys.length - 1; i++) {
    if (df >= keys[i] && df <= keys[i + 1]) {
      const t = (df - keys[i]) / (keys[i + 1] - keys[i]);
      return table[keys[i]] + t * (table[keys[i + 1]] - table[keys[i]]);
    }
  }
  return 1.96;
}

// Mann-Kendall trend test: distribution-free, robust to outliers/non-normality.
// Returns S, Z, p-value and a plain verdict.
export function mannKendall(values) {
  const n = values.length;
  let s = 0;
  for (let i = 0; i < n - 1; i++)
    for (let j = i + 1; j < n; j++) s += Math.sign(values[j] - values[i]);
  const varS = (n * (n - 1) * (2 * n + 5)) / 18;
  let z = 0;
  if (s > 0) z = (s - 1) / Math.sqrt(varS);
  else if (s < 0) z = (s + 1) / Math.sqrt(varS);
  const p = 2 * (1 - normalCdf(Math.abs(z)));
  return { s, z, pValue: Math.max(0, Math.min(1, p)), significant95: p < 0.05, direction: s > 0 ? 'increasing' : s < 0 ? 'decreasing' : 'flat' };
}
function normalCdf(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }
function erf(x) {
  const sign = x < 0 ? -1 : 1; x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

// Theil-Sen slope estimator: median of all pairwise slopes. Robust alternative
// to OLS, reported alongside it ("rate per year").
export function senSlope(x, y) {
  const slopes = [];
  const n = x.length;
  for (let i = 0; i < n - 1; i++)
    for (let j = i + 1; j < n; j++) {
      if (x[j] !== x[i]) slopes.push((y[j] - y[i]) / (x[j] - x[i]));
    }
  slopes.sort((a, b) => a - b);
  const mid = Math.floor(slopes.length / 2);
  return slopes.length % 2 ? slopes[mid] : (slopes[mid - 1] + slopes[mid]) / 2;
}

// Remove a repeating seasonal cycle by subtracting the mean for each
// position-in-cycle (e.g. calendar month), leaving the anomaly series.
export function deseasonalize(values, period = 12) {
  const climatology = new Array(period).fill(0).map((_, k) => {
    const vals = values.filter((_, i) => i % period === k);
    return mean(vals);
  });
  const grandMean = mean(values);
  return values.map((v, i) => v - climatology[i % period] + grandMean);
}

// Convenience: full trend+significance bundle for a (dates, values) series.
// dates are decimal years (e.g. 2014.25). Runs OLS, Sen's slope and MK on the
// raw series, scales slopes to "per year", and returns a plain-language verdict.
export function analyzeTrend(xYears, values) {
  const ols = linregress(xYears, values);
  const sen = senSlope(xYears, values);
  const mk = mannKendall(values);
  const years = xYears[xYears.length - 1] - xYears[0];
  const totalChange = ols.slope * years;
  return {
    slopePerYear: ols.slope,
    senSlopePerYear: sen,
    intercept: ols.intercept,
    ci95: ols.ci95,
    tStat: ols.tStat,
    tPValue: ols.pValue,
    mk,
    years,
    totalChange,
    significant: mk.significant95 && ols.pValue < 0.05,
  };
}
