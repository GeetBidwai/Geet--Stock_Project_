import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CorrelationScatterChart from "../components/CorrelationScatterChart";
import Navbar from "../components/Navbar";
import StockPriceChart from "../components/StockPriceChart";
import { getMetalsAnalytics } from "../services/metalsService";

const RANGE_OPTIONS = [
  { key: "1mo", label: "1 Month" },
  { key: "3mo", label: "3 Months" },
  { key: "6mo", label: "6 Months" },
  { key: "1y", label: "1 Year" },
  { key: "3y", label: "3 Years" },
];

function Metals() {
  const [range, setRange] = useState("1mo");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const payload = await getMetalsAnalytics(range);
        setData(payload);
      } catch {
        setError("Unable to load metals analytics.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [range]);

  return (
    <main className="app-shell">
      <Navbar />

      <section className="hero compact">
        <p className="kicker">Explore</p>
        <h1>Gold and Silver Analytics</h1>
        <p className="subtitle">
          Compare gold and silver trends and view 3-year Pearson correlation.
        </p>
        <Link className="back-link" to="/">
          Back to portfolios
        </Link>
      </section>

      <section className="panel">
        <div className="range-switch">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={option.key === range ? "range-btn active" : "range-btn"}
              onClick={() => setRange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
        {loading && <p>Loading charts...</p>}
        {error && <p className="error-text">{error}</p>}
      </section>

      {!loading && !error && data && (
        <>
          <section className="panel">
            <h2>Gold Price Graph</h2>
            <StockPriceChart points={data.gold_chart || []} />
          </section>

          <section className="panel">
            <h2>Silver Price Graph</h2>
            <StockPriceChart points={data.silver_chart || []} />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Gold vs Silver Correlation (Past 3 Years)</h2>
              <span>
                Pearson: {data.correlation?.pearson_value ?? "-"} (
                {data.correlation?.label || "Unknown"})
              </span>
            </div>
            <CorrelationScatterChart points={data.correlation?.points || []} />
          </section>
        </>
      )}
    </main>
  );
}

export default Metals;
