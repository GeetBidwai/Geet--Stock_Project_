export function generateGrowthData(portfolioValue) {
  const data = [];
  const baseValue = Number(portfolioValue || 0);
  let actualValue = Math.max(baseValue, 1);
  const totalDays = 30;
  const actualDays = 20;
  const actualSeries = [];

  for (let i = 0; i < totalDays; i += 1) {
    const day = `D${i + 1}`;

    if (i < actualDays) {
      const progress = actualDays === 1 ? 1 : i / (actualDays - 1);
      const cyclicalMove = Math.sin(i * 0.55) * baseValue * 0.014;
      const secondaryMove = Math.cos(i * 0.27) * baseValue * 0.009;
      const spike = (((i * 11) % 9) - 4) * baseValue * 0.003;
      const drift = baseValue * (0.002 + progress * 0.0012);

      actualValue = Math.max(
        baseValue * 0.78,
        actualValue + cyclicalMove + secondaryMove + spike + drift,
      );

      const actualPoint = Number(actualValue.toFixed(2));
      actualSeries.push(actualPoint);
      data.push({
        day,
        actual: actualPoint,
        // Seed predicted at the last actual point to create a visual handoff.
        predicted: i === actualDays - 1 ? actualPoint : null,
      });
      continue;
    }

    const recentWindow = Math.min(7, actualSeries.length);
    const startIndex = actualSeries.length - recentWindow;
    const returns = [];
    for (let j = startIndex + 1; j < actualSeries.length; j += 1) {
      const prev = actualSeries[j - 1];
      const curr = actualSeries[j];
      if (prev > 0) {
        returns.push((curr - prev) / prev);
      }
    }

    const meanReturn =
      returns.length === 0
        ? 0
        : returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const variance =
      returns.length === 0
        ? 0
        : returns.reduce((sum, value) => sum + (value - meanReturn) ** 2, 0) /
          returns.length;
    const volatility = Math.sqrt(variance);

    const noise =
      Math.sin(i * 0.6) * volatility +
      Math.cos(i * 0.22) * volatility * 0.6;
    const cappedMean = Math.max(-0.002, Math.min(0.004, meanReturn));
    const cappedNoise = Math.max(-0.006, Math.min(0.006, noise));

    const predictedValue = Math.max(
      actualValue * 0.9,
      actualValue * (1 + cappedMean + cappedNoise),
    );
    actualValue = predictedValue;

    data.push({
      day,
      actual: null,
      predicted: Number(predictedValue.toFixed(2)),
    });
  }

  return data;
}
