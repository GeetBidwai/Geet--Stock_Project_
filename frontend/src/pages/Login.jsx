import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, loginUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      await loginUser({ username, password });
      navigate("/dashboard");
    } catch (requestError) {
      if (requestError?.code === "ERR_NETWORK" || !requestError?.response) {
        setError("Backend unavailable. Start the Django server and try again.");
      } else if (requestError.response?.status === 400 || requestError.response?.status === 401) {
        setError("Invalid credentials.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="tv-card auth-card">
        <p className="eyebrow">Secure Login</p>
        <h1>Welcome Back</h1>
        <p className="section-copy">
          Sign in to manage portfolios, growth projections, and ML analytics.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email / Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter email or username"
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
            />
          </label>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          {error ? <p className="error-text">{error}</p> : null}
        </form>
        <p className="hint-text">
          New user? <Link to="/signup">Create account</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
