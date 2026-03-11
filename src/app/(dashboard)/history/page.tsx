import { Card, Badge } from "@/components/ui";
import { getHistoryData } from "@/lib/server-data";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function HistoryPage() {
  const { history } = await getHistoryData();

  return (
    <Card className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Prediction History</h1>
        <p className="text-sm text-slate-500">Compare prior analysis output with the latest market path.</p>
      </div>

      <div className="space-y-3">
        {history.length ? (
          history.map((item) => (
            <div key={item.id} className="rounded-3xl bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-ink">{item.symbol}</p>
                  <p className="text-sm text-slate-500">{item.companyName}</p>
                </div>
                <Badge positive={item.rupeeMove >= 0} negative={item.rupeeMove < 0}>
                  {item.recommendation}
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <Stat label="Current Price" value={formatCurrency(item.currentPrice)} />
                <Stat label="Predicted Price" value={formatCurrency(item.predictedPrice)} />
                <Stat label="Expected Change" value={formatPercent(item.expectedChange)} />
                <Stat label="Timeframe" value={item.timeframeLabel} />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No saved analyses yet.</p>
        )}
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}
