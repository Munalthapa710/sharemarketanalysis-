import { AnalysisSearch } from "@/components/stocks/analysis-search";
import { marketDataProvider } from "@/lib/data/market-provider";

export default async function AnalysisPage() {
  const initialAnalysis = await marketDataProvider.getAnalysis("NABIL");
  return <AnalysisSearch initialAnalysis={initialAnalysis} />;
}
