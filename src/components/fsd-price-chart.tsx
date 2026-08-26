import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fsdPriceHistory } from "@/data/research";
import { useLocale } from "@/lib/i18n";

export function FsdPriceChart() {
  const locale = useLocale();

  return (
    <div className="h-80 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6">
      <p className="mb-4 text-xs font-medium tracking-wide text-muted uppercase">
        {locale === "de"
          ? "FSD-Paketpreis (USD, öffentlich)"
          : "FSD package price (USD, public)"}
      </p>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={fsdPriceHistory} margin={{ left: 8, right: 8, top: 8 }}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="var(--color-faint)"
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="var(--color-faint)"
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${v / 1000}k`}
            width={44}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-fg)",
            }}
            formatter={(value) => [
              `$${Number(value).toLocaleString()}`,
              locale === "de" ? "Preis" : "Price",
            ]}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-accent)", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
