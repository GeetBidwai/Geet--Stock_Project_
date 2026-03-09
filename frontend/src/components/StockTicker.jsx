import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const baseStocks = [
  { symbol: "AAPL", price: 198.21, change: 1.2 },
  { symbol: "MSFT", price: 420.18, change: 0.8 },
  { symbol: "TSLA", price: 181.5, change: -1.1 },
  { symbol: "NVDA", price: 902.44, change: 2.4 },
  { symbol: "AMZN", price: 182.16, change: 0.9 },
  { symbol: "META", price: 503.28, change: 1.4 },
  { symbol: "GOOGL", price: 168.14, change: 0.6 },
  { symbol: "NFLX", price: 618.87, change: 1.1 },
  { symbol: "JPM", price: 197.42, change: -0.2 },
  { symbol: "CRM", price: 202.11, change: 0.7 },
];

function randomizeStocks(current) {
  return current.map((stock, index) => {
    const direction = index % 2 === 0 ? 1 : -1;
    const priceDrift = ((index + 1) * 0.13) % 1.4;
    const changeDrift = ((index + 2) * 0.07) % 0.4;
    const nextPrice = Number((stock.price + direction * priceDrift).toFixed(2));
    const nextChange = Number((stock.change + direction * changeDrift).toFixed(2));
    return {
      ...stock,
      price: nextPrice,
      change: nextChange,
    };
  });
}

function StockTicker() {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState(baseStocks);

  useEffect(() => {
    const timer = setInterval(() => {
      setStocks((current) => randomizeStocks(current));
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="ticker-list">
      {stocks.map((stock) => (
        <button
          key={stock.symbol}
          type="button"
          className="ticker-row"
          onClick={() => navigate(`/stock/${stock.symbol}`)}
        >
          <span className="ticker-symbol">{stock.symbol}</span>
          <span className="ticker-price">${stock.price.toFixed(2)}</span>
          <span className={stock.change >= 0 ? "ticker-change positive" : "ticker-change negative"}>
            {stock.change >= 0 ? "+" : ""}
            {stock.change.toFixed(1)}%
          </span>
        </button>
      ))}
    </div>
  );
}

export default StockTicker;
