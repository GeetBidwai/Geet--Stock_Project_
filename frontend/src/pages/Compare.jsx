import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "../components/ChartCard";
import Navbar from "../components/Navbar";
import { loadPortfolioDataset } from "../charts/portfolioData";

function Compare() {
  const [rows, setRows] = useState([]);
  const [selection, setSelection] = useState({ stockA: "", stockB: "" });

  useEffect(() => {
    const loadRows = async () => {
      const dataset = await loadPortfolioDataset();
      const uniqueRows = dataset.rows.filter(
        (row, index, array) =>
          array.findIndex((candidate) => candidate.symbol === row.symbol) === index
      );
      setRows(uniqueRows);
      if (uniqueRows.length >= 2) {
        setSelection({ stockA: uniqueRows[0].symbol, stockB: uniqueRows[1].symbol });
      }
    };

    loadRows();
  }, []);

  const stockA = rows.find((row) => row.symbol === selection.stockA) || null;
  const stockB = rows.find((row) => row.symbol === selection.stockB) || null;

  const comparisonRows = useMemo(() => {
    if (!stockA || !stockB) {
      return [];
    }

    return [
      { metric: stockA.symbol, price: stockA.currentPrice, performance: stockA.profitLoss, peRatio: stockA.peRatio },
      { metric: stockB.symbol, price: stockB.currentPrice, performance: stockB.profitLoss, peRatio: stockB.peRatio },
    ];
  }, [stockA, stockB]);

  const performanceSeries = useMemo(() => {
    if (!stockA || !stockB) {
      return [];
    }

    return [
      { step: "Entry", [stockA.symbol]: stockA.buyPrice, [stockB.symbol]: stockB.buyPrice },
      { step: "Current", [stockA.symbol]: stockA.currentPrice, [stockB.symbol]: stockB.currentPrice },
      { step: "Projected", [stockA.symbol]: stockA.currentPrice * 1.05, [stockB.symbol]: stockB.currentPrice * 1.04 },
    ];
  }, [stockA, stockB]);

  return (
    <main className="app-shell">
      <Navbar />

      <section className="page-header">
        <div>
          <p className="eyebrow">Compare</p>
          <h1>Compare two tracked stocks side by side</h1>
          <p className="section-copy">
            Select two positions from your tracked holdings and review price, performance, and P/E signals.
          </p>
        </div>
        <div className="compare-selectors">
          <label className="compact-select">
            <span>Stock A</span>
            <select
              value={selection.stockA}
              onChange={(event) =>
                setSelection((current) => ({ ...current, stockA: event.target.value }))
              }
            >
              {rows.map((row) => (
                <option key={`a-${row.symbol}`} value={row.symbol}>
                  {row.symbol}
                </option>
              ))}
            </select>
          </label>
          <label className="compact-select">
            <span>Stock B</span>
            <select
              value={selection.stockB}
              onChange={(event) =>
                setSelection((current) => ({ ...current, stockB: event.target.value }))
              }
            >
              {rows.map((row) => (
                <option key={`b-${row.symbol}`} value={row.symbol}>
                  {row.symbol}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="analytics-grid">
        <ChartCard title="Price Comparison" subtitle="Current price side-by-side.">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={comparisonRows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="price" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Performance Comparison" subtitle="Buy, current, and projected trajectory.">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={performanceSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="step" />
              <YAxis />
              <Tooltip />
              {stockA ? <Line type="monotone" dataKey={stockA.symbol} stroke="#1d4ed8" strokeWidth={3} /> : null}
              {stockB ? <Line type="monotone" dataKey={stockB.symbol} stroke="#0f766e" strokeWidth={3} /> : null}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="P/E Ratio Comparison" subtitle="Valuation multiple comparison.">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={comparisonRows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="peRatio" fill="#7c3aed" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
    </main>
  );
}

export default Compare;
