import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "../charts/portfolioData";

function PortfolioGrowth({ data }) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={data} margin={{ top: 12, right: 16, left: 12, bottom: 12 }}>
        <CartesianGrid stroke="#dbe3ee" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={{ stroke: "#cbd5e1" }}
          minTickGap={16}
        />
        <YAxis
          domain={["auto", "auto"]}
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={{ stroke: "#cbd5e1" }}
          tickFormatter={(value) => `Rs ${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          width={86}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          labelFormatter={(label) => `Period: ${label}`}
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#1d4ed8"
          strokeWidth={3}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="predicted"
          stroke="#0f766e"
          strokeDasharray="6 6"
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default PortfolioGrowth;
