import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import MLInsightsSection from "../components/MLInsightsSection";
import PortfolioTable from "../components/PortfolioTable";
import StatCard from "../components/StatCard";
import { loadPortfolioDataset } from "../charts/portfolioData";
import {
  createPortfolio,
  deletePortfolio,
  getPortfolioSectors,
} from "../services/portfolioService";

function Dashboard() {
  const navigate = useNavigate();
  const [dataset, setDataset] = useState({ portfolios: [], rows: [], totalValue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [sectorList, setSectorList] = useState([]);
  const [form, setForm] = useState({
    name: "",
    sector: "",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [nextDataset, nextSectors] = await Promise.all([
        loadPortfolioDataset(),
        getPortfolioSectors(),
      ]);
      setDataset(nextDataset);
      setSectorList(nextSectors);
      setForm((current) =>
        nextSectors.includes(current.sector)
          ? current
          : { ...current, sector: nextSectors[0] || "" }
      );
    } catch {
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePortfolio = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      setSuccessMessage("");
      setError("Enter a portfolio name.");
      return;
    }

    if (!form.sector.trim()) {
      setSuccessMessage("");
      setError("Choose a sector.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");
      await createPortfolio({
        name,
        sector: form.sector,
      });
      await loadData();
      setForm((current) => ({
        name: "",
        sector: current.sector || "",
      }));
      setSuccessMessage("Portfolio created successfully.");
    } catch {
      setSuccessMessage("");
      setError("Unable to create portfolio.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePortfolio = async (portfolioId) => {
    try {
      setError("");
      setSuccessMessage("");
      await deletePortfolio(portfolioId);
      await loadData();
    } catch {
      setError("Unable to delete portfolio.");
    }
  };

  const portfolios = dataset.portfolios || [];
  const rows = dataset.rows || [];
  const averageDiscount = rows.length
    ? rows.reduce((sum, row) => sum + row.discountPercent, 0) / rows.length
    : 0;
  const sectorCount = new Set(portfolios.map((portfolio) => portfolio.sector).filter(Boolean)).size;
  const undervaluedCount = rows.filter((row) => row.discountPercent > 0).length;

  return (
    <main className="app-shell">
      <Navbar />

      <section className="page-header">
        <div>
          <p className="eyebrow" style={{ color: "var(--primary)", display: "inline-block", padding: "0.25rem 0.75rem", background: "#e0e7ff", borderRadius: "999px" }}>My Dashboard</p>
          <h1 style={{ background: "linear-gradient(to right, #1e40af, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Build Portfolios With a Sharper Edge</h1>
          <p className="section-copy" style={{ fontSize: "1.1rem", maxWidth: "600px" }}>
            Launch focused portfolios in a few clicks, then dive into the stocks,
            signals, and analytics behind each theme.
          </p>
        </div>
        <div className="header-stats" style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", padding: "1.5rem", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
          <StatCard label="Total Portfolios" value={portfolios.length} />
          <StatCard label="Tracked Stocks" value={rows.length} tone="positive" />
        </div>
      </section>

      <section className="dashboard-layout dashboard-section">
        <section className="tv-card builder-card">
          <div className="section-head">
            <div>
              <h2>Start a New Portfolio</h2>
              <p className="section-copy">
                Name your portfolio, choose a sector, and we will set up the space for it.
              </p>
            </div>
          </div>

          <form className="builder-form builder-form-centered" onSubmit={handleCreatePortfolio}>
            <label>
              <span>Portfolio Name</span>
              <input
                type="text"
                value={form.name}
                placeholder="e.g., Growth Leaders"
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>

            <label>
              <span>Sector</span>
              <select
                value={form.sector}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sector: event.target.value }))
                }
                disabled={!sectorList.length}
              >
                {sectorList.length ? (
                  sectorList.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))
                ) : (
                  <option value="">Loading sectors...</option>
                )}
              </select>
            </label>

            <div className="builder-actions">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Creating..." : "Create Portfolio"}
              </button>
            </div>
          </form>

          {error ? <p className="error-text">{error}</p> : null}
          {successMessage ? <p className="success-text">{successMessage}</p> : null}
        </section>

        <section className="tv-card summary-stack">
          <StatCard label="Total Sectors" value={sectorCount} />
          <StatCard label="Average Discount" value={`${averageDiscount.toFixed(2)}%`} />
          <StatCard label="Undervalued Stocks" value={undervaluedCount} />
          <StatCard
            label="Portfolio Coverage"
            value={`${rows.length} stocks`}
            hint="Across all portfolios"
          />
        </section>
      </section>

      <section className="tv-card dashboard-section dashboard-table-card">
        <div className="section-head">
          <div>
            <h2>All Portfolios</h2>
            <p className="section-copy">
              Open a portfolio to manage its stocks and view sector-specific analytics.
            </p>
          </div>
        </div>
        {loading ? <p className="section-copy">Loading portfolios...</p> : null}
        <PortfolioTable
          portfolios={portfolios}
          onOpen={(portfolioId) => navigate(`/portfolio/${portfolioId}`)}
          onDelete={handleDeletePortfolio}
        />
      </section>

      <MLInsightsSection />
    </main>
  );
}

export default Dashboard;
