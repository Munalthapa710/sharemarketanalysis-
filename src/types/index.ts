export type Recommendation =
  | "Strong Buy"
  | "Buy"
  | "Hold"
  | "Sell"
  | "Strong Sell";

export type PricePoint = {
  date: string;
  close: number;
  volume: number;
};

export type StockQuote = {
  symbol: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  previousClose: number;
  volume: number;
  history: PricePoint[];
};

export type LiveQuote = {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  volume: number;
  source: string;
  asOf: string;
  rawChange?: number;
  rawChangePercent?: number;
};

export type LiveChartPoint = {
  date: string;
  price: number;
  source: string;
};

export type TechnicalIndicators = {
  sma20: number;
  sma50: number;
  ema12: number;
  ema26: number;
  rsi14: number;
  macd: number;
  signal: number;
  histogram: number;
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  support: number;
  resistance: number;
  momentum: number;
  volatility: number;
  trendSlope: number;
  volumeTrend: number;
};

export type PredictionPoint = {
  date: string;
  predictedClose: number;
};

export type BacktestMetrics = {
  horizonDays: number;
  sampleSize: number;
  directionalAccuracy: number;
  meanAbsoluteErrorPercent: number;
  biasPercent: number;
};

export type AnalysisResult = {
  symbol: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  dailyChange: number;
  dailyChangePercent: number;
  volume: number;
  indicators: TechnicalIndicators;
  recommendation: Recommendation;
  confidence: number;
  backtest: BacktestMetrics;
  predictedPrice: number;
  rupeeMove: number;
  percentageMove: number;
  timeframe: string;
  estimatedTargetDate: string | null;
  simpleExplanation: string;
  advancedExplanation: string;
  riskNote: string;
  historicalChart: PricePoint[];
  predictionChart: PredictionPoint[];
  liveChart: LiveChartPoint[];
  liveSources: string[];
};

export type MarketSummary = {
  topGainers: StockQuote[];
  topLosers: StockQuote[];
  trending: StockQuote[];
  recentSearches: StockQuote[];
  recommendationDistribution: Record<Recommendation, number>;
  marketBreadth: {
    advancers: number;
    decliners: number;
    unchanged: number;
  };
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  actionLabel: string;
  href: string;
  severity: "positive" | "neutral" | "negative";
  category: "market" | "watchlist" | "signal";
  symbol?: string;
  createdAt: string;
};
