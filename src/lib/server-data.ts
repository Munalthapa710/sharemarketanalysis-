import { db } from "@/lib/db";
import { marketDataProvider } from "@/lib/data/market-provider";
import { requireSession } from "@/lib/auth/session";
import type { AppNotification, AnalysisResult, StockQuote } from "@/types";

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

export async function getNotifications() {
  const session = await requireSession();
  const [summary, watchlistItems, analyses] = await Promise.all([
    marketDataProvider.getMarketSummary(),
    db.watchlistItem.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    db.analysisHistory.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
      take: 6
    })
  ]);

  const watchlistAnalyses = (
    await Promise.all(watchlistItems.map((item) => marketDataProvider.getAnalysis(item.symbol)))
  ).filter((analysis): analysis is AnalysisResult => Boolean(analysis));

  return buildNotifications(summary, watchlistItems, analyses, watchlistAnalyses);
}

function buildNotifications(
  summary: Awaited<ReturnType<typeof marketDataProvider.getMarketSummary>>,
  watchlistItems: Array<{ symbol: string; companyName: string; createdAt: Date }>,
  analyses: Array<{
    id: string;
    symbol: string;
    recommendation: string;
    predictedPrice: number;
    currentPrice: number;
    timeframeLabel: string;
    createdAt: Date;
  }>,
  watchlistAnalyses: AnalysisResult[]
): AppNotification[] {
  const notifications: AppNotification[] = [];
  const now = new Date();
  const topGainer = summary.topGainers[0];
  const topLoser = summary.topLosers[0];
  const topTrending = summary.trending[0];

  if (topGainer) {
    notifications.push(createNotification({
      id: `market-gainer-${topGainer.symbol}`,
      title: `${topGainer.symbol} is a top gainer today`,
      message: `${topGainer.companyName} is leading the board today. Momentum is positive and worth tracking while strength holds.`,
      actionLabel: "View stock",
      href: `/stocks/${topGainer.symbol}`,
      severity: "positive",
      category: "market",
      symbol: topGainer.symbol,
      createdAt: now
    }));
  }

  if (topTrending) {
    notifications.push(createNotification({
      id: `market-trending-${topTrending.symbol}`,
      title: `${topTrending.symbol} has the busiest tape right now`,
      message: `${topTrending.companyName} is trading with standout volume today. High participation often means cleaner breakouts or reversals.`,
      actionLabel: "Open market view",
      href: "/market",
      severity: "neutral",
      category: "market",
      symbol: topTrending.symbol,
      createdAt: new Date(now.getTime() - 1000 * 60 * 8)
    }));
  }

  const bestBuy = pickByRecommendation(watchlistAnalyses, ["Strong Buy", "Buy"])[0];
  if (bestBuy) {
    notifications.push(createNotification({
      id: `signal-buy-${bestBuy.symbol}`,
      title: `${bestBuy.symbol} looks like a buy setup`,
      message: `${bestBuy.companyName} is showing a ${bestBuy.recommendation} signal with ${bestBuy.confidence.toFixed(0)}% confidence. The model sees upside toward ${bestBuy.predictedPrice.toFixed(2)} in about ${bestBuy.timeframe.toLowerCase()}.`,
      actionLabel: "Review analysis",
      href: `/stocks/${bestBuy.symbol}`,
      severity: "positive",
      category: "signal",
      symbol: bestBuy.symbol,
      createdAt: new Date(now.getTime() - 1000 * 60 * 18)
    }));
  }

  const sellAnalysis = pickByRecommendation(watchlistAnalyses, ["Strong Sell", "Sell"])[0];
  const sellCandidate = sellAnalysis
    ? createNotification({
        id: `signal-sell-${sellAnalysis.symbol}`,
        title: `${sellAnalysis.symbol} looks like a sell setup`,
        message: `${sellAnalysis.companyName} is flashing ${sellAnalysis.recommendation}. Momentum and risk factors are weak enough that this is a name to reduce or exit carefully.`,
        actionLabel: "Review sell case",
        href: `/stocks/${sellAnalysis.symbol}`,
        severity: "negative",
        category: "signal",
        symbol: sellAnalysis.symbol,
        createdAt: new Date(now.getTime() - 1000 * 60 * 22)
      })
    : createStockSignalFromLoser(topLoser);
  if (sellCandidate) {
    notifications.push(sellCandidate);
  }

  const shortFuse = [...watchlistAnalyses]
    .filter((analysis) => analysis.percentageMove > 0 && analysis.estimatedTargetDate)
    .sort((left, right) => left.timeframe.localeCompare(right.timeframe))[0];

  if (shortFuse) {
    notifications.push(createNotification({
      id: `signal-boom-${shortFuse.symbol}`,
      title: `${shortFuse.symbol} could move fast in the next few days`,
      message: `${shortFuse.companyName} has a short target window and positive model slope. If you were waiting for a boom setup in 2 to 5 days, this is the closest current match in your feed.`,
      actionLabel: "Check timing",
      href: `/stocks/${shortFuse.symbol}`,
      severity: "positive",
      category: "signal",
      symbol: shortFuse.symbol,
      createdAt: new Date(now.getTime() - 1000 * 60 * 28)
    }));
  }

  if (analyses[0]) {
    notifications.push(createNotification({
      id: `history-${analyses[0].id}`,
      title: `${analyses[0].symbol} is still on your radar`,
      message: `Your latest saved analysis on ${analyses[0].symbol} called for ${analyses[0].recommendation} with a target of ${analyses[0].predictedPrice.toFixed(2)} over ${analyses[0].timeframeLabel.toLowerCase()}.`,
      actionLabel: "Open history",
      href: "/history",
      severity: analyses[0].predictedPrice >= analyses[0].currentPrice ? "neutral" : "negative",
      category: "watchlist",
      symbol: analyses[0].symbol,
      createdAt: analyses[0].createdAt
    }));
  }

  if (watchlistItems[0]) {
    notifications.push(createNotification({
      id: `watchlist-${watchlistItems[0].symbol}`,
      title: `${watchlistItems[0].symbol} is on your watchlist`,
      message: `${watchlistItems[0].companyName} is being tracked closely. Re-run analysis if you want a fresh buy or sell signal before the next move.`,
      actionLabel: "Open watchlist",
      href: "/watchlist",
      severity: "neutral",
      category: "watchlist",
      symbol: watchlistItems[0].symbol,
      createdAt: watchlistItems[0].createdAt
    }));
  }

  return notifications
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 8);
}

function pickByRecommendation(analyses: AnalysisResult[], recommendations: string[]) {
  return analyses
    .filter((analysis) => recommendations.includes(analysis.recommendation))
    .sort((left, right) => right.confidence - left.confidence);
}

function createStockSignalFromLoser(stock: StockQuote | undefined) {
  if (!stock) {
    return null;
  }

  return createNotification({
    id: `signal-sell-${stock.symbol}`,
    title: `${stock.symbol} looks weak today`,
    message: `${stock.companyName} is one of today's top losers. If you are holding it, this may be a good time to review whether to sell or wait for confirmation.`,
    actionLabel: "Inspect risk",
    href: `/stocks/${stock.symbol}`,
    severity: "negative",
    category: "signal",
    symbol: stock.symbol,
    createdAt: new Date(Date.now() - 1000 * 60 * 22)
  });
}

function createNotification(notification: Omit<AppNotification, "createdAt"> & { createdAt: Date }) {
  return {
    ...notification,
    createdAt: notification.createdAt.toISOString()
  };
}
