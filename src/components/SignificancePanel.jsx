import InfoTip from './InfoTip.jsx';

export default function SignificancePanel({ variable, regionLabel, range, cadence, deseasonalized, trend, quality }) {
  if (!trend) return null;
  const sig = trend.significant;
  const rate = trend.slopePerYear;
  const sign = rate >= 0 ? '+' : '';
  return (
    <div className="chart-card significance" aria-live="polite">
      <h3>Plain-English result</h3>
      <div className="sig-line"><b>What</b><span>{variable.label} ({variable.unit}){deseasonalized ? ', seasonal cycle removed' : ''}</span></div>
      <div className="sig-line"><b>Where</b><span>{regionLabel}</span></div>
      <div className="sig-line"><b>How much</b><span>{sign}{rate.toFixed(4)} {variable.unit}/year over {range[1] - range[0]} years ({sign}{trend.totalChange.toFixed(2)} {variable.unit} total){cadence === 'daily' ? ' (daily record)' : ''}</span></div>
      <div className="sig-line">
        <b>Significant?</b>
        <span>
          <span className={sig ? 'verdict yes' : 'verdict no'}>{sig ? 'Significant at 95%' : 'Not yet significant'}</span>
          {' '}— Mann-Kendall p={trend.mk.pValue.toFixed(3)}, trend is {trend.mk.direction}.
          <InfoTip label="What is the Mann-Kendall test?">
            Mann-Kendall checks whether values tend to rise (or fall) over time without assuming the data follows a bell curve — it just counts how often later points are higher than earlier ones. A p-value under 0.05 means that pattern is unlikely to be random noise, which is the usual bar for calling a trend "significant."
          </InfoTip>
        </span>
      </div>
      <div className="detail-grid">
        <div><span>Sen's slope<InfoTip label="What is Sen's slope?">The median of the slopes between every pair of points in the record. It gives the same "rate per year" as the line of best fit, but a few unusual months can't drag it around the way they can an ordinary average-based fit.</InfoTip></span>{trend.senSlopePerYear.toFixed(4)} /yr</div>
        <div><span>OLS 95% CI<InfoTip label="What is a 95% confidence interval?">A range that would contain the true rate of change 95% of the time if this measurement were repeated many times. If the range crosses zero, "no trend at all" is still a plausible explanation.</InfoTip></span>[{trend.ci95[0].toFixed(4)}, {trend.ci95[1].toFixed(4)}]</div>
        <div><span>t-statistic</span>{trend.tStat.toFixed(2)} (p={trend.tPValue.toFixed(3)})</div>
        <div><span>Mann-Kendall Z</span>{trend.mk.z.toFixed(2)}</div>
      </div>
      {!sig && (
        <p className="hint">
          A trend can be real but still "not yet significant" with a short or noisy record — try widening the date range or comparing raw vs. anomalies.
        </p>
      )}
      {quality && quality.notes.length > 0 && (
        <div className="quality-flags">
          <strong>Data quality notes</strong>
          <ul>
            {quality.notes.map((n, i) => <li key={i}>⚠ {n}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
