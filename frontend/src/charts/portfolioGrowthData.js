export function generateGrowthData(portfolioValue) {
  const data = [];
  let value = Number(portfolioValue || 0);

  for (let i = 0; i < 30; i += 1) {
    const swing = Math.sin(i / 3.2) * 48;
    const drift = Math.cos(i / 4.7) * 26;
    const randomLikeChange = swing + drift;
    value += randomLikeChange;

    data.push({
      day: i + 1,
      actual: Number(value.toFixed(2)),
      predicted: Number((value * (1 + 0.02 * ((i + 1) / 30))).toFixed(2)),
    });
  }

  return data;
}
