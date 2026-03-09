import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { generateGrowthData } from "../charts/portfolioGrowthData";

function PortfolioGrowth({ portfolioValue }) {
  const growthData = generateGrowthData(portfolioValue);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={growthData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis domain={["auto", "auto"]} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#2563eb"
          strokeWidth={3}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="predicted"
          stroke="#10b981"
          strokeDasharray="5 5"
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default PortfolioGrowth;
