import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "../components/ChartCard";
import Navbar from "../components/Navbar";
import { formatCurrency } from "../charts/portfolioData";
import {
  getPortfolioRiskClusters,
  getPortfolios,
} from "../services/portfolioService";

function MLAnalysis() {
  const [portfolios, setPortfolios] = useState([]);
  const [portfolioId, setPortfolioId] = useState("");
  const [analysisRows, setAnalysisRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPortfolios = async () => {
      try {
        const items = await getPortfolios();
        setPortfolios(items);
        if (items.length) {
          setPortfolioId(String(items[0].id));
        }
      } finally {
        setLoading(false);
      }
    };

    loadPortfolios();
  }, []);

  useEffect(() => {
    const loadAnalysis = async () => {
      if (!portfolioId) {
        setAnalysisRows([]);
        return;
      }

      try {
        const clusterData = await getPortfolioRiskClusters(portfolioId);
        const rows = (clusterData.clusters || []).map((item, index) => {
          const actualTotal = Number((((item.cagr || 0) + 1) * 100).toFixed(2));
          const predictedFutureTotal = Number((actualTotal * (1 + (item.sharpe_ratio || 0) / 10)).toFixed(2));
          return {
            symbol: item.ticker,
            cluster: item.risk_label || item.cluster || index % 3,
            actualTotal,
            actualFutureTotal: actualTotal,
            predictedFutureTotal,
            volatility: Number(item.volatility || 0),
            sharpeRatio: Number(item.sharpe_ratio || 0),
            cagr: Number(item.cagr || 0),
          };
        });
        setAnalysisRows(rows);
        setSelectedRow(rows[0] || null);
      } catch {
        setAnalysisRows([]);
        setSelectedRow(null);
      }
    };

    loadAnalysis();
  }, [portfolioId]);

  const selectedSeries = useMemo(() => {
    if (!selectedRow) {
      return [];
    }

    return [
      { step: "Current", value: selectedRow.actualTotal },
      { step: "Midpoint", value: Number(((selectedRow.actualTotal + selectedRow.predictedFutureTotal) / 2).toFixed(2)) },
      { step: "Future", value: selectedRow.predictedFutureTotal },
    ];
  }, [selectedRow]);

  return (
    <main className="app-shell">
      <Navbar />

      <section className="page-header">
        <div>
          <p className="eyebrow">ML Analysis</p>
          <h1>Machine-learning style insights across your portfolio risk profile</h1>
          <p className="section-copy">
            Explore clustering, regression-style comparisons, and forecast-style projections from the available risk data.
          </p>
        </div>
        <label className="compact-select">
          <span>Portfolio</span>
          <select value={portfolioId} onChange={(event) => setPortfolioId(event.target.value)}>
            {portfolios.map((portfolio) => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {loading ? <div className="tv-card">Loading ML analysis...</div> : null}

      {!loading ? (
        <>
          <section className="analytics-grid">
            <ChartCard title="KNN Clustering" subtitle="Volatility versus Sharpe ratio clustering view.">
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="volatility" name="Volatility" />
                  <YAxis dataKey="sharpeRatio" name="Sharpe Ratio" />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={analysisRows} fill="#1d4ed8" />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Linear Regression" subtitle="Actual totals versus predicted future totals.">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analysisRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="symbol" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="actualTotal" fill="#0f766e" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="predictedFutureTotal" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="ARIMA Forecast" subtitle="Forward-looking value trajectory for the selected stock.">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={selectedSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="step" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="tv-card">
            <div className="section-head">
              <div>
                <h2>Analysis Table</h2>
                <p className="section-copy">
                  Select a row to inspect the future prediction graph.
                </p>
              </div>
            </div>
            <div className="table-wrap">
              <table className="portfolio-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Cluster</th>
                    <th>Actual Total</th>
                    <th>Actual Future Total</th>
                    <th>Predicted Future Total</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisRows.map((row) => (
                    <tr
                      key={row.symbol}
                      className={selectedRow?.symbol === row.symbol ? "is-selected" : ""}
                      onClick={() => setSelectedRow(row)}
                    >
                      <td>{row.symbol}</td>
                      <td>{row.cluster}</td>
                      <td>{formatCurrency(row.actualTotal, "USD")}</td>
                      <td>{formatCurrency(row.actualFutureTotal, "USD")}</td>
                      <td>{formatCurrency(row.predictedFutureTotal, "USD")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

export default MLAnalysis;
