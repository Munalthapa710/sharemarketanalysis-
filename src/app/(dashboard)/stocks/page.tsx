import { StockTable } from "@/components/stocks/stock-table";
import { Card } from "@/components/ui";
import { marketDataProvider } from "@/lib/data/market-provider";

export default async function StocksPage() {
  const stocks = await marketDataProvider.listStocks();

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-semibold text-ink">All Shares</h1>
        <p className="text-sm text-slate-500">
          Browse the locally modeled NEPSE universe by symbol or company name.
        </p>
        <p className="mt-2 text-sm font-medium text-ink">{stocks.length} shares available in the current dataset</p>
      </Card>
      <StockTable title="NEPSE Shares" stocks={stocks} />
    </div>
  );
}
