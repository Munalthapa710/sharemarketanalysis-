import { notFound } from "next/navigation";
import { AnalysisSummary } from "@/components/stocks/analysis-summary";
import { PriceChart } from "@/components/charts/price-chart";
import { ExplanationCard } from "@/components/stocks/explanation-card";
import { IndicatorGrid } from "@/components/stocks/indicator-grid";
import { marketDataProvider } from "@/lib/data/market-provider";

export default async function StockDetailsPage({
  params
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const analysis = await marketDataProvider.getAnalysis(symbol);

  if (!analysis) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <AnalysisSummary analysis={analysis} canToggleWatchlist />
      <div className="grid gap-4 xl:grid-cols-2">
        <PriceChart data={analysis.historicalChart} dataKey="close" title="Historical Chart" />
        <PriceChart
          data={analysis.predictionChart}
          dataKey="predictedClose"
          title="Prediction Chart"
          color="#bf8b30"
        />
      </div>
      <IndicatorGrid indicators={analysis.indicators} />
      <ExplanationCard simple={analysis.simpleExplanation} advanced={analysis.advancedExplanation} />
    </div>
  );
}
