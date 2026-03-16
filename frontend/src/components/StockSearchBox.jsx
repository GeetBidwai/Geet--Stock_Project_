import { useEffect, useState } from "react";
import { getStockSuggestions } from "../services/stockService";

function StockSearchBox({ onSelect }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        setLoading(true);
        const data = await getStockSuggestions(query.trim());
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleChoice = async (item) => {
    await onSelect(item);
    setQuery("");
    setSuggestions([]);
  };

  return (
    <div className="search-wrap">
      <input
        type="text"
        placeholder="Type stock name: Reliance, Infosys, Tata..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <p className="hint-text">India equities only: NSE (.NS) and BSE (.BO).</p>
      {loading && <p className="hint-text">Searching Indian equities...</p>}

      {!!suggestions.length && (
        <ul className="suggestion-list">
          {suggestions.map((item) => (
            <li key={item.symbol}>
              <button
                type="button"
                className="suggestion-item"
                onClick={() => handleChoice(item)}
              >
                <span>{item.name}</span>
                <small>{`${item.symbol} - ${item.exchange}`}</small>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && query.trim().length >= 2 && !suggestions.length ? (
        <p className="hint-text">No Indian equity matches found.</p>
      ) : null}
    </div>
  );
}

export default StockSearchBox;
