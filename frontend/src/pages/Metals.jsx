import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import CorrelationScatterChart from "../components/CorrelationScatterChart";
import Navbar from "../components/Navbar";
import { getMetalsAnalytics } from "../services/metalsService";

const RANGE_OPTIONS = [
  { key: "1mo", label: "1 Month" },
  { key: "3mo", label: "3 Months" },
  { key: "6mo", label: "6 Months" },
  { key: "1y", label: "1 Year" },
  { key: "3y", label: "3 Years" },
];

function MetricCard({ label, value }) {
  return (
    <article className="metric-card summary-card">
      <p>{label}</p>
      <h3>{value ?? "-"}</h3>
    </article>
  );
}

function Metals() {
  const [range, setRange] = useState("3y");
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
          Compare precious metals performance, return gaps, and correlation over
          multiple time ranges.
        </p>
        <Link className="back-link" to="/dashboard">
          Back to dashboard
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
            <div className="panel-head">
              <h2>3 Month Insight Cards</h2>
              <span>Correlation and trend view</span>
            </div>
            <div className="summary-grid">
              <MetricCard
                label="Gold 3M Return"
                value={
                  data.metrics?.gold_3m_return != null
                    ? `${data.metrics.gold_3m_return}%`
                    : "-"
                }
              />
              <MetricCard
                label="Silver 3M Return"
                value={
                  data.metrics?.silver_3m_return != null
                    ? `${data.metrics.silver_3m_return}%`
                    : "-"
                }
              />
              <MetricCard
                label="Correlation"
                value={data.metrics?.correlation ?? "-"}
              />
              <MetricCard
                label="Trend Slope"
                value={data.metrics?.regression_slope ?? "-"}
              />
            </div>
          </section>

          <section className="panel">
            <div className="chart-grid">
              <div className="chart-card">
                <h3>Gold Price History</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={data.gold_chart || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="price" stroke="#d97706" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <h3>Silver Price History</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={data.silver_chart || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="price" stroke="#475569" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>Return Gap (Silver minus Gold)</h2>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={data.return_gap || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="gap" stroke="#0d9488" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
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
