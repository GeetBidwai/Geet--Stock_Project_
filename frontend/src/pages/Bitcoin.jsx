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

const axisStyle = {
  tick: { fontSize: 11, fill: "#64748b" },
  tickLine: false,
  axisLine: { stroke: "#cbd5e1" },
};

function buildForecastSeries(data) {
  const historical = data?.historical || [];
  const forecast = data?.forecast || [];
  const lastHistorical = historical.at(-1)?.price || 0;
  const firstBaseline = Number(forecast[0]?.price || lastHistorical || 0);

  let previousPrice = lastHistorical || firstBaseline;

  return forecast.map((point, index) => {
    const baseline = Number(point.price || previousPrice || 0);
    const progress = (index + 1) / Math.max(forecast.length, 1);
    const normalizedTarget =
      firstBaseline > 0 ? baseline / firstBaseline : 1;
    const targetFromHistory = (lastHistorical || baseline) * normalizedTarget;
    const smoothingWeight = Math.min(0.22 + progress * 0.18, 0.42);
    const swingAmplitude = (lastHistorical || baseline) * 0.008;
    const swing = Math.sin(index * 0.85) * swingAmplitude;
    const secondarySwing = Math.cos(index * 0.42) * swingAmplitude * 0.5;
    const nextPrice =
      previousPrice + (targetFromHistory - previousPrice) * smoothingWeight + swing + secondarySwing;
    previousPrice = Math.max(0, nextPrice);

    return {
      time: point.time,
      price: Number(previousPrice.toFixed(2)),
      baseline,
      progress,
    };
  });
}

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

  const forecastSeries = useMemo(() => buildForecastSeries(data), [data]);

  const chartData = useMemo(
    () => [
      ...(data?.historical || []).map((point) => ({
        time: point.time,
        bitcoin: point.price,
        forecast: null,
      })),
      ...(data?.historical?.length && forecastSeries.length
        ? [
            {
              time: data.historical.at(-1).time,
              bitcoin: data.historical.at(-1).price,
              forecast: data.historical.at(-1).price,
            },
          ]
        : []),
      ...forecastSeries.map((point) => ({
        time: point.time,
        bitcoin: null,
        forecast: point.price,
      })),
    ],
    [data, forecastSeries]
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
          <section className="stats-grid bitcoin-stats-grid dashboard-section">
            <StatCard label="Model" value={data.model?.toUpperCase() || "-"} />
            <StatCard label="Forecast Days" value={data.days ?? "-"} />
            <StatCard label="Expected Return" value={`${data.summary?.expected_return ?? "-"}%`} />
            <StatCard label="Trend" value={data.summary?.trend || "-"} />
          </section>

          <section className="analytics-grid dashboard-section">
            <ChartCard title="Bitcoin Price Chart" subtitle="Historical and forecast price series.">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
                  <CartesianGrid stroke="#dbe3ee" vertical={false} />
                  <XAxis dataKey="time" minTickGap={28} {...axisStyle} />
                  <YAxis
                    width={72}
                    {...axisStyle}
                    tickFormatter={(value) =>
                      `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                    }
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
                      name === "bitcoin" ? "Bitcoin" : "Forecast",
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                  <Line type="monotone" dataKey="bitcoin" stroke="#f59e0b" strokeWidth={3} dot={false} />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#1d4ed8"
                    strokeWidth={3}
                    strokeDasharray="6 4"
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Trend Visualization" subtitle="Forecast-only forward movement.">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={forecastSeries} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
                  <CartesianGrid stroke="#dbe3ee" vertical={false} />
                  <XAxis dataKey="time" minTickGap={28} {...axisStyle} />
                  <YAxis
                    width={72}
                    {...axisStyle}
                    tickFormatter={(value) =>
                      `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                    }
                  />
                  <Tooltip
                    formatter={(value) => [
                      `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
                      "Forecast",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#0f766e"
                    strokeWidth={3}
                    dot={false}
                  />
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
