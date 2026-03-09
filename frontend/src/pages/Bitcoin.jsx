import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "../components/ChartCard";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import { getBtcForecast } from "../services/cryptoService";

function Bitcoin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const payload = await getBtcForecast("linear", 30);
        setData(payload);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const chartData = useMemo(
    () => [
      ...(data?.historical || []).map((point) => ({
        time: point.time,
        bitcoin: point.price,
        forecast: null,
      })),
      ...(data?.forecast || []).map((point) => ({
        time: point.time,
        bitcoin: null,
        forecast: point.price,
      })),
    ],
    [data]
  );

  return (
    <main className="app-shell">
      <Navbar />

      <section className="page-header">
        <div>
          <p className="eyebrow">Bitcoin</p>
          <h1>Bitcoin price trend and forecast analytics</h1>
          <p className="section-copy">
            Review historical movement, forecast trajectory, and summary indicators.
          </p>
        </div>
      </section>

      {loading ? <div className="tv-card">Loading bitcoin analytics...</div> : null}

      {!loading && data ? (
        <>
          <section className="stats-grid">
            <StatCard label="Model" value={data.model?.toUpperCase() || "-"} />
            <StatCard label="Forecast Days" value={data.days ?? "-"} />
            <StatCard label="Expected Return" value={`${data.summary?.expected_return ?? "-"}%`} />
            <StatCard label="Trend" value={data.summary?.trend || "-"} />
          </section>

          <section className="analytics-grid">
            <ChartCard title="Bitcoin Price Chart" subtitle="Historical and forecast price series.">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="bitcoin" stroke="#f59e0b" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="forecast" stroke="#1d4ed8" strokeWidth={3} strokeDasharray="6 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Trend Visualization" subtitle="Forecast-only forward movement.">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.forecast || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="price" stroke="#0f766e" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>
        </>
      ) : null}
    </main>
  );
}

export default Bitcoin;
