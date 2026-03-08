import http from "./http";

export async function getStockSuggestions(query) {
  const response = await http.get("/stocks/search/", {
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
  if (portfolioId) {
    await http.delete(`/portfolios/${portfolioId}/stocks/${stockId}/`);
    return;
  }
  await http.delete(`/stocks/${stockId}/`);
}

export async function getStockDetails(portfolioId, stockId, range = "1mo") {
  const targetUrl = portfolioId
    ? `/portfolios/${portfolioId}/stocks/${stockId}/`
    : `/stocks/${stockId}/history/`;
  const response = await http.get(targetUrl, {
    params: { range },
  });
  return response.data;
}
