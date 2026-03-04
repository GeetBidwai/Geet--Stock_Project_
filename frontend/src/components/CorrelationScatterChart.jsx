function CorrelationScatterChart({ points }) {
  if (!points.length) {
    return <p className="empty-state">No correlation data available.</p>;
  }

  const width = 980;
  const height = 320;
  const padding = 40;

  const xValues = points.map((point) => point.gold_price);
  const yValues = points.map((point) => point.silver_price);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;

  const toX = (x) => padding + ((x - xMin) / xSpan) * (width - padding * 2);
  const toY = (y) => height - padding - ((y - yMin) / ySpan) * (height - padding * 2);
  const seed = `${points[0]?.time || "x"}-${points.length}`.replace(/\W/g, "");
  const scatterGradId = `scatterGrad${seed}`;

  const xMean = xValues.reduce((total, value) => total + value, 0) / xValues.length;
  const yMean = yValues.reduce((total, value) => total + value, 0) / yValues.length;
  const numerator = points.reduce(
    (total, point) =>
      total + (point.gold_price - xMean) * (point.silver_price - yMean),
    0
  );
  const denominator = points.reduce(
    (total, point) => total + (point.gold_price - xMean) ** 2,
    0
  );
  const slope = denominator ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;
  const trendStartY = slope * xMin + intercept;
  const trendEndY = slope * xMax + intercept;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="price-chart" role="img">
        <defs>
          <linearGradient id={scatterGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>

        <rect
          x={padding}
          y={padding}
          width={width - padding * 2}
          height={height - padding * 2}
          className="scatter-bg"
        />
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          className="scatter-axis-line"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          className="scatter-axis-line"
        />

        {points.map((point, index) => (
          <circle
            key={`${point.time}-${index}`}
            cx={toX(point.gold_price)}
            cy={toY(point.silver_price)}
            r="3"
            className="scatter-dot"
            fill={`url(#${scatterGradId})`}
          />
        ))}
        <line
          x1={toX(xMin)}
          y1={toY(trendStartY)}
          x2={toX(xMax)}
          y2={toY(trendEndY)}
          className="trend-line"
        />
      </svg>
      <div className="scatter-axis">
        <span>X: Gold Prices</span>
        <span>Y: Silver Prices | {points.length} points</span>
      </div>
    </div>
  );
}

export default CorrelationScatterChart;
