import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import StockMetricCards from "../components/StockMetricCards";
import StockPriceChart from "../components/StockPriceChart";
import { getStockDetails } from "../services/stockService";

const RANGES = ["1d", "7d", "1mo", "3mo", "6mo", "1y", "3y"];

const mockTickers = {
  AAPL: { name: "Apple", symbol: "AAPL", sector: "Technology", exchange: "NASDAQ" },
  MSFT: { name: "Microsoft", symbol: "MSFT", sector: "Technology", exchange: "NASDAQ" },
  TSLA: { name: "Tesla", symbol: "TSLA", sector: "Automotive", exchange: "NASDAQ" },
  NVDA: { name: "NVIDIA", symbol: "NVDA", sector: "Semiconductors", exchange: "NASDAQ" },
};

function buildMockSeries(symbol) {
  return Array.from({ length: 10 }, (_, index) => ({
    time: `T${index + 1}`,
    price: Number((120 + index * 4 + (symbol.charCodeAt(0) % 9)).toFixed(2)),
  }));
}

function StockDetails() {
  const { portfolioId: routePortfolioId, stockId } = useParams();
  const location = useLocation();
  const portfolioId = routePortfolioId || location.state?.portfolioId || null;
  const [range, setRange] = useState("1mo");
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStock = async () => {
      const isNumericStockId = /^\d+$/.test(String(stockId));

      if (!isNumericStockId) {
        const fallback = mockTickers[String(stockId).toUpperCase()] || {
          name: String(stockId).toUpperCase(),
          symbol: String(stockId).toUpperCase(),
          sector: "Market",
          exchange: "Global",
        };
        setStock({
          ...fallback,
          chart: buildMockSeries(fallback.symbol),
          cards: {
            current_price: buildMockSeries(fallback.symbol).at(-1)?.price || 0,
            change_percent: 1.2,
            pe_ratio: 24.8,
            eps: 5.1,
            intrinsic_value: 214.4,
            discount_percentage: 4.6,
            opportunity_score: 82.4,
          },
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await getStockDetails(portfolioId, stockId, range);
        setStock(data);
      } catch {
        setError("Unable to load stock details.");
      } finally {
        setLoading(false);
      }
    };

    loadStock();
  }, [portfolioId, range, stockId]);

  if (loading) {
    return (
      <main className="app-shell">
        <Navbar />
        <p>Loading stock details...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app-shell">
        <Navbar />
        <p className="error-text">{error}</p>
        <Link className="back-link" to={portfolioId ? `/portfolio/${portfolioId}` : "/dashboard"}>
          Back
        </Link>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <Navbar />

      <section className="page-header">
        <div>
          <p className="eyebrow">Stock Details</p>
          <h1>{stock.name}</h1>
          <p className="section-copy">
            {stock.symbol}
            {stock.exchange ? ` | ${stock.exchange}` : ""}
            {stock.sector ? ` | ${stock.sector}` : ""}
          </p>
        </div>
        <Link className="navbar-login" to={portfolioId ? `/portfolio/${portfolioId}` : "/"}>
          Back
        </Link>
      </section>

      <section className="tv-card">
        <div className="range-switch">
          {RANGES.map((key) => (
            <button
              key={key}
              type="button"
              className={key === range ? "range-btn active" : "range-btn"}
              onClick={() => setRange(key)}
            >
              {key}
            </button>
          ))}
        </div>
        <StockPriceChart points={stock.chart || []} />
      </section>

      <section className="tv-card">
        <h2>Key Metrics</h2>
        <StockMetricCards cards={stock.cards || {}} />
      </section>
    </main>
  );
}

export default StockDetails;
