import Link from "next/link";
import { Card, Badge } from "@/components/ui";
import { getWatchlistData } from "@/lib/server-data";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function WatchlistPage() {
  const { enriched } = await getWatchlistData();

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-100 px-5 py-4">
        <h1 className="text-2xl font-semibold text-ink">Watchlist</h1>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Symbol</th>
              <th className="px-5 py-3 font-medium">Recommendation</th>
              <th className="px-5 py-3 font-medium">Current Price</th>
              <th className="px-5 py-3 font-medium">Target Price</th>
              <th className="px-5 py-3 font-medium">Rupee Move</th>
              <th className="px-5 py-3 font-medium">Timeframe</th>
            </tr>
          </thead>
          <tbody>
            {enriched.map(({ item, analysis }) => (
              <tr className="border-t border-slate-100" key={item.id}>
                <td className="px-5 py-4 font-semibold text-ink">
                  <Link href={`/stocks/${item.symbol}`}>{item.symbol}</Link>
                </td>
                <td className="px-5 py-4">
                  {analysis ? (
                    <Badge positive={analysis.rupeeMove >= 0} negative={analysis.rupeeMove < 0}>
                      {analysis.recommendation}
                    </Badge>
                  ) : (
                    "Unavailable"
                  )}
                </td>
                <td className="px-5 py-4">
                  {analysis ? formatCurrency(analysis.currentPrice) : "Unavailable"}
                </td>
                <td className="px-5 py-4">
                  {analysis ? formatCurrency(analysis.predictedPrice) : "Unavailable"}
                </td>
                <td className="px-5 py-4">
                  {analysis ? formatPercent(analysis.percentageMove) : "Unavailable"}
                </td>
                <td className="px-5 py-4">{analysis?.timeframe ?? "Unavailable"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
