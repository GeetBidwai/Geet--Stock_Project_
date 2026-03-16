import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import BitcoinPage from "./pages/Bitcoin";
import ComparePage from "./pages/Compare";
import DashboardPage from "./pages/Dashboard";
import GoldSilverPage from "./pages/GoldSilver";
import GrowthPage from "./pages/Growth";
import HomePage from "./pages/Home";
import LoginPage from "./pages/Login";
import PortfolioPage from "./pages/Portfolio";
import SignupPage from "./pages/Signup";
import StockDetailsPage from "./pages/StockDetails";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/growth"
        element={
          <ProtectedRoute>
            <GrowthPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ml-analysis"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gold-silver"
        element={
          <ProtectedRoute>
            <GoldSilverPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bitcoin"
        element={
          <ProtectedRoute>
            <BitcoinPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/compare"
        element={
          <ProtectedRoute>
            <ComparePage />
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
      <Route path="/features" element={<Navigate to="/dashboard" replace />} />
      <Route path="/metals" element={<Navigate to="/gold-silver" replace />} />
      <Route path="/crypto" element={<Navigate to="/bitcoin" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
