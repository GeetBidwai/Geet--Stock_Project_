import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function ProfitLossChart({ data }) {
  const chartData = data.map((item) => ({
    ...item,
    profit_loss: item.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={["auto", "auto"]} />
        <Tooltip formatter={(value) => `$${value}`} />
        <Bar dataKey="profit_loss" fill="#2563eb" minPointSize={5} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default ProfitLossChart;
