import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/Home";
import MetalsPage from "./pages/Metals";
import PortfolioPage from "./pages/Portfolio";
import StockDetailsPage from "./pages/StockDetails";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/metals" element={<MetalsPage />} />
      <Route path="/portfolio/:portfolioId" element={<PortfolioPage />} />
      <Route
        path="/portfolio/:portfolioId/stock/:stockId"
        element={<StockDetailsPage />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
