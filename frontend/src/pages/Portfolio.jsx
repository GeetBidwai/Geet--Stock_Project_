import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StockSearchBox from "../components/StockSearchBox";
import StockTable from "../components/StockTable";
import { getPortfolioById } from "../services/portfolioService";
import {
  addStockToPortfolio,
  removeStockFromPortfolio,
} from "../services/stockService";

function Portfolio() {
  const { portfolioId } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPortfolioById(portfolioId);
      setPortfolio(data);
    } catch {
      setError("Unable to load this portfolio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, [portfolioId]);

  const handleAddStock = async (stockChoice) => {
    try {
      setActionError("");
      await addStockToPortfolio(portfolioId, stockChoice);
      await loadPortfolio();
    } catch {
      setActionError("Unable to add stock. Please try again.");
    }
  };

  const handleRemoveStock = async (stockId) => {
    try {
      setActionError("");
      await removeStockFromPortfolio(portfolioId, stockId);
      await loadPortfolio();
    } catch {
      setActionError("Unable to remove stock. Please try again.");
    }
  };

  const handleOpenStock = (stockId) => {
    navigate(`/portfolio/${portfolioId}/stock/${stockId}`);
  };

  if (loading) {
    return (
      <main className="app-shell">
        <p>Loading portfolio...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app-shell">
        <p className="error-text">{error}</p>
        <Link className="back-link" to="/">
          Back to landing page
        </Link>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="hero compact">
        <p className="kicker">Portfolio</p>
        <h1>{portfolio.name}</h1>
        <p className="subtitle">Sector: {portfolio.sector}</p>
        <Link className="back-link" to="/">
          Back to portfolios
        </Link>
      </section>

      <section className="panel">
        <h2>Add Stocks</h2>
        <p className="hint-text">
          Enter a stock name. Suggestions come from Yahoo Finance search.
        </p>
        <StockSearchBox onSelect={handleAddStock} />
        {actionError && <p className="error-text">{actionError}</p>}
      </section>

      <section className="panel">
        <h2>Portfolio Stocks</h2>
        <StockTable
          stocks={portfolio.stocks || []}
          onRemove={handleRemoveStock}
          onStockClick={handleOpenStock}
        />
      </section>
    </main>
  );
}

export default Portfolio;
