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

export async function deletePortfolio(portfolioId) {
  await http.delete(`/portfolios/${portfolioId}/`);
}

export async function getDashboardSummary() {
  const response = await http.get("/dashboard/summary/");
  return response.data;
}

export async function getPortfolioTopDiscount(portfolioId) {
  const response = await http.get(`/portfolios/${portfolioId}/top-discount/`);
  return response.data;
}

export async function getPortfolioTopGrowth(portfolioId, range = "1mo") {
  const response = await http.get(`/portfolios/${portfolioId}/top-growth/`, {
    params: { range },
  });
  return response.data;
}

export async function getPortfolioRiskClusters(portfolioId) {
  const response = await http.get(`/portfolios/${portfolioId}/risk-clusters/`);
  return response.data;
}
