import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Navbar from "../components/Navbar";
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
  const [updating, setUpdating] = useState(false);

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

  const handleSelectStock = async (stockChoice) => {
    try {
      setUpdating(true);
      setError("");
      await addStockToPortfolio(portfolioId, stockChoice);
      const updatedPortfolio = await getPortfolioById(portfolioId);
      setPortfolio(updatedPortfolio);
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
      const updatedPortfolio = await getPortfolioById(portfolioId);
      setPortfolio(updatedPortfolio);
    } catch {
      setError("Unable to remove stock. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleStockClick = (stockId) => {
    navigate(`/portfolio/${portfolioId}/stock/${stockId}`);
  };

  const stocks = portfolio?.stocks || [];
  const chartData = stocks.map((stock) => ({
    symbol: stock.stock_id,
    pe_ratio: Number(stock.pe_ratio) || 0,
    discount: Number(stock.discount_percentage) || 0,
  }));

  if (loading) {
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
        <Link className="back-link" to="/">
          Back to portfolios
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
          {portfolio?.sector || "No sector"} | {portfolio?.stocks?.length || 0}{" "}
          stocks
        </p>
        <Link className="back-link" to="/">
          Back to portfolios
        </Link>
      </section>

      <section className="panel">
        <h2>Add Stock</h2>
        <StockSearchBox onSelect={handleSelectStock} />
        {updating && <p className="hint-text">Updating portfolio...</p>}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Stocks</h2>
          <span>{stocks.length} total</span>
        </div>
        {error && <p className="error-text">{error}</p>}
        <StockTable
          stocks={stocks}
          onRemove={handleRemoveStock}
          onStockClick={handleStockClick}
        />
      </section>

      <section className="panel">
        <h2>Portfolio Insights</h2>
        {!stocks.length && (
          <p className="empty-state">
            Add stocks to view P/E and discount comparisons.
          </p>
        )}
        {!!stocks.length && (
          <>
            <h3>P/E Ratio Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="symbol" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pe_ratio" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>

            <h3>Discount % Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="symbol" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="discount" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </section>
    </main>
  );
}

export default Portfolio;
