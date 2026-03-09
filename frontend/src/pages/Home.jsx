import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import StockTicker from "../components/StockTicker";

function Home() {
  const navigate = useNavigate();

  return (
    <main className="app-shell landing-shell">
      <Navbar />

      <section className="landing-grid">
        <aside className="tv-card ticker-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Market Pulse</p>
              <h2>Trending Stocks</h2>
            </div>
            <span className="pill">Updates every 60s</span>
          </div>
          <StockTicker />
        </aside>

        <section className="tv-card hero-panel">
          <p className="eyebrow">Modern Financial Analytics</p>
          <h1>TradeVista</h1>
          <p className="hero-copy">
            Build and Analyze Smart Investment Portfolios
          </p>
          <p className="section-copy">
            Organize portfolios, evaluate valuation signals, compare alternative
            assets, and explore machine-learning insights from one cleaner workspace.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/login")}
          >
            Start Your Portfolio
          </button>
        </section>
      </section>
    </main>
  );
}

export default Home;
