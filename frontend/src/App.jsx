import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import CryptoPage from "./pages/Crypto";
import FeaturesPage from "./pages/Features";
import LandingPage from "./pages/Home";
import LoginPage from "./pages/Login";
import MetalsPage from "./pages/Metals";
import PortfolioPage from "./pages/Portfolio";
import StockDetailsPage from "./pages/StockDetails";
import SignupPage from "./pages/Signup";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <LandingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/metals"
        element={
          <ProtectedRoute>
            <MetalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portfolio/:portfolioId"
        element={
          <ProtectedRoute>
            <PortfolioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portfolio/:portfolioId/stock/:stockId"
        element={
          <ProtectedRoute>
            <StockDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock/:stockId"
        element={
          <ProtectedRoute>
            <StockDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/crypto"
        element={
          <ProtectedRoute>
            <CryptoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/features"
        element={
          <ProtectedRoute>
            <FeaturesPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
