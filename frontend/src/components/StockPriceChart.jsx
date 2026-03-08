import { useState } from "react";

function StockPriceChart({ points }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!points.length) {
    return <p className="empty-state">No chart data available for this range.</p>;
  }

  const width = 980;
  const height = 280;
  const padding = 30;
  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const isUpTrend = prices[prices.length - 1] >= prices[0];
  const seed = `${points[0]?.timestamp || "x"}-${points.length}`.replace(/\W/g, "");
  const gradientId = `priceLineGrad${seed}`;
  const areaId = `priceAreaGrad${seed}`;
  const glowId = `priceGlow${seed}`;

  const toX = (index) =>
    padding + (index * (width - padding * 2)) / Math.max(points.length - 1, 1);
  const toY = (price) => height - padding - ((price - min) / span) * (height - padding * 2);

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${toX(index)},${toY(point.price)}`)
    .join(" ");
  const areaPath = `${path} L ${toX(points.length - 1)},${height - padding} L ${toX(0)},${
    height - padding
  } Z`;
  const latestX = toX(points.length - 1);
  const latestY = toY(points[points.length - 1].price);
  const yTicks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    const y = padding + ratio * (height - padding * 2);
    const price = max - ratio * span;
    return { y, price };
  });

  const updateHoverIndex = (event) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const chartWidth = width - padding * 2;
    const normalized = ((x / rect.width) * width - padding) / chartWidth;
    const index = Math.round(normalized * (points.length - 1));
    const safeIndex = Math.max(0, Math.min(points.length - 1, index));
    setHoverIndex(safeIndex);
  };

  const hoverPoint = hoverIndex !== null ? points[hoverIndex] : null;
  const hoverX = hoverIndex !== null ? toX(hoverIndex) : null;
  const hoverY = hoverPoint ? toY(hoverPoint.price) : null;

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="price-chart"
        role="img"
        onMouseMove={updateHoverIndex}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isUpTrend ? "#0d9488" : "#ef4444"} />
            <stop offset="100%" stopColor={isUpTrend ? "#14b8a6" : "#f97316"} />
          </linearGradient>
          <linearGradient id={areaId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              offset="0%"
              stopColor={isUpTrend ? "rgba(20,184,166,0.35)" : "rgba(249,115,22,0.28)"}
            />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {yTicks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={padding}
              y1={tick.y}
              x2={width - padding}
              y2={tick.y}
              className="chart-grid-line"
            />
            <text x={8} y={tick.y + 4} className="chart-price-label">
              {tick.price.toFixed(2)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill={`url(#${areaId})`} />
        <path d={path} className="price-chart-line" stroke={`url(#${gradientId})`} filter={`url(#${glowId})`} />
        <circle cx={latestX} cy={latestY} r="4.4" className="chart-latest-dot" />

        {hoverPoint && (
          <>
            <line
              x1={hoverX}
              y1={padding}
              x2={hoverX}
              y2={height - padding}
              className="chart-hover-line"
            />
            <circle cx={hoverX} cy={hoverY} r="5" className="chart-hover-dot" />
            <g
              transform={`translate(${Math.min(
                Math.max(hoverX + 10, 10),
                width - 170
              )},${Math.max(hoverY - 50, 12)})`}
            >
              <rect width="160" height="40" rx="8" className="chart-tooltip-box" />
              <text x="10" y="16" className="chart-tooltip-title">
                {hoverPoint.time}
              </text>
              <text x="10" y="31" className="chart-tooltip-value">
                Price: {hoverPoint.price}
              </text>
            </g>
          </>
        )}
      </svg>
      <div className="chart-axis">
        <span>{points[0].time}</span>
        <span>
          {points[points.length - 1].time} | Last: {points[points.length - 1].price}
        </span>
      </div>
    </div>
  );
}

export default StockPriceChart;
