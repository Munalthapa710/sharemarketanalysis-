import { analyzeStock } from "@/lib/analysis/engine";
import { getRealHistory } from "@/lib/data/historical-provider";

const symbols = ["NABIL", "ADBL", "NICA", "NTC", "SHIVM"];
const sectors: Record<string, string> = {
  NABIL: "Banking",
  ADBL: "Banking",
  NICA: "Banking",
  NTC: "Telecommunications",
  SHIVM: "Manufacturing"
};

async function main() {
  const rows = [];

  for (const symbol of symbols) {
    const history = await getRealHistory(symbol, 420);
    if (history.length < 90) {
      rows.push({
        symbol,
        sampleSize: 0,
        directionalAccuracy: null,
        meanAbsoluteErrorPercent: null,
        confidence: null,
        note: "Insufficient history"
      });
      continue;
    }

    const analysis = analyzeStock({
      symbol,
      companyName: symbol,
      sector: sectors[symbol] ?? "Other",
      currentPrice: history.at(-1)?.close ?? 0,
      previousClose: history.at(-2)?.close ?? history.at(-1)?.close ?? 0,
      volume: history.at(-1)?.volume ?? 0,
      history
    });

    rows.push({
      symbol,
      sampleSize: analysis.backtest.sampleSize,
      directionalAccuracy: analysis.backtest.directionalAccuracy,
      meanAbsoluteErrorPercent: analysis.backtest.meanAbsoluteErrorPercent,
      biasPercent: analysis.backtest.biasPercent,
      confidence: analysis.confidence,
      recommendation: analysis.recommendation
    });
  }

  const valid = rows.filter(
    (row): row is Extract<(typeof rows)[number], { directionalAccuracy: number; meanAbsoluteErrorPercent: number }> =>
      typeof row.directionalAccuracy === "number" && typeof row.meanAbsoluteErrorPercent === "number"
  );

  const summary = valid.length
    ? {
        sampleSymbols: valid.length,
        averageDirectionalAccuracy:
          valid.reduce((sum, row) => sum + row.directionalAccuracy, 0) / valid.length,
        averageMeanAbsoluteErrorPercent:
          valid.reduce((sum, row) => sum + row.meanAbsoluteErrorPercent, 0) / valid.length,
        averageConfidence: valid.reduce((sum, row) => sum + (row.confidence ?? 0), 0) / valid.length
      }
    : null;

  console.log(JSON.stringify({ rows, summary }, null, 2));
}

void main();
