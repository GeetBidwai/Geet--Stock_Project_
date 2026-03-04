import http from "./http";

export async function getStockSuggestions(query) {
  const response = await http.get("/stocks/suggest/", {
    params: { q: query },
  });
  return response.data;
}

export async function addStockToPortfolio(portfolioId, stockChoice) {
  const response = await http.post(`/portfolios/${portfolioId}/stocks/`, {
    symbol: stockChoice.symbol,
    name: stockChoice.name,
    sector: stockChoice.sector || "",
  });
  return response.data;
}

export async function removeStockFromPortfolio(portfolioId, stockId) {
  await http.delete(`/portfolios/${portfolioId}/stocks/${stockId}/`);
}

export async function getStockDetails(portfolioId, stockId, range = "1mo") {
  const response = await http.get(`/portfolios/${portfolioId}/stocks/${stockId}/`, {
    params: { range },
  });
  return response.data;
}
