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

  const trendData = (data?.gold_chart || []).map((point, index) => ({
    time: point.time,
    gold: point.price,
    silver: data?.silver_chart?.[index]?.price || 0,
    gap: data?.return_gap?.[index]?.gap || 0,
  }));

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
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="price" stroke="#d97706" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Silver Price Chart" subtitle="Historical silver price movement.">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.silver_chart || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="price" stroke="#64748b" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Trend Comparison" subtitle="Gold versus silver and the return gap.">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="gold" stroke="#d97706" strokeWidth={3} />
                  <Line type="monotone" dataKey="silver" stroke="#64748b" strokeWidth={3} />
                  <Line type="monotone" dataKey="gap" stroke="#1d4ed8" strokeWidth={3} strokeDasharray="6 4" />
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
