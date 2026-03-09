const marketOverviewItems = [
  { name: "S&P 500", price: "5,214.08", change: "+0.84%" },
  { name: "NASDAQ", price: "16,398.74", change: "+1.12%" },
  { name: "Bitcoin", price: "68,420.15", change: "+2.36%" },
  { name: "Gold", price: "2,184.60", change: "-0.28%" },
];

const marketSignals = [
  { label: "Market Sentiment", value: "Bullish" },
  { label: "Top Performing Sector", value: "Technology" },
  { label: "Average Market PE", value: "24.8" },
  { label: "Top Opportunity Stock", value: "NVDA" },
];

function MarketInsights() {
  return (
    <>
      <section className="tv-card market-card equal-height-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Market Overview</p>
            <h2>Live Snapshot</h2>
          </div>
        </div>

        <div className="market-overview-list">
          {marketOverviewItems.map((item) => (
            <div key={item.name} className="market-overview-row">
              <div>
                <strong>{item.name}</strong>
              </div>
              <div className="market-overview-values">
                <span>{item.price}</span>
                <span className={item.change.startsWith("-") ? "ticker-change negative" : "ticker-change positive"}>
                  {item.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="tv-card market-card equal-height-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Market Signals</p>
            <h2>Signal Summary</h2>
          </div>
        </div>

        <div className="market-signals-list">
          {marketSignals.map((signal) => (
            <div key={signal.label} className="market-signal-row">
              <span>{signal.label}</span>
              <strong>{signal.value}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default MarketInsights;
