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

      {loading && <p className="hint-text">Searching...</p>}

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
                <small>
                  {item.symbol} {item.exchange ? `- ${item.exchange}` : ""}
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default StockSearchBox;
