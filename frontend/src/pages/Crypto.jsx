import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Navbar from "../components/Navbar";
import { getBtcForecast } from "../services/cryptoService";

const MODELS = ["linear", "arima", "rnn"];
const HORIZONS = [14, 30, 60, 90];

function Crypto() {
  const [model, setModel] = useState("linear");
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadForecast = async () => {
      try {
        setLoading(true);
        setError("");
        const payload = await getBtcForecast(model, days);
        setData(payload);
      } catch {
        setError("Unable to load BTC forecast.");
      } finally {
        setLoading(false);
      }
    };

    loadForecast();
  }, [model, days]);

  const chartData = [
    ...(data?.historical || []).map((point) => ({
      ...point,
      historical: point.price,
      forecast: null,
    })),
    ...(data?.forecast || []).map((point) => ({
      ...point,
      historical: null,
      forecast: point.price,
    })),
  ];

  return (
    <main className="app-shell">
      <Navbar />

      <section className="hero compact">
        <p className="kicker">Crypto Explorer</p>
        <h1>BTC Forecast Dashboard</h1>
        <p className="subtitle">
          Compare lightweight linear, ARIMA, and NumPy recurrent projections for
          Bitcoin.
        </p>
      </section>

      <section className="panel">
        <div className="control-row">
          <label>
            <span>Model</span>
            <select value={model} onChange={(event) => setModel(event.target.value)}>
              {MODELS.map((option) => (
                <option key={option} value={option}>
                  {option.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Forecast Horizon</span>
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            >
              {HORIZONS.map((option) => (
                <option key={option} value={option}>
                  {option} days
                </option>
              ))}
            </select>
          </label>
        </div>
        {loading && <p>Loading forecast...</p>}
        {error && <p className="error-text">{error}</p>}
      </section>

      {!loading && !error && data && (
        <>
          <section className="panel">
            <div className="summary-grid">
              <article className="metric-card summary-card">
                <p>Selected Model</p>
                <h3>{data.model?.toUpperCase()}</h3>
              </article>
              <article className="metric-card summary-card">
                <p>Forecast Days</p>
                <h3>{data.days}</h3>
              </article>
              <article className="metric-card summary-card">
                <p>Expected Return</p>
                <h3>
                  {data.summary?.expected_return != null
                    ? `${data.summary.expected_return}%`
                    : "-"}
                </h3>
              </article>
              <article className="metric-card summary-card">
                <p>Trend</p>
                <h3>{data.summary?.trend || "-"}</h3>
              </article>
            </div>
          </section>

          <section className="panel">
            <h2>Historical vs Forecast</h2>
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="historical"
                  stroke="#0f766e"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#2563eb"
                  strokeWidth={3}
                  strokeDasharray="6 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>
        </>
      )}
    </main>
  );
}

export default Crypto;
