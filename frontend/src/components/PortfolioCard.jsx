import { Link } from "react-router-dom";

function PortfolioCard({ portfolio }) {
  return (
    <Link className="portfolio-card" to={`/portfolio/${portfolio.id}`}>
      <p className="card-label">Portfolio</p>
      <h3>{portfolio.name}</h3>
      <p className="card-sector">{portfolio.sector}</p>
      <span className="card-action">Open portfolio</span>
    </Link>
  );
}

export default PortfolioCard;
