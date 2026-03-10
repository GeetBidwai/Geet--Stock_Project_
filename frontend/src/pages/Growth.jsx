import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartCard from "../components/ChartCard";
import Navbar from "../components/Navbar";
import PortfolioGrowth from "../components/PortfolioGrowth";
import { generateGrowthData } from "../charts/portfolioGrowthData";
import StatCard from "../components/StatCard";
import { formatCurrency, loadPortfolioDataset } from "../charts/portfolioData";

const chartColors = ["#1d4ed8", "#0f766e", "#f59e0b", "#7c3aed", "#db2777", "#0891b2"];

function renderSectorLabel({ name, percent }) {
  return `${name.length > 14 ? `${name.slice(0, 14)}...` : name} ${(percent * 100).toFixed(0)}%`;
}

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
  const sectorLegend = useMemo(() => {
    const totalValue = sectorData.reduce((sum, entry) => sum + entry.value, 0);
    return sectorData.map((entry, index) => {
      const color = chartColors[index % chartColors.length];
      return {
        ...entry,
        color,
        percent: totalValue ? (entry.value / totalValue) * 100 : 0,
      };
    });
  }, [sectorData]);

  const bestStock = rows.reduce(
    (best, row) => (row.profitLoss > (best?.profitLoss ?? Number.NEGATIVE_INFINITY) ? row : best),
    null
  );
  const futureValue = projectionSeries.at(-1)?.predicted || 0;
  const minimumValue = projectionSeries.length
    ? Math.min(...projectionSeries.map((item) => Math.min(item.actual || 0, item.predicted || 0)))
    : 0;
  const maximumValue = projectionSeries.length
    ? Math.max(...projectionSeries.map((item) => Math.max(item.actual || 0, item.predicted || 0)))
    : 0;
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
          <section className="tv-card growth-section dashboard-section">
            <div className="section-head growth-head">
              <div>
                <h2>Portfolio Growth</h2>
                <p className="section-copy">
                  Actual portfolio value versus predicted future value.
                </p>
              </div>
            </div>

            <div className="growth-chart-shell">
              <PortfolioGrowth data={projectionSeries} />
            </div>

            <section className="stats-grid growth-stats-grid">
              <StatCard label="Total Portfolio Value" value={formatCurrency(dataset.totalValue, "USD")} />
              <StatCard
                label="Market Move"
                value={formatCurrency(rows.reduce((sum, row) => sum + (Number(row.profitLoss) || 0), 0), "USD")}
                tone="negative"
              />
              <StatCard label="Future Portfolio Value" value={formatCurrency(futureValue, "USD")} />
              <StatCard label="Minimum Value" value={formatCurrency(minimumValue, "USD")} />
              <StatCard label="Maximum Value" value={formatCurrency(maximumValue, "USD")} />
              <StatCard label="Average P/E Ratio" value={peAverage.toFixed(2)} />
              <StatCard
                label="Best Performing Stock"
                value={bestStock ? bestStock.symbol : "-"}
                hint={bestStock ? formatCurrency(bestStock.profitLoss, bestStock.currency) : "No data"}
              />
            </section>
          </section>

          <ChartCard
            title="Sector Allocation"
            subtitle="Position value distribution by sector."
          >
            <div className="sector-chart-wrapper">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={sectorData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={102}
                    paddingAngle={2}
                    labelLine={false}
                    label={renderSectorLabel}
                  >
                    {sectorLegend.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value, "USD")} />
                </PieChart>
              </ResponsiveContainer>
              <div className="sector-legend" aria-label="sector allocations">
                {sectorLegend.map((entry) => (
                  <div key={entry.name} className="sector-legend-item">
                    <span className="sector-legend-dot" style={{ background: entry.color }} />
                    <span className="sector-legend-name">{entry.name}</span>
                    <span className="sector-legend-value">{entry.percent.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </>
      ) : null}
    </main>
  );
}

export default Growth;
