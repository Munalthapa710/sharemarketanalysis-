import { db } from "@/lib/db";
import { marketDataProvider } from "@/lib/data/market-provider";
import { requireSession } from "@/lib/auth/session";

export async function getDashboardData() {
  const session = await requireSession();
  const [summary, watchlistItems, analyses] = await Promise.all([
    marketDataProvider.getMarketSummary(),
    db.watchlistItem.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" }
    }),
    db.analysisHistory.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  return { session, summary, watchlistItems, analyses };
}

export async function getWatchlistData() {
  const session = await requireSession();
  const items = await db.watchlistItem.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" }
  });
  const enriched = await Promise.all(
    items.map(async (item) => {
      const analysis = await marketDataProvider.getAnalysis(item.symbol);
      return { item, analysis };
    })
  );

  return { session, enriched };
}

export async function getHistoryData() {
  const session = await requireSession();
  const history = await db.analysisHistory.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" }
  });

  return { session, history };
}
