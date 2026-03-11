import { Card, Badge } from "@/components/ui";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { AnalysisResult } from "@/types";
import { WatchlistToggle } from "@/components/stocks/watchlist-toggle";

export function AnalysisSummary({
  analysis,
  canToggleWatchlist = false
}: {
  analysis: AnalysisResult;
  canToggleWatchlist?: boolean;
}) {
  const positive = analysis.rupeeMove >= 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{analysis.symbol}</p>
            <h1 className="text-3xl font-semibold text-ink">{analysis.companyName}</h1>
            <p className="mt-1 text-sm text-slate-500">{analysis.sector}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <Badge positive={positive} negative={!positive}>
              {analysis.recommendation}
            </Badge>
            {canToggleWatchlist ? <WatchlistToggle symbol={analysis.symbol} /> : null}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Current Price" value={formatCurrency(analysis.currentPrice)} />
          <Metric label="Predicted Price" value={formatCurrency(analysis.predictedPrice)} />
          <Metric label="Rupee Move" value={`${positive ? "+" : ""}${formatCurrency(analysis.rupeeMove)}`} />
          <Metric label="Expected Change" value={formatPercent(analysis.percentageMove)} />
        </div>
      </Card>

      <Card className="space-y-4">
        <Metric label="Target Timeframe" value={analysis.timeframe} />
        <Metric label="Estimated Target Date" value={analysis.estimatedTargetDate ?? "Scenario-based"} />
        <Metric label="Confidence" value={`${analysis.confidence.toFixed(0)}%`} />
        <Metric label="Risk Note" value={analysis.riskNote} compact />
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  compact
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={compact ? "text-sm font-medium text-ink" : "text-xl font-semibold text-ink"}>{value}</p>
    </div>
  );
}
