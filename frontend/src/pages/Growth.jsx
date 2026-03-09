import { useEffect, useMemo, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import ChartCard from "../components/ChartCard";
import Navbar from "../components/Navbar";
import PortfolioGrowth from "../components/PortfolioGrowth";
import { generateGrowthData } from "../charts/portfolioGrowthData";
import StatCard from "../components/StatCard";
import { formatCurrency, loadPortfolioDataset } from "../charts/portfolioData";

const chartColors = ["#1d4ed8", "#0f766e", "#f59e0b", "#7c3aed", "#db2777", "#0891b2"];

function Growth() {
  const [dataset, setDataset] = useState({ portfolios: [], rows: [], totalValue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const nextDataset = await loadPortfolioDataset();
        setDataset(nextDataset);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const rows = dataset.rows;
  const projectionSeries = useMemo(
    () => generateGrowthData(dataset.totalValue),
    [dataset.totalValue]
  );
  const sectorData = useMemo(() => {
    const grouped = rows.reduce((accumulator, row) => {
      accumulator[row.sector] = (accumulator[row.sector] || 0) + row.positionValue;
      return accumulator;
    }, {});

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [rows]);

  const bestStock = rows.reduce(
    (best, row) => (row.profitLoss > (best?.profitLoss ?? Number.NEGATIVE_INFINITY) ? row : best),
    null
  );
  const futureValue = projectionSeries.at(-1)?.predicted || 0;
  const peAverage =
    rows.length > 0
      ? rows.reduce((sum, row) => sum + row.peRatio, 0) / rows.length
      : 0;

  return (
    <main className="app-shell">
      <Navbar />

      <section className="page-header">
        <div>
          <p className="eyebrow">Growth</p>
          <h1>Portfolio Growth and projected future performance</h1>
          <p className="section-copy">
            Review actual value against projected value and understand sector exposure.
          </p>
        </div>
      </section>

      {loading ? <div className="tv-card">Loading growth analytics...</div> : null}

      {!loading ? (
        <>
          <ChartCard
            title="Portfolio Growth"
            subtitle="Actual portfolio value versus predicted future value."
          >
            <PortfolioGrowth portfolioValue={dataset.totalValue} />
          </ChartCard>

          <section className="stats-grid dashboard-section">
            <StatCard label="Total Portfolio Value" value={formatCurrency(dataset.totalValue, "USD")} />
            <StatCard
              label="Profit / Loss"
              value={formatCurrency(rows.reduce((sum, row) => sum + row.profitLoss, 0), "USD")}
              tone="positive"
            />
            <StatCard label="Future Portfolio Value" value={formatCurrency(futureValue, "USD")} />
            <StatCard
              label="Minimum Value"
              value={formatCurrency(Math.min(...projectionSeries.map((item) => item.predicted || item.actual || 0), 0), "USD")}
            />
            <StatCard
              label="Maximum Value"
              value={formatCurrency(Math.max(...projectionSeries.map((item) => item.predicted || item.actual || 0), 0), "USD")}
            />
            <StatCard label="Average P/E Ratio" value={peAverage.toFixed(2)} />
            <StatCard
              label="Best Performing Stock"
              value={bestStock ? bestStock.symbol : "-"}
              hint={bestStock ? formatCurrency(bestStock.profitLoss, bestStock.currency) : "No data"}
            />
          </section>

          <ChartCard
            title="Sector Allocation"
            subtitle="Position value distribution by sector."
          >
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={sectorData} dataKey="value" nameKey="name" outerRadius={110} label>
                  {sectorData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      ) : null}
    </main>
  );
}

export default Growth;
