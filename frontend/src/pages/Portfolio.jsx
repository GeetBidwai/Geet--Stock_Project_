import { useEffect, useState } from "react";
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

function Portfolio() {
  const { portfolioId } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [discountData, setDiscountData] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [riskData, setRiskData] = useState({ clusters: [], scatter_image: "" });
  const [growthRange, setGrowthRange] = useState("6mo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadPortfolio = async (selectedGrowthRange = growthRange) => {
    try {
      setLoading(true);
      setError("");
      const [portfolioData, topDiscount, topGrowth, clusters] = await Promise.all([
        getPortfolioById(portfolioId),
        getPortfolioTopDiscount(portfolioId),
        getPortfolioTopGrowth(portfolioId, selectedGrowthRange),
        getPortfolioRiskClusters(portfolioId),
      ]);
      setPortfolio(portfolioData);
      setDiscountData(topDiscount.items || []);
      setGrowthData(topGrowth.items || []);
      setRiskData(clusters);
    } catch {
      setError("Unable to load this portfolio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const [portfolioData, topDiscount, topGrowth, clusters] = await Promise.all([
          getPortfolioById(portfolioId),
          getPortfolioTopDiscount(portfolioId),
          getPortfolioTopGrowth(portfolioId, growthRange),
          getPortfolioRiskClusters(portfolioId),
        ]);
        setPortfolio(portfolioData);
        setDiscountData(topDiscount.items || []);
        setGrowthData(topGrowth.items || []);
        setRiskData(clusters);
      } catch {
        setError("Unable to load this portfolio.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [portfolioId, growthRange]);

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

      <section className="hero compact">
        <p className="kicker">Portfolio</p>
        <h1>{portfolio?.name}</h1>
        <p className="subtitle">
          {portfolio?.sector || "No sector"} | {stocks.length} holdings
        </p>
        <Link className="back-link" to="/dashboard">
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

      <section className="panel">
        <div className="panel-head">
          <h2>Stocks</h2>
          <span>{stocks.length} total</span>
        </div>
        <StockTable
          stocks={stocks}
          onRemove={handleRemoveStock}
          onStockClick={handleStockClick}
        />
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

      <section className="panel">
        <div className="panel-head">
          <h2>Risk Clusters</h2>
          <span>3Y volatility, Sharpe, drawdown, CAGR</span>
        </div>
        {!riskData.clusters?.length ? (
          <p className="empty-state">Risk clustering will appear after holdings load market history.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
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
                      <td>{item.ticker}</td>
                      <td>{item.name}</td>
                      <td>{item.volatility ?? "-"}</td>
                      <td>{item.sharpe_ratio ?? "-"}</td>
                      <td>{item.max_drawdown ?? "-"}</td>
                      <td>{item.cagr ?? "-"}</td>
                      <td>{item.risk_label}</td>
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
