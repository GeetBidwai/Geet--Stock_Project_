import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import Navbar from "../components/Navbar";
import StockSearchBox from "../components/StockSearchBox";
import StockTable from "../components/StockTable";
import {
  getPortfolioById,
  getPortfolioRiskClusters,
  getPortfolioTopDiscount,
  getPortfolioTopGrowth,
} from "../services/portfolioService";
import {
  addStockToPortfolio,
  getStockDetails,
  removeStockFromPortfolio,
} from "../services/stockService";

const GROWTH_RANGES = ["1w", "1mo", "3mo", "6mo", "1y", "3y"];

function SummaryCard({ label, value, helper }) {
  return (
    <article className="metric-card summary-card">
      <p>{label}</p>
      <h3>{value ?? "-"}</h3>
      {helper ? <span className="hint-text">{helper}</span> : null}
    </article>
  );
}

async function loadPriceChangeData(portfolioId, stocks) {
  const responses = await Promise.all(
    stocks.map(async (stock) => {
      try {
        const detail = await getStockDetails(portfolioId, stock.id, "1mo");
        return {
          ticker: stock.ticker || stock.stock_id,
          value: Number(detail.cards?.change_percent || 0),
        };
      } catch {
        return {
          ticker: stock.ticker || stock.stock_id,
          value: 0,
        };
      }
    })
  );

  return responses;
}

