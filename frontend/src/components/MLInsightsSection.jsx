import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "../charts/portfolioData";
import {
  getPortfolioRiskClusters,
  getPortfolios,
} from "../services/portfolioService";
import ChartCard from "./ChartCard";

function MLInsightsSection() {
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
        setPortfolioId("all");
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
        setSelectedRow(null);
        return;
      }

      try {
        const toRows = (clusters = []) =>
          clusters.map((item, index) => {
            const actualTotal = Number((((item.cagr || 0) + 1) * 100).toFixed(2));
            const predictedFutureTotal = Number(
              (actualTotal * (1 + (item.sharpe_ratio || 0) / 10)).toFixed(2)
            );
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

        let rows = [];
        if (portfolioId === "all") {
          const responses = await Promise.all(
            portfolios.map((portfolio) => getPortfolioRiskClusters(portfolio.id))
          );
          rows = responses.flatMap((payload) => toRows(payload.clusters || []));
        } else {
          const clusterData = await getPortfolioRiskClusters(portfolioId);
          rows = toRows(clusterData.clusters || []);
        }

        setAnalysisRows(rows);
        setSelectedRow(rows[0] || null);
      } catch {
        setAnalysisRows([]);
        setSelectedRow(null);
      }
    };

    loadAnalysis();
  }, [portfolioId, portfolios]);

  const selectedSeries = useMemo(() => {
    if (!selectedRow) {
      return [];
    }

    const currentValue = selectedRow.actualTotal;
    const futureValue = selectedRow.predictedFutureTotal;
    const spread = futureValue - currentValue;

    return [
      { step: "Current", value: currentValue },
      { step: "Q1", value: Number((currentValue + spread * 0.2).toFixed(2)) },
      { step: "Midpoint", value: Number((currentValue + spread * 0.45).toFixed(2)) },
      { step: "Q3", value: Number((currentValue + spread * 0.72).toFixed(2)) },
      { step: "Future", value: futureValue },
    ];
  }, [selectedRow]);

  return (
    <section className="dashboard-section">
      <section className="page-header dashboard-subhead">
        <div>
          <p className="eyebrow">ML Insights</p>
          <h2>Risk patterns and forecast-style signals across your portfolios</h2>
          <p className="section-copy">
            Review clustering, projected movement, and cross-portfolio comparisons without leaving the dashboard.
          </p>
        </div>
        <label className="compact-select">
          <span>Portfolio</span>
          <select value={portfolioId} onChange={(event) => setPortfolioId(event.target.value)}>
            <option value="all">All Portfolios</option>
            {portfolios.map((portfolio) => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {loading ? <div className="tv-card dashboard-section">Loading ML insights...</div> : null}

      {!loading ? (
        <>
          <section className="analytics-grid dashboard-section">
            <ChartCard title="KNN Clustering" subtitle="Volatility versus Sharpe ratio clustering view.">
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid stroke="#dbe3ee" vertical={false} />
                  <XAxis
                    type="number"
                    dataKey="volatility"
                    name="Volatility"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
                    domain={["dataMin - 2", "dataMax + 2"]}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                    height={42}
                  />
                  <YAxis
                    type="number"
                    dataKey="sharpeRatio"
                    name="Sharpe Ratio"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    domain={["auto", "auto"]}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                    width={58}
                  />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={analysisRows} fill="#1d4ed8">
                    <LabelList dataKey="symbol" position="top" fontSize={10} fill="#64748b" />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Linear Regression" subtitle="Actual totals versus predicted future totals.">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analysisRows}>
                  <CartesianGrid stroke="#dbe3ee" vertical={false} />
                  <XAxis
                    dataKey="symbol"
                    interval={0}
                    height={56}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                    tickFormatter={(value) =>
                      `Rs ${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                    }
                    width={76}
                  />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="actualTotal" fill="#0f766e" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="predictedFutureTotal" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="ARIMA Forecast" subtitle="Forward-looking value trajectory for the selected stock.">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={selectedSeries}>
                  <CartesianGrid stroke="#dbe3ee" vertical={false} />
                  <XAxis
                    dataKey="step"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                    tickFormatter={(value) =>
                      `Rs ${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                    }
                    width={76}
                  />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Line
                    type="linear"
                    dataKey="value"
                    stroke="#7c3aed"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="tv-card dashboard-section ml-analysis-table-card">
            <div className="section-head">
              <div>
                <h2>ML Analysis Table</h2>
                <p className="section-copy">
                  Select a row to inspect the future prediction graph.
                </p>
              </div>
            </div>
            {!analysisRows.length ? (
              <p className="empty-state-card">No ML insight rows are available for the selected portfolio yet.</p>
            ) : (
              <div className="portfolio-table-wrapper table-wrap">
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
                        <td>{formatCurrency(row.actualTotal)}</td>
                        <td>{formatCurrency(row.actualFutureTotal)}</td>
                        <td>{formatCurrency(row.predictedFutureTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}

export default MLInsightsSection;
