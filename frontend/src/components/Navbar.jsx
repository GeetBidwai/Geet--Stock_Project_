import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="top-nav">
      <Link className="brand" to="/">
        StockScope
      </Link>
      <div className="top-nav-links">
        <Link to="/metals">Explore Gold and Silver</Link>
      </div>
    </nav>
  );
}

export default Navbar;
