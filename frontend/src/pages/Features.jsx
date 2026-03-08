import Navbar from "../components/Navbar";

const FEATURES = [
  {
    title: "Portfolio Tracking",
    description: "Organize holdings by sector and keep valuation snapshots current.",
  },
  {
    title: "Discount Analytics",
    description: "Surface undervalued stocks using intrinsic-value and price-range signals.",
  },
  {
    title: "Risk Clustering",
    description: "Review volatility, Sharpe ratio, drawdown, and CAGR with PCA clustering.",
  },
  {
    title: "Metals Explorer",
    description: "Compare gold and silver trends, return gaps, and long-range correlation.",
  },
  {
    title: "BTC Forecasting",
    description: "Test linear, ARIMA, and lightweight recurrent forecast models for Bitcoin.",
  },
];

function Features() {
  return (
    <main className="app-shell">
      <Navbar />

      <section className="hero">
        <p className="kicker">Platform Overview</p>
        <h1>What StockScope covers today</h1>
        <p className="subtitle">
          The platform combines portfolio management, valuation analytics, risk
          clustering, metals comparisons, and crypto forecasting in one workspace.
        </p>
      </section>

      <section className="panel">
        <div className="card-grid">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="portfolio-card">
              <p className="card-label">Feature</p>
              <h3>{feature.title}</h3>
              <p className="card-sector">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Features;
