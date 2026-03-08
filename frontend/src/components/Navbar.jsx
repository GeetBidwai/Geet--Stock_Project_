import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logoutUser } = useAuth();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <nav className="top-nav">
      <Link className="brand" to="/dashboard">
        StockScope
      </Link>
      <div className="top-nav-links">
        {isAuthenticated && <Link to="/dashboard">Dashboard</Link>}
        {isAuthenticated && <Link to="/features">Features</Link>}
        {isAuthenticated && <Link to="/metals">Explore Gold and Silver</Link>}
        {isAuthenticated && <Link to="/crypto">Crypto Forecast</Link>}
        {user && <span className="nav-user">{user.username}</span>}
        {isAuthenticated && (
          <button type="button" className="nav-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
