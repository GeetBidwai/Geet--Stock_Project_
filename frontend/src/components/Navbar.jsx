import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const navItems = [
  { label: "Home", to: "/" },
  { label: "My Dashboard", to: "/dashboard" },
  { label: "Growth", to: "/growth" },
  { label: "ML Analysis", to: "/ml-analysis" },
  { label: "Gold/Silver", to: "/gold-silver" },
  { label: "Bitcoin", to: "/bitcoin" },
  { label: "Compare", to: "/compare" },
];

function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logoutUser } = useAuth();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <NavLink className="navbar-brand" to="/">
        TradeVista
      </NavLink>

      <div className="navbar-links">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "navbar-link is-active" : "navbar-link"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="navbar-actions">
        {user ? <span className="navbar-user">{user.username}</span> : null}
        {isAuthenticated ? (
          <button
            type="button"
            className="navbar-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        ) : (
          <NavLink className="navbar-login" to="/login">
            Login
          </NavLink>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
