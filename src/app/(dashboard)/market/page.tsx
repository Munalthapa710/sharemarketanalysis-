import { PriceChart } from "@/components/charts/price-chart";
import { StockTable } from "@/components/stocks/stock-table";
import { Card } from "@/components/ui";
import { marketDataProvider } from "@/lib/data/market-provider";

export default async function MarketPage() {
  const summary = await marketDataProvider.getMarketSummary();
  const breadthChart = [
    { date: "Advancers", close: summary.marketBreadth.advancers },
    { date: "Decliners", close: summary.marketBreadth.decliners },
    { date: "Unchanged", close: summary.marketBreadth.unchanged }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-semibold text-ink">Market Overview</h1>
        <p className="text-sm text-slate-500">
          Top movers, breadth, and trading participation for the current mock NEPSE universe.
        </p>
      </Card>
      <PriceChart data={breadthChart} dataKey="close" title="Breadth Breakdown" />
      <div className="grid gap-4 xl:grid-cols-2">
        <StockTable title="Trending Stocks" stocks={summary.trending} />
        <StockTable title="Most Searched" stocks={summary.recentSearches} />
      </div>
    </div>
  );
}
