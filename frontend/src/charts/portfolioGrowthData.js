export function generateGrowthData(portfolioValue) {
  const data = [];
  const baseValue = Number(portfolioValue || 0);
  let actualValue = Math.max(baseValue, 1);

  for (let i = 0; i < 30; i += 1) {
    const progress = i / 29;
    const cyclicalMove = Math.sin(i * 0.55) * baseValue * 0.014;
    const secondaryMove = Math.cos(i * 0.27) * baseValue * 0.009;
    const spike = (((i * 11) % 9) - 4) * baseValue * 0.003;
    const drift = baseValue * 0.0025;
    actualValue = Math.max(baseValue * 0.78, actualValue + cyclicalMove + secondaryMove + spike + drift);
    const predictedValue = actualValue * (1 + 0.018 + progress * 0.02);

    data.push({
      day: `D${i + 1}`,
      actual: Number(actualValue.toFixed(2)),
      predicted: Number(predictedValue.toFixed(2)),
    });
  }

  return data;
}
