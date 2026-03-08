import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import StockMetricCards from "../components/StockMetricCards";
import StockPriceChart from "../components/StockPriceChart";
import { getStockDetails } from "../services/stockService";

const RANGES = ["1d", "7d", "1mo", "3mo", "6mo", "1y", "3y"];

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
  }, [portfolioId, stockId, range]);

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

      <section className="hero compact">
        <p className="kicker">Stock Details</p>
        <h1>{stock.name}</h1>
        <p className="subtitle">
          {stock.symbol} {stock.exchange ? `| ${stock.exchange}` : ""}
          {stock.sector ? ` | ${stock.sector}` : ""}
        </p>
        <Link className="back-link" to={portfolioId ? `/portfolio/${portfolioId}` : "/dashboard"}>
          Back
        </Link>
      </section>

      <section className="panel">
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

      <section className="panel">
        <h2>Key Metrics</h2>
        <StockMetricCards cards={stock.cards || {}} />
      </section>
    </main>
  );
}

export default StockDetails;
