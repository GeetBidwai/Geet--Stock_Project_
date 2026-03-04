import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logoutUser } = useAuth();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <nav className="top-nav">
      <Link className="brand" to="/">
        StockScope
      </Link>
      <div className="top-nav-links">
        {isAuthenticated && <Link to="/metals">Explore Gold and Silver</Link>}
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
