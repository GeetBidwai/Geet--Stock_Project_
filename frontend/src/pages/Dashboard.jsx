import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "../components/ChartCard";
import Navbar from "../components/Navbar";
import PortfolioTable from "../components/PortfolioTable";
import ProfitLossChart from "../components/ProfitLossChart";
import StatCard from "../components/StatCard";
import {
  countryCurrencyMap,
  formatCurrency,
  loadPortfolioDataset,
  savePositionMeta,
} from "../charts/portfolioData";
import { createPortfolio } from "../services/portfolioService";
import { getStockSuggestions, addStockToPortfolio, removeStockFromPortfolio } from "../services/stockService";

const countryOptions = ["USA", "India", "UK"];
const sectorOptions = [
  "Technology",
  "Healthcare",
  "Finance",
  "Consumer",
  "Energy",
  "Industrial",
];

const compactXAxisProps = {
  dataKey: "name",
  interval: 0,
  height: 56,
  tick: { fontSize: 11, fill: "#64748b" },
};

function Dashboard() {
  const [dataset, setDataset] = useState({ portfolios: [], rows: [], totalValue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [form, setForm] = useState({
    country: "USA",
    sector: "Technology",
    quantity: "1",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const nextDataset = await loadPortfolioDataset();
      setDataset(nextDataset);
    } catch {
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const data = await getStockSuggestions(query.trim());
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const rows = dataset.rows;
  const totalValue = dataset.totalValue;
  const profitLoss = rows.reduce((sum, row) => sum + row.profitLoss, 0);

  const chartRows = useMemo(() => rows.slice(0, 8), [rows]);

  const analyticsData = useMemo(
    () => ({
      profitLoss: chartRows.map((row) => ({
        name: row.symbol,
        value: Number(row.profitLoss.toFixed(2)),
      })),
      discount: chartRows.map((row) => ({
        name: row.symbol,
        value: Number(row.discountPercent.toFixed(2)),
      })),
      opportunity: chartRows.map((row) => ({
        name: row.symbol,
        value: Number((row.positionValue * (row.opportunityScore / 100)).toFixed(2)),
      })),
      peRatio: chartRows.map((row) => ({
        name: row.symbol,
        value: Number(row.peRatio.toFixed(2)),
      })),
    }),
    [chartRows]
  );

  const sectorValueData = useMemo(() => {
    const sectorMap = rows.reduce((accumulator, row) => {
      accumulator[row.sector] = (accumulator[row.sector] || 0) + row.positionValue;
      return accumulator;
    }, {});

    return Object.entries(sectorMap).map(([name, value]) => ({ name, value }));
  }, [rows]);

  const handleCreatePosition = async (event) => {
    event.preventDefault();

    if (!selectedStock) {
      setError("Select a stock before creating a portfolio position.");
      return;
    }

    const quantity = Number(form.quantity);
    if (!quantity || quantity <= 0) {
      setError("Enter a valid quantity.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const portfolio = await createPortfolio({
        name: `${form.country} ${form.sector} Portfolio`,
        sector: form.sector,
      });
      const createdStock = await addStockToPortfolio(portfolio.id, selectedStock);
      savePositionMeta({
        portfolioId: portfolio.id,
        stockId: createdStock.id,
        quantity,
        buyPrice: Number(createdStock.current_price || 0),
        country: form.country,
        currency: countryCurrencyMap[form.country],
      });
      setQuery("");
      setSuggestions([]);
      setSelectedStock(null);
      await loadData();
    } catch {
      setError("Unable to create portfolio position.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (row) => {
    try {
      setError("");
      await removeStockFromPortfolio(row.portfolioId, row.stockId);
      await loadData();
    } catch {
      setError("Unable to remove this position.");
    }
  };

  return (
    <main className="app-shell">
      <Navbar />

      <section className="page-header">
        <div>
          <p className="eyebrow">My Dashboard</p>
          <h1>Portfolio analytics built around your active positions</h1>
          <p className="section-copy">
            Build positions by country, sector, and stock while keeping the existing
            backend portfolio APIs intact.
          </p>
        </div>
        <div className="header-stats">
          <StatCard label="Total Positions" value={rows.length} />
          <StatCard
            label="Portfolio Value"
            value={formatCurrency(totalValue, "USD")}
            tone="positive"
          />
        </div>
      </section>

      <section className="dashboard-layout dashboard-section">
        <section className="tv-card builder-card">
          <div className="section-head">
            <div>
              <h2>Portfolio Builder</h2>
              <p className="section-copy">
                Select country, sector, stock, and quantity to create a new tracked position.
              </p>
            </div>
          </div>

          <form className="builder-form" onSubmit={handleCreatePosition}>
            <label>
              <span>1. Select Country</span>
              <select
                value={form.country}
                onChange={(event) =>
                  setForm((current) => ({ ...current, country: event.target.value }))
                }
              >
                {countryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>2. Select Sector</span>
              <select
                value={form.sector}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sector: event.target.value }))
                }
              >
                {sectorOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="stock-search-field">
              <span>3. Select Stock</span>
              <input
                type="text"
                value={query}
                placeholder="Search by symbol or company"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelectedStock(null);
                }}
              />
              {!!suggestions.length && (
                <div className="suggestion-panel">
                  {suggestions.map((item) => (
                    <button
                      key={`${item.symbol}-${item.name}`}
                      type="button"
                      className="suggestion-row"
                      onClick={() => {
                        setSelectedStock(item);
                        setQuery(`${item.symbol} - ${item.name}`);
                        setSuggestions([]);
                      }}
                    >
                      <strong>{item.symbol}</strong>
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </label>

            <label>
              <span>4. Enter Quantity</span>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(event) =>
                  setForm((current) => ({ ...current, quantity: event.target.value }))
                }
              />
            </label>

            <div className="builder-actions">
              <span className="currency-chip">
                Currency: {countryCurrencyMap[form.country]}
              </span>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Creating..." : "Create Position"}
              </button>
            </div>
          </form>

          {error ? <p className="error-text">{error}</p> : null}
        </section>

        <section className="tv-card summary-stack">
          <StatCard label="Total Portfolio Value" value={formatCurrency(totalValue, "USD")} />
          <StatCard
            label="Profit / Loss"
            value={formatCurrency(profitLoss, "USD")}
            tone={profitLoss >= 0 ? "positive" : "negative"}
          />
          <StatCard
            label="Average Discount"
            value={`${rows.length ? (rows.reduce((sum, row) => sum + row.discountPercent, 0) / rows.length).toFixed(2) : "0.00"}%`}
          />
          <StatCard
            label="Sector Mix"
            value={`${sectorValueData.length} sectors`}
            hint="Based on tracked positions"
          />
        </section>
      </section>

      <section className="tv-card dashboard-section dashboard-table-card">
        <div className="section-head">
          <div>
            <h2>Portfolio Table</h2>
            <p className="section-copy">Current holdings and derived analytics metrics.</p>
          </div>
        </div>
        {loading ? <p className="section-copy">Loading portfolio positions...</p> : null}
        <PortfolioTable rows={rows} totalValue={totalValue} onRemove={handleRemove} />
      </section>

      <section className="analytics-grid dashboard-grid dashboard-section">
        <ChartCard title="Profit / Loss" subtitle="Position-level profit contribution.">
          <ProfitLossChart data={analyticsData.profitLoss} />
        </ChartCard>

        <ChartCard title="Discount Percentage" subtitle="Relative discount across positions.">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={analyticsData.discount}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis {...compactXAxisProps} />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip />
              <Bar dataKey="value" fill="#0f766e" minPointSize={5} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Opportunity Value" subtitle="Position value weighted by opportunity score.">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={analyticsData.opportunity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis {...compactXAxisProps} />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" minPointSize={5} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="P/E Ratio" subtitle="Current valuation multiple by position.">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={analyticsData.peRatio}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis {...compactXAxisProps} />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip />
              <Bar dataKey="value" fill="#7c3aed" minPointSize={5} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
    </main>
  );
}

export default Dashboard;
