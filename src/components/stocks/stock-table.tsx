import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { dailyChange } from "@/lib/data/market-provider";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { StockQuote } from "@/types";

export function StockTable({
  title,
  stocks
}: {
  title: string;
  stocks: StockQuote[];
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Symbol</th>
              <th className="px-5 py-3 font-medium">Company</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => {
              const movement = dailyChange(stock);
              return (
                <tr key={stock.symbol} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-semibold text-ink">
                    <Link href={`/stocks/${stock.symbol}`}>{stock.symbol}</Link>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{stock.companyName}</td>
                  <td className="px-5 py-4">
                    {stock.currentPrice > 0 ? formatCurrency(stock.currentPrice) : "No trade today"}
                  </td>
                  <td className="px-5 py-4">
                    {stock.currentPrice > 0 && stock.previousClose > 0 ? (
                      <Badge positive={movement.delta >= 0} negative={movement.delta < 0}>
                        {formatPercent(movement.deltaPercent)}
                      </Badge>
                    ) : (
                      <span className="text-slate-500">Unavailable</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
