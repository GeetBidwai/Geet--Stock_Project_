import { getPortfolioById, getPortfolios } from "../services/portfolioService";

const POSITION_STORAGE_KEY = "tradevista_position_meta";

export const countryCurrencyMap = {
  USA: "USD",
  India: "INR",
  UK: "GBP",
};

const currencyFormatters = {
  USD: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }),
  INR: new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }),
  GBP: new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }),
};

function readPositionMeta() {
  try {
    return JSON.parse(localStorage.getItem(POSITION_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writePositionMeta(value) {
  localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(value));
}

export function formatCurrency(value, currency = "USD") {
  const numericValue = Number(value || 0);
  return (currencyFormatters[currency] || currencyFormatters.USD).format(numericValue);
}

export function savePositionMeta({ portfolioId, stockId, quantity, buyPrice, country, currency }) {
  const existing = readPositionMeta();
  existing[`${portfolioId}:${stockId}`] = {
    quantity,
    buyPrice,
    country,
    currency,
  };
  writePositionMeta(existing);
}

export function removePositionMeta(portfolioId, stockId) {
  const existing = readPositionMeta();
  delete existing[`${portfolioId}:${stockId}`];
  writePositionMeta(existing);
}

export async function loadPortfolioDataset() {
  const portfolios = await getPortfolios();
  const meta = readPositionMeta();

  const detailedPortfolios = await Promise.all(
    portfolios.map(async (portfolio) => {
      try {
        return await getPortfolioById(portfolio.id);
      } catch {
        return { ...portfolio, stocks: [], summary: {} };
      }
    })
  );

  const rows = detailedPortfolios.flatMap((portfolio) =>
    (portfolio.stocks || []).map((stock) => {
      const key = `${portfolio.id}:${stock.id}`;
      const positionMeta = meta[key] || {};
      const quantity = Number(positionMeta.quantity || 1);
      const currentPrice = Number(stock.current_price || 0);
      const buyPrice = Number(positionMeta.buyPrice ?? stock.current_price ?? 0);
      const currency = positionMeta.currency || "USD";
      const profitLoss = (currentPrice - buyPrice) * quantity;
      const positionValue = currentPrice * quantity;

      return {
        portfolioId: portfolio.id,
        portfolioName: portfolio.name,
        sector: portfolio.sector,
        stockId: stock.id,
        symbol: stock.ticker || stock.stock_id,
        company: stock.name,
        quantity,
        buyPrice,
        currentPrice,
        peRatio: Number(stock.pe_ratio || 0),
        discountPercent: Number(stock.discount_percentage || 0),
        opportunityScore: Number(stock.opportunity_score || 0),
        profitLoss,
        positionValue,
        currency,
        country: positionMeta.country || "USA",
        marketCap: stock.market_cap,
      };
    })
  );

  const totalValue = rows.reduce((sum, row) => sum + row.positionValue, 0);

  return {
    portfolios: detailedPortfolios,
    rows,
    totalValue,
  };
}

export function buildPredictionSeries(rows) {
  const currentValue = rows.reduce((sum, row) => sum + row.positionValue, 0);
  const performanceFactor =
    rows.length > 0
      ? rows.reduce((sum, row) => sum + row.opportunityScore, 0) / rows.length
      : 0;

  const projectedValue = currentValue * (1 + performanceFactor / 250);

  return [
    { period: "Current", actual: Number(currentValue.toFixed(2)), predicted: Number(currentValue.toFixed(2)) },
    { period: "30D", actual: Number((currentValue * 1.02).toFixed(2)), predicted: Number((projectedValue * 0.98).toFixed(2)) },
    { period: "60D", actual: Number((currentValue * 1.04).toFixed(2)), predicted: Number(projectedValue.toFixed(2)) },
    { period: "90D", actual: Number((currentValue * 1.05).toFixed(2)), predicted: Number((projectedValue * 1.03).toFixed(2)) },
  ];
}