function Portfolio() {
  const { portfolioId } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [discountData, setDiscountData] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [priceChangeData, setPriceChangeData] = useState([]);
  const [riskData, setRiskData] = useState({ clusters: [], scatter_image: "" });
  const [growthRange, setGrowthRange] = useState("6mo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadPortfolio = useCallback(async (selectedGrowthRange = growthRange) => {
    try {
      setLoading(true);
      setError("");
      const [portfolioData, topDiscount, topGrowth, clusters] = await Promise.all([
        getPortfolioById(portfolioId),
        getPortfolioTopDiscount(portfolioId),
        getPortfolioTopGrowth(portfolioId, selectedGrowthRange),
        getPortfolioRiskClusters(portfolioId),
      ]);
      const stocks = portfolioData.stocks || [];
      const priceChanges = await loadPriceChangeData(portfolioId, stocks);

      setPortfolio(portfolioData);
      setDiscountData(topDiscount.items || []);
      setGrowthData(topGrowth.items || []);
      setPriceChangeData(priceChanges);
      setRiskData(clusters);
    } catch {
      setError("Unable to load this portfolio.");
    } finally {
      setLoading(false);
    }
  }, [growthRange, portfolioId]);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const handleSelectStock = async (stockChoice) => {
    try {
      setUpdating(true);
      setError("");
      await addStockToPortfolio(portfolioId, stockChoice);
      await loadPortfolio(growthRange);
    } catch {
      setError("Unable to add stock. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveStock = async (stockId) => {
    try {
      setUpdating(true);
      setError("");
      await removeStockFromPortfolio(portfolioId, stockId);
      await loadPortfolio(growthRange);
    } catch {
      setError("Unable to remove stock. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleStockClick = (stockId) => {
    navigate(`/stock/${stockId}`, {
      state: { portfolioId },
    });
  };

  const stocks = portfolio?.stocks || [];
  const summary = portfolio?.summary || {};
  const opportunityData = stocks.map((stock) => ({
    ticker: stock.ticker || stock.stock_id,
    value: Number(stock.opportunity_score || 0),
  }));
  const peRatioData = stocks.map((stock) => ({
    ticker: stock.ticker || stock.stock_id,
    value: Number(stock.pe_ratio || 0),
  }));

  if (loading && !portfolio) {
    return (
      <main className="app-shell">
        <Navbar />
        <p>Loading portfolio...</p>
      </main>
    );
  }

  if (error && !portfolio) {
    return (
      <main className="app-shell">
        <Navbar />
        <p className="error-text">{error}</p>
        <Link className="back-link" to="/dashboard">
          Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <Navbar />

      <section className="hero compact portfolio-hero-simple">
        <span className="pill portfolio-hero-badge">{portfolio?.sector || "No sector"}</span>
        <h1>{portfolio?.name}</h1>
        <div className="portfolio-hero-meta">
          <span>{stocks.length} stocks tracked</span>
          <span>Undervalued: {summary.undervalued_count ?? 0}</span>
          <span>Top pick: {summary.top_pick?.ticker || "-"}</span>
        </div>
        <p className="portfolio-hero-copy">
          Track the names in this basket, review valuation signals, and scan the risk picture at a glance.
        </p>
        <Link className="back-link hero-back-link" to="/dashboard">
          Back to dashboard
        </Link>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Portfolio Summary</h2>
          {summary.top_pick ? (
            <span>
              Top pick: {summary.top_pick.name} ({summary.top_pick.ticker})
            </span>
          ) : null}
        </div>
        <div className="summary-grid">
          <SummaryCard label="Holdings" value={summary.holdings_count ?? 0} />
          <SummaryCard
            label="Average Discount"
            value={summary.average_discount != null ? `${summary.average_discount}%` : "-"}
          />
          <SummaryCard
            label="Undervalued Stocks"
            value={summary.undervalued_count ?? 0}
          />
          <SummaryCard
            label="Opportunity Score"
            value={summary.average_opportunity_score ?? 0}
          />
        </div>
      </section>

      <section className="panel">
        <h2>Add Stock</h2>
        <StockSearchBox onSelect={handleSelectStock} />
        {updating && <p className="hint-text">Updating portfolio...</p>}
        {error && <p className="error-text">{error}</p>}
      </section>

      <section className="panel portfolio-detail-card stocks-card">
        <div className="panel-head">
          <h2>Stocks</h2>
          <span className="pill">{stocks.length} tracked</span>
        </div>
        <StockTable
          stocks={stocks}
          onRemove={handleRemoveStock}
          onStockClick={handleStockClick}
        />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Portfolio Stock Analytics</h2>
          <span>Per-stock metrics within this portfolio</span>
        </div>
        {!stocks.length ? (
          <p className="empty-state">Add stocks to see portfolio-level stock analytics.</p>
        ) : (
          <div className="chart-grid">
            <div className="chart-card">
              <h3>Price Change</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={priceChangeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ticker" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1d4ed8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <h3>Opportunity Value</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={opportunityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ticker" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <h3>P.E. Ratio</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={peRatioData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ticker" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <h3>Discount Percentage</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={discountData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ticker" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="discount_percent" fill="#0d9488" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Portfolio Analytics</h2>
          <div className="range-switch">
            {GROWTH_RANGES.map((rangeKey) => (
              <button
                key={rangeKey}
                type="button"
                className={rangeKey === growthRange ? "range-btn active" : "range-btn"}
                onClick={() => setGrowthRange(rangeKey)}
              >
                {rangeKey}
              </button>
            ))}
          </div>
        </div>
        {!stocks.length ? (
          <p className="empty-state">
            Add stocks to unlock discount, growth, and risk analytics.
          </p>
        ) : (
          <div className="chart-grid">
            <div className="chart-card">
              <h3>Top Discount Opportunities</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={discountData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ticker" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="discount_percent" fill="#0d9488" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <h3>Top Growth Stocks</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ticker" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="growth_percent"
                    stroke="#2563eb"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      <section className="panel portfolio-detail-card risk-card">
        <div className="panel-head">
          <h2>Risk Clusters</h2>
          <span className="pill">3Y volatility, Sharpe, drawdown, CAGR</span>
        </div>
        {!riskData.clusters?.length ? (
          <p className="empty-state">Risk clustering will appear after holdings load market history.</p>
        ) : (
          <>
            <div className="table-wrap portfolio-detail-table-wrap">
              <table className="portfolio-table detail-table risk-table">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Name</th>
                    <th>Volatility</th>
                    <th>Sharpe Ratio</th>
                    <th>Max Drawdown</th>
                    <th>CAGR</th>
                    <th>Risk Label</th>
                  </tr>
                </thead>
                <tbody>
                  {riskData.clusters.map((item) => (
                    <tr key={item.id}>
                      <td className="ticker-cell">{item.ticker}</td>
                      <td className="stock-primary-cell">{item.name}</td>
                      <td>{item.volatility ?? "-"}</td>
                      <td>{item.sharpe_ratio ?? "-"}</td>
                      <td>{item.max_drawdown ?? "-"}</td>
                      <td>{item.cagr ?? "-"}</td>
                      <td>
                        <span
                          className={
                            item.risk_label?.toLowerCase().includes("high")
                              ? "risk-badge risk-badge-high"
                              : "risk-badge risk-badge-low"
                          }
                        >
                          {item.risk_label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {riskData.scatter_image ? (
              <div className="risk-plot-wrap">
                <img
                  className="risk-plot"
                  src={`data:image/png;base64,${riskData.scatter_image}`}
                  alt="Risk clusters scatter plot"
                />
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}

export default Portfolio;
