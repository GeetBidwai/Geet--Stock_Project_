import { useEffect, useState } from "react";
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
import { getMetalsAnalytics } from "../services/metalsService";

const axisStyle = {
  tick: { fontSize: 11, fill: "#64748b" },
  tickLine: false,
  axisLine: { stroke: "#cbd5e1" },
};

function buildIndexedTrendData(data) {
  const goldSeries = data?.gold_chart || [];
  const silverSeries = data?.silver_chart || [];
  const baseGold = Number(goldSeries[0]?.price || 0);
  const baseSilver = Number(silverSeries[0]?.price || 0);

  return goldSeries.map((point, index) => {
    const goldPrice = Number(point.price || 0);
    const silverPrice = Number(silverSeries[index]?.price || 0);
    const goldIndexed = baseGold > 0 ? (goldPrice / baseGold) * 100 : 100;
    const silverIndexed = baseSilver > 0 ? (silverPrice / baseSilver) * 100 : 100;

    return {
      time: point.time,
      gold: goldPrice,
      silver: silverPrice,
      goldIndexed: Number(goldIndexed.toFixed(2)),
      silverIndexed: Number(silverIndexed.toFixed(2)),
    };
  });
}

function GoldSilver() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const payload = await getMetalsAnalytics("3y");
        setData(payload);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const trendData = buildIndexedTrendData(data);

  return (
    <main className="app-shell">
      <Navbar />

      <section className="page-header">
        <div>
          <p className="eyebrow">Gold/Silver</p>
          <h1>Precious metals trend and correlation analytics</h1>
          <p className="section-copy">
            Compare gold, silver, and return-gap movement from the existing analytics endpoint.
          </p>
        </div>
      </section>

      {loading ? <div className="tv-card">Loading metals analytics...</div> : null}

      {!loading && data ? (
        <>
          <section className="stats-grid">
            <StatCard label="Gold 3M Return" value={`${data.metrics?.gold_3m_return ?? "-"}%`} />
            <StatCard label="Silver 3M Return" value={`${data.metrics?.silver_3m_return ?? "-"}%`} />
            <StatCard label="Correlation" value={data.metrics?.correlation ?? "-"} />
            <StatCard label="Trend Slope" value={data.metrics?.regression_slope ?? "-"} />
          </section>

          <section className="analytics-grid">
            <ChartCard title="Gold Price Chart" subtitle="Historical gold price movement.">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.gold_chart || []}>
                  <CartesianGrid stroke="#dbe3ee" vertical={false} />
                  <XAxis dataKey="time" minTickGap={28} {...axisStyle} />
                  <YAxis width={58} {...axisStyle} />
                  <Tooltip
                    formatter={(value) => [Number(value).toFixed(2), "Gold Price"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#d97706"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Silver Price Chart" subtitle="Historical silver price movement.">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.silver_chart || []}>
                  <CartesianGrid stroke="#dbe3ee" vertical={false} />
                  <XAxis dataKey="time" minTickGap={28} {...axisStyle} />
                  <YAxis width={58} {...axisStyle} />
                  <Tooltip
                    formatter={(value) => [Number(value).toFixed(2), "Silver Price"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#64748b"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Trend Comparison"
              subtitle="Indexed performance comparison with both metals rebased to 100."
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid stroke="#dbe3ee" vertical={false} />
                  <XAxis dataKey="time" minTickGap={28} {...axisStyle} />
                  <YAxis
                    tickFormatter={(value) => `${Number(value).toFixed(0)}`}
                    width={54}
                    {...axisStyle}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "Gold Indexed") {
                        return [`${Number(value).toFixed(2)}`, "Gold Indexed"];
                      }
                      if (name === "Silver Indexed") {
                        return [`${Number(value).toFixed(2)}`, "Silver Indexed"];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label, payload) => {
                      const point = payload?.[0]?.payload;
                      if (!point) {
                        return label;
                      }
                      return `${label} | Gold: ${point.gold} | Silver: ${point.silver}`;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                  <Line
                    type="monotone"
                    dataKey="goldIndexed"
                    name="Gold Indexed"
                    stroke="#d97706"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="silverIndexed"
                    name="Silver Indexed"
                    stroke="#64748b"
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

export default GoldSilver;
