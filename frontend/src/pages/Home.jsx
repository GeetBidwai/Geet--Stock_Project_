import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PortfolioCard from "../components/PortfolioCard";
import PortfolioCreateForm from "../components/PortfolioCreateForm";
import { createPortfolio, getPortfolios } from "../services/portfolioService";

function Home() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPortfolios = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPortfolios();
      setPortfolios(data);
    } catch {
      setError("Unable to load portfolios. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolios();
  }, []);

  const handleCreatePortfolio = async (payload) => {
    await createPortfolio(payload);
    await loadPortfolios();
  };

  return (
    <main className="app-shell">
      <Navbar />

      <section className="hero">
        <p className="kicker">Portfolio Workspace</p>
        <h1>Build sector portfolios and track stock opportunities</h1>
        <p className="subtitle">
          Create custom portfolios like Healthcare, Telecom, Banking, or any
          sector you choose. Click a card to manage stocks and view valuation
          signals.
        </p>
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
