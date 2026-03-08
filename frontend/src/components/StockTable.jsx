function formatValue(value, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return `${value}${suffix}`;
}

function StockTable({ stocks, onRemove, onStockClick }) {
  if (!stocks.length) {
    return <p className="empty-state">No stocks added yet.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Stock</th>
            <th>Symbol</th>
            <th>Sector</th>
            <th>Current Price</th>
            <th>P/E Ratio</th>
            <th>Min Price (1Y)</th>
            <th>Max Price (1Y)</th>
            <th>Discount %</th>
            <th>Opportunity Score</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => (
            <tr
              key={stock.id}
              className="stock-row"
              onClick={() => onStockClick?.(stock.id)}
            >
              <td>{stock.name}</td>
              <td>{stock.ticker || stock.stock_id}</td>
              <td>{stock.sector || "-"}</td>
              <td>{formatValue(stock.current_price)}</td>
              <td>{formatValue(stock.pe_ratio)}</td>
              <td>{formatValue(stock.min_price)}</td>
              <td>{formatValue(stock.max_price)}</td>
              <td>{formatValue(stock.discount_percentage, "%")}</td>
              <td>{formatValue(stock.opportunity_score)}</td>
              <td>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove(stock.id);
                  }}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StockTable;
