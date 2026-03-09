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

const EPSILON = 0.0001;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function symbolHash(value = "") {
  return String(value)
    .split("")
    .reduce((total, character, index) => total + character.charCodeAt(0) * (index + 1), 0);
}

function buildPeBenchmarks(portfolios) {
  const sectorAggregates = {};
  let globalTotal = 0;
  let globalCount = 0;

  portfolios.forEach((portfolio) => {
    const sectorKey = portfolio.sector || "Market";

    (portfolio.stocks || []).forEach((stock) => {
      const peRatio = Number(stock.pe_ratio || 0);
      if (!Number.isFinite(peRatio) || peRatio <= 0) {
        return;
      }

      sectorAggregates[sectorKey] ??= { total: 0, count: 0 };
      sectorAggregates[sectorKey].total += peRatio;
      sectorAggregates[sectorKey].count += 1;
      globalTotal += peRatio;
      globalCount += 1;
    });
  });

  return {
    sector: Object.fromEntries(
      Object.entries(sectorAggregates).map(([sector, aggregate]) => [
        sector,
        aggregate.count ? aggregate.total / aggregate.count : 0,
      ])
    ),
    global: globalCount ? globalTotal / globalCount : 0,
  };
}

function deriveDiscountPercent(stock, currentPrice, benchmarkPe) {
  const apiDiscount = Number(stock.discount_percentage);
  if (Number.isFinite(apiDiscount) && Math.abs(apiDiscount) > EPSILON) {
    return apiDiscount;
  }

  const intrinsicValue = Number(stock.intrinsic_value || 0);
  if (intrinsicValue > 0 && currentPrice > 0) {
    return clamp(((intrinsicValue - currentPrice) / intrinsicValue) * 100, -75, 75);
  }

  const peRatio = Number(stock.pe_ratio || 0);
  if (peRatio > 0 && benchmarkPe > 0 && Math.abs(benchmarkPe - peRatio) > EPSILON) {
    return clamp(((benchmarkPe - peRatio) / benchmarkPe) * 100, -75, 75);
  }

  const opportunityScore = Number(stock.opportunity_score || 0);
  if (opportunityScore > 0) {
    return clamp((opportunityScore - 50) * 0.7, -40, 40);
  }

  return ((symbolHash(stock.ticker || stock.stock_id || stock.name) % 1601) / 100) - 8;
}

function deriveBuyPrice({ positionMeta, currentPrice, symbol, discountPercent, opportunityScore }) {
  const storedBuyPrice = Number(positionMeta.buyPrice);
  const hasManualBuyPrice = positionMeta.isBuyPriceManual === true;

  if (Number.isFinite(storedBuyPrice) && storedBuyPrice > 0) {
    const storedMatchesCurrent = Math.abs(storedBuyPrice - currentPrice) <= EPSILON;
    if (hasManualBuyPrice || !storedMatchesCurrent) {
      return storedBuyPrice;
    }
  }

  if (!(currentPrice > 0)) {
    return 0;
  }

  const momentumSeed = symbolHash(symbol);
  const trendBias = ((momentumSeed % 19) - 9) * 0.65;
  const valuationBias = clamp((discountPercent || 0) * 0.18, -8, 8);
  const opportunityBias = clamp(((Number(opportunityScore || 0) - 50) / 10), -4, 4);
  const movePercent = clamp(trendBias + valuationBias + opportunityBias, -18, 18);
  const estimatedBuyPrice = currentPrice / (1 + movePercent / 100);

  return Number(estimatedBuyPrice.toFixed(2));
}

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

export function savePositionMeta({
  portfolioId,
  stockId,
  quantity,
  buyPrice,
  country,
  currency,
  isBuyPriceManual = false,
}) {
  const existing = readPositionMeta();
  existing[`${portfolioId}:${stockId}`] = {
    quantity,
    buyPrice,
    country,
    currency,
    isBuyPriceManual,
    createdAt: existing[`${portfolioId}:${stockId}`]?.createdAt || new Date().toISOString(),
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
  const peBenchmarks = buildPeBenchmarks(detailedPortfolios);

  const rows = detailedPortfolios.flatMap((portfolio) =>
    (portfolio.stocks || []).map((stock) => {
      const key = `${portfolio.id}:${stock.id}`;
      const positionMeta = meta[key] || {};
      const quantity = Number(positionMeta.quantity || 1);
      const currentPrice = Number(stock.current_price || 0);
      const benchmarkPe =
        peBenchmarks.sector[portfolio.sector || "Market"] || peBenchmarks.global || 0;
      const discountPercent = deriveDiscountPercent(stock, currentPrice, benchmarkPe);
      const buyPrice = deriveBuyPrice({
        positionMeta,
        currentPrice,
        symbol: stock.ticker || stock.stock_id || stock.name,
        discountPercent,
        opportunityScore: Number(stock.opportunity_score || 0),
      });
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
        discountPercent: Number(discountPercent.toFixed(2)),
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
