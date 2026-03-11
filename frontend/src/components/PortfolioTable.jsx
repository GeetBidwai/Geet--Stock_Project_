import { formatCurrency } from "../charts/portfolioData";

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return Number(value).toFixed(digits);
}

function formatCurrencyOrDash(value, currency) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return formatCurrency(value, currency);
}

function PortfolioTable({ rows, totalValue, onRemove }) {
  if (!rows.length) {
    return <div className="empty-state-card">No positions yet. Create one from the builder above.</div>;
  }

  return (
    <div className="table-card">
      <div className="portfolio-table-wrapper table-wrap">
        <table className="portfolio-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Company</th>
              <th>Quantity</th>
              <th>Prev Close</th>
              <th>Current Price</th>
              <th>P/E Ratio</th>
              <th>Discount %</th>
              <th>Price Change</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.portfolioId}-${row.stockId}`}>
                <td>{row.symbol}</td>
                <td>{row.company}</td>
                <td>{row.quantity}</td>
                <td>{formatCurrencyOrDash(row.buyPrice, row.currency)}</td>
                <td>{formatCurrency(row.currentPrice, row.currency)}</td>
                <td>{formatNumber(row.peRatio)}</td>
                <td>{formatNumber(row.discountPercent)}%</td>
                <td
                  className={
                    row.profitLoss === null || row.profitLoss === undefined || Number.isNaN(row.profitLoss)
                      ? ""
                      : row.profitLoss >= 0
                        ? "profit"
                        : "loss"
                  }
                >
                  {formatCurrencyOrDash(row.profitLoss, row.currency)}
                </td>
                <td>
                  <button
                    type="button"
                    className="remove-chip"
                    onClick={() => onRemove(row)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-total">
        <span>Total Portfolio Value</span>
        <strong>{formatCurrency(totalValue, "USD")}</strong>
      </div>
    </div>
  );
}

export default PortfolioTable;
