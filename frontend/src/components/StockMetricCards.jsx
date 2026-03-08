function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

const CARD_CONFIG = [
  { key: "current_price", label: "Current Price" },
  { key: "change_percent", label: "Change %" },
  { key: "pe_ratio", label: "P/E Ratio" },
  { key: "eps", label: "EPS" },
  { key: "intrinsic_value", label: "Intrinsic Value" },
  { key: "day_high", label: "Day High" },
  { key: "day_low", label: "Day Low" },
  { key: "fifty_two_week_high", label: "52W High" },
  { key: "fifty_two_week_low", label: "52W Low" },
  { key: "volume", label: "Volume" },
  { key: "market_cap", label: "Market Cap" },
  { key: "discount_percentage", label: "Discount %" },
  { key: "opportunity_score", label: "Opportunity Score" },
];

function StockMetricCards({ cards }) {
  return (
    <div className="metric-grid">
      {CARD_CONFIG.map((config) => (
        <article key={config.key} className="metric-card">
          <p>{config.label}</p>
          <h3>{formatNumber(cards?.[config.key])}</h3>
        </article>
      ))}
    </div>
  );
}

export default StockMetricCards;
