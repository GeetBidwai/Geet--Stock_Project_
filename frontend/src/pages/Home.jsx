import { useEffect, useState } from "react";
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
import PortfolioCard from "../components/PortfolioCard";
import PortfolioCreateForm from "../components/PortfolioCreateForm";
import {
  createPortfolio,
  getDashboardSummary,
  getPortfolios,
} from "../services/portfolioService";

function SummaryCard({ label, value }) {
  return (
    <article className="metric-card summary-card">
      <p>{label}</p>
      <h3>{value}</h3>
    </article>
  );
}

function Home() {
  const [portfolios, setPortfolios] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const [portfolioData, summaryData] = await Promise.all([
        getPortfolios(),
        getDashboardSummary(),
      ]);
      setPortfolios(portfolioData);
      setSummary(summaryData);
    } catch {
      setError("Unable to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCreatePortfolio = async (payload) => {
    await createPortfolio(payload);
    await loadDashboard();
  };

  return (
    <main className="app-shell">
      <Navbar />

      <section className="hero">
        <p className="kicker">Portfolio Workspace</p>
        <h1>Build sector portfolios and track stock opportunities</h1>
        <p className="subtitle">
          Create custom portfolios, monitor undervalued holdings, and compare
          discount and growth signals across your watchlist.
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Dashboard Summary</h2>
          {summary && <span>{summary.portfolio_count || 0} portfolios</span>}
        </div>
        {loading && <p>Loading dashboard...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && summary && (
          <div className="summary-grid">
            <SummaryCard label="Portfolios" value={summary.portfolio_count ?? 0} />
            <SummaryCard label="Total Holdings" value={summary.total_holdings ?? 0} />
            <SummaryCard
              label="Undervalued Stocks"
              value={summary.undervalued_stocks ?? 0}
            />
            <SummaryCard
              label="Opportunity Score"
              value={summary.average_opportunity_score ?? 0}
            />
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Portfolio Signals</h2>
          <span>Discount and growth leaders</span>
        </div>
        {!loading && summary && (
          <div className="chart-grid">
            <div className="chart-card">
              <h3>Top Discount Opportunities</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summary.top_discount || []}>
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
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={summary.top_growth || []}>
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
        <h2>Create Portfolio</h2>
        <PortfolioCreateForm onSubmit={handleCreatePortfolio} />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Your Portfolios</h2>
          <span>{portfolios.length} total</span>
        </div>

        {loading && <p>Loading portfolios...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !portfolios.length && (
          <p className="empty-state">
            No portfolios yet. Create one to get started.
          </p>
        )}

        <div className="card-grid">
          {portfolios.map((portfolio) => (
            <PortfolioCard key={portfolio.id} portfolio={portfolio} />
          ))}
        </div>
      </section>
    </main>
  );
}

export default Home;
