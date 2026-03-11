import { Card } from "@/components/ui";
import type { TechnicalIndicators } from "@/types";

const fields: Array<{ key: keyof TechnicalIndicators; label: string }> = [
  { key: "sma20", label: "SMA 20" },
  { key: "sma50", label: "SMA 50" },
  { key: "ema12", label: "EMA 12" },
  { key: "ema26", label: "EMA 26" },
  { key: "rsi14", label: "RSI 14" },
  { key: "macd", label: "MACD" },
  { key: "signal", label: "Signal" },
  { key: "histogram", label: "Histogram" },
  { key: "bollingerUpper", label: "BB Upper" },
  { key: "bollingerMiddle", label: "BB Middle" },
  { key: "bollingerLower", label: "BB Lower" },
  { key: "support", label: "Support" },
  { key: "resistance", label: "Resistance" },
  { key: "momentum", label: "Momentum" },
  { key: "volatility", label: "Volatility" },
  { key: "trendSlope", label: "Trend Slope" },
  { key: "volumeTrend", label: "Volume Trend %" }
];

export function IndicatorGrid({ indicators }: { indicators: TechnicalIndicators }) {
  return (
    <Card>
      <h3 className="mb-4 text-lg font-semibold text-ink">Technical Indicators</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((field) => (
          <div key={field.key} className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{field.label}</p>
            <p className="mt-2 text-lg font-semibold text-ink">
              {Number(indicators[field.key]).toFixed(field.key === "trendSlope" ? 3 : 2)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
