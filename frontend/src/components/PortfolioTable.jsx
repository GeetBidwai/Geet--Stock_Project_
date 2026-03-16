function PortfolioTable({ portfolios, onOpen, onDelete }) {
  if (!portfolios.length) {
    return <div className="empty-state-card">No portfolios yet. Create one from the builder above.</div>;
  }

  return (
    <div className="table-card">
      <div className="portfolio-table-wrapper table-wrap">
        <table className="portfolio-table">
          <thead>
            <tr>
              <th>Portfolio</th>
              <th>Sector</th>
              <th>Holdings</th>
              <th>Average Discount</th>
              <th>Top Pick</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {portfolios.map((portfolio) => (
              <tr key={portfolio.id}>
                <td>{portfolio.name}</td>
                <td>{portfolio.sector || "-"}</td>
                <td>{portfolio.summary?.holdings_count ?? portfolio.stocks?.length ?? 0}</td>
                <td>
                  {portfolio.summary?.average_discount != null
                    ? `${portfolio.summary.average_discount}%`
                    : "-"}
                </td>
                <td>{portfolio.summary?.top_pick?.ticker || "-"}</td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="range-btn"
                      onClick={() => onOpen?.(portfolio.id)}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      className="remove-chip"
                      onClick={() => onDelete?.(portfolio.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PortfolioTable;
