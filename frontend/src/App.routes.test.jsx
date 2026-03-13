import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { AuthContext } from "./context/context";

vi.mock("./pages/Home", () => ({ default: () => <div>HOME_PAGE</div> }));
vi.mock("./pages/Login", () => ({ default: () => <div>LOGIN_PAGE</div> }));
vi.mock("./pages/Signup", () => ({ default: () => <div>SIGNUP_PAGE</div> }));
vi.mock("./pages/Dashboard", () => ({ default: () => <div>DASHBOARD_PAGE</div> }));
vi.mock("./pages/Growth", () => ({ default: () => <div>GROWTH_PAGE</div> }));
vi.mock("./pages/MLAnalysis", () => ({ default: () => <div>ML_PAGE</div> }));
vi.mock("./pages/GoldSilver", () => ({ default: () => <div>METALS_PAGE</div> }));
vi.mock("./pages/Bitcoin", () => ({ default: () => <div>BITCOIN_PAGE</div> }));
vi.mock("./pages/Compare", () => ({ default: () => <div>COMPARE_PAGE</div> }));
vi.mock("./pages/Portfolio", () => ({ default: () => <div>PORTFOLIO_PAGE</div> }));
vi.mock("./pages/StockDetails", () => ({ default: () => <div>STOCK_DETAILS_PAGE</div> }));

function renderApp(path, isAuthenticated) {
  const authValue = {
    user: isAuthenticated ? { username: "demo" } : null,
    isAuthenticated,
    signupUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
    hydrateUser: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("App protected routes", () => {
  it("allows unauthenticated users on public routes", () => {
    renderApp("/", false);
    expect(screen.getByText("HOME_PAGE")).toBeInTheDocument();
  });

  it("redirects unauthenticated users from /dashboard to /login", () => {
    renderApp("/dashboard", false);
    expect(screen.getByText("LOGIN_PAGE")).toBeInTheDocument();
    expect(screen.queryByText("DASHBOARD_PAGE")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users from /stock/:stockId to /login", () => {
    renderApp("/stock/123", false);
    expect(screen.getByText("LOGIN_PAGE")).toBeInTheDocument();
    expect(screen.queryByText("STOCK_DETAILS_PAGE")).not.toBeInTheDocument();
  });

  it("allows authenticated users on /stock/:stockId", () => {
    renderApp("/stock/123", true);
    expect(screen.getByText("STOCK_DETAILS_PAGE")).toBeInTheDocument();
  });
});
