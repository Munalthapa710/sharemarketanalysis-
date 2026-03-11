import { SummaryCard } from "@/components/dashboard/summary-card";
import { PriceChart } from "@/components/charts/price-chart";
import { StockTable } from "@/components/stocks/stock-table";
import { Card } from "@/components/ui";
import { marketDataBot } from "@/lib/data/market-bot";
import { getDashboardData } from "@/lib/server-data";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const { summary, watchlistItems, analyses } = await getDashboardData();
  const liveSnapshot = await marketDataBot.snapshot();
  const breadthData = [
    { date: "Advancers", close: summary.marketBreadth.advancers },
    { date: "Decliners", close: summary.marketBreadth.decliners },
    { date: "Unchanged", close: summary.marketBreadth.unchanged }
  ];
  const distributionData = Object.entries(summary.recommendationDistribution).map(([date, close]) => ({
    date,
    close
  }));

  return (
    <div className="space-y-4">
      <div className="grid-cards">
        <SummaryCard label="Watchlist Items" value={String(watchlistItems.length)} change={8.2} positive />
        <SummaryCard label="Recent Analyses" value={String(analyses.length)} change={4.6} positive />
        <SummaryCard label="Trending Volume" value={formatCompactNumber(summary.trending[0]?.volume ?? 0)} change={6.3} positive />
        <SummaryCard label="Lead Gainer" value={formatCurrency(summary.topGainers[0]?.currentPrice ?? 0)} change={3.4} positive />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PriceChart data={breadthData} dataKey="close" title="Market Breadth Snapshot" />
        <PriceChart data={distributionData} dataKey="close" title="Recommendation Distribution" color="#0d1f1d" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <StockTable title="Top Gainers" stocks={summary.topGainers} />
        <StockTable title="Top Losers" stocks={summary.topLosers} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-ink">Recent Prediction History</h3>
          <div className="space-y-3">
            {analyses.length ? (
              analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-ink">{analysis.symbol}</p>
                    <p className="text-sm text-slate-500">{analysis.recommendation}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ink">{formatCurrency(analysis.predictedPrice)}</p>
                    <p className="text-sm text-slate-500">{analysis.timeframeLabel}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No prediction history yet. Run an analysis to populate this view.</p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-ink">Watchlist Summary</h3>
          <div className="space-y-3">
            {watchlistItems.length ? (
              watchlistItems.map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-ink">{item.symbol}</p>
                  <p className="text-sm text-slate-500">{item.companyName}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Your watchlist is empty.</p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-ink">Live Data Bot</h3>
            <p className="text-sm text-slate-500">
              Multi-source scrape status for current market enrichment.
            </p>
          </div>
          <div className="text-sm text-slate-600">
            {liveSnapshot.quoteCount} quotes · {liveSnapshot.sources.join(", ") || "fallback only"}
          </div>
        </div>
        {liveSnapshot.errors.length ? (
          <p className="mt-3 text-sm text-amber-700">{liveSnapshot.errors.join(" | ")}</p>
        ) : (
          <p className="mt-3 text-sm text-emerald-700">Live scrapers responded and cache is active.</p>
        )}
      </Card>
    </div>
  );
}
