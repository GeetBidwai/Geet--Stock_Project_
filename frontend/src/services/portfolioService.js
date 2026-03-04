import http from "./http";

export async function getPortfolios() {
  const response = await http.get("/portfolios/");
  return response.data;
}

export async function createPortfolio(payload) {
  const response = await http.post("/portfolios/", payload);
  return response.data;
}

export async function getPortfolioById(portfolioId) {
  const response = await http.get(`/portfolios/${portfolioId}/`);
  return response.data;
}
