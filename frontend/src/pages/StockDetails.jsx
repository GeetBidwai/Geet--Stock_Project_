import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StockMetricCards from "../components/StockMetricCards";
import StockPriceChart from "../components/StockPriceChart";
import { getStockDetails } from "../services/stockService";

const RANGES = ["1d", "7d", "1mo", "3mo", "6mo", "1y"];

function StockDetails() {
  const { portfolioId, stockId } = useParams();
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
        <p>Loading stock details...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app-shell">
        <p className="error-text">{error}</p>
        <Link className="back-link" to={`/portfolio/${portfolioId}`}>
          Back to portfolio
        </Link>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="hero compact">
        <p className="kicker">Stock Details</p>
        <h1>{stock.name}</h1>
        <p className="subtitle">
          {stock.symbol} {stock.exchange ? `| ${stock.exchange}` : ""}{" "}
          {stock.sector ? `| ${stock.sector}` : ""}
        </p>
        <Link className="back-link" to={`/portfolio/${portfolioId}`}>
          Back to portfolio
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
