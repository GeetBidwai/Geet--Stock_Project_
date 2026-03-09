import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MarketInsights from "../components/MarketInsights";
import Navbar from "../components/Navbar";
import StockPriceChart from "../components/StockPriceChart";
import StockTicker from "../components/StockTicker";

const RANGE_OPTIONS = [
  { key: "1d", label: "1D", points: 24, unit: "hour" },
  { key: "1w", label: "1W", points: 28, unit: "day" },
  { key: "1m", label: "1M", points: 30, unit: "day" },
  { key: "1y", label: "1Y", points: 24, unit: "month" },
  { key: "3y", label: "3Y", points: 36, unit: "month" },
  { key: "5y", label: "5Y", points: 40, unit: "month" },
];

const initialStock = {
  symbol: "AAPL",
  name: "Apple",
  price: 198.21,
  change: 1.2,
};

function buildStockSeries(stock, rangeKey) {
  const range = RANGE_OPTIONS.find((item) => item.key === rangeKey) || RANGE_OPTIONS[1];
  const basePrice = Number(stock.price || 0);
  const trendFactor = stock.change >= 0 ? 1 : -1;
  const startDate = new Date();
  const volatilityMap = {
    hour: 0.0028,
    day: 0.009,
    month: 0.032,
  };
  const volatility = basePrice * (volatilityMap[range.unit] || 0.01);

  const formatLabel = (date) => {
    if (range.unit === "hour") {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    }

    if (range.key === "1w" || range.key === "1m") {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  };

  return Array.from({ length: range.points }, (_, index) => {
    const pointDate = new Date(startDate);

    if (range.unit === "hour") {
      pointDate.setHours(startDate.getHours() - (range.points - 1 - index));
    } else if (range.unit === "day") {
      pointDate.setDate(startDate.getDate() - (range.points - 1 - index));
    } else {
      pointDate.setMonth(startDate.getMonth() - (range.points - 1 - index));
    }

    const progression = index / Math.max(range.points - 1, 1);
    const seasonalWave = Math.sin((index + 1) * 0.9) * volatility * 1.2;
    const secondaryWave = Math.cos((index + 2) * 1.7) * volatility * 0.75;
    const spike = ((index * 17 + stock.symbol.charCodeAt(0)) % 9) - 4;
    const shock = spike * volatility * 0.38;
    const trendDrift =
      trendFactor * progression * basePrice * (range.unit === "month" ? 0.22 : 0.08);
    const meanReversion = (0.5 - progression) * volatility * 0.8;
    const price = Math.max(
      basePrice * 0.45,
      basePrice + trendDrift + seasonalWave + secondaryWave + shock + meanReversion
    );

    return {
      time: formatLabel(pointDate),
      price: Number(price.toFixed(2)),
      timestamp: pointDate.toISOString(),
    };
  });
}

function Home() {
  const navigate = useNavigate();
  const [selectedStock, setSelectedStock] = useState(initialStock);
  const [selectedRange, setSelectedRange] = useState("1m");

  const chartPoints = useMemo(
    () => buildStockSeries(selectedStock, selectedRange),
    [selectedRange, selectedStock]
  );

  return (
    <main className="app-shell landing-shell">
      <Navbar />

      <section className="tv-card landing-hero-banner">
        <p className="eyebrow">Modern Financial Analytics</p>
        <h1>TradeVista</h1>
        <p className="hero-copy">
          Build and Analyze Smart Investment Portfolios
        </p>
        <button
          type="button"
          className="primary-button landing-hero-button"
          onClick={() => navigate("/dashboard")}
        >
          Start Your Portfolio
        </button>
      </section>

      <section className="landing-grid landing-box-grid">
        <aside className="tv-card ticker-panel equal-height-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Market Pulse</p>
              <h2>Trending Stocks</h2>
            </div>
            <span className="pill">Updates every 60s</span>
          </div>
          <StockTicker limit={5} onSelect={setSelectedStock} />
        </aside>

        <MarketInsights />
      </section>

      <section className="tv-card selected-stock-section">
        <div className="selected-stock-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Selected Stock</p>
              <h2>
                {selectedStock.name} ({selectedStock.symbol})
              </h2>
              <p className="section-copy selected-stock-copy">
                Review price movement and switch between ranges to inspect short and
                longer-term momentum for the selected stock.
              </p>
            </div>
            <div className="selected-stock-meta">
              <span className="selected-stock-price">${selectedStock.price.toFixed(2)}</span>
              <span
                className={
                  selectedStock.change >= 0 ? "ticker-change positive" : "ticker-change negative"
                }
              >
                {selectedStock.change >= 0 ? "+" : ""}
                {selectedStock.change.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="range-switch landing-range-switch">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={selectedRange === option.key ? "range-btn active" : "range-btn"}
                onClick={() => setSelectedRange(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <StockPriceChart points={chartPoints} />
        </div>
      </section>
    </main>
  );
}

export default Home;
