import { addTradingDays } from "@/lib/data/time";
import {
  bollinger,
  ema,
  linearRegressionSlope,
  macd,
  momentum,
  rsi,
  sma,
  supportResistance,
  volatility,
  volumeTrend
} from "@/lib/analysis/indicators";
import type { AnalysisResult, PredictionPoint, Recommendation, StockQuote } from "@/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildRecommendation(score: number): Recommendation {
  if (score >= 75) return "Strong Buy";
  if (score >= 60) return "Buy";
  if (score >= 45) return "Hold";
  if (score >= 30) return "Sell";
  return "Strong Sell";
}

export function estimateTimeframe(changePercent: number, slope: number, risk: number) {
  const absoluteChange = Math.abs(changePercent);
  const slopeFactor = Math.max(Math.abs(slope), 0.2);
  const riskDrag = 1 + risk / 30;
  const rawDays = Math.ceil((absoluteChange / slopeFactor) * riskDrag);

  if (rawDays <= 3) return { days: rawDays, label: "1-3 trading days" };
  if (rawDays <= 7) return { days: 7, label: "1 week" };
  if (rawDays <= 14) return { days: 14, label: "2 weeks" };
  if (rawDays <= 30) return { days: 30, label: "1 month" };
  return { days: 60, label: "3 months" };
}

function predictionCurve(lastPrice: number, targetPrice: number, days: number) {
  const points: PredictionPoint[] = [];
  const step = (targetPrice - lastPrice) / Math.max(days, 1);

  for (let day = 1; day <= days; day += 1) {
    const easing = 1 - Math.exp(-day / Math.max(days / 3, 1));
    const projectedClose = Number((lastPrice + step * day * easing * 1.18).toFixed(2));
    points.push({
      date: addTradingDays(day),
      predictedClose: day === days ? Number(targetPrice.toFixed(2)) : projectedClose
    });
  }

  return points;
}

export function analyzeStock(stock: StockQuote): AnalysisResult {
  const closes = stock.history.map((point) => point.close);
  const volumes = stock.history.map((point) => point.volume);
  const currentPrice = stock.currentPrice;
  const dailyChange = currentPrice - stock.previousClose;
  const dailyChangePercent = stock.previousClose === 0 ? 0 : (dailyChange / stock.previousClose) * 100;
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const rsi14 = rsi(closes, 14);
  const macdSet = macd(closes);
  const bands = bollinger(closes, 20, 2);
  const levels = supportResistance(closes, 30);
  const momentumValue = momentum(closes, 10);
  const volatilityValue = volatility(closes, 20);
  const trendSlope = linearRegressionSlope(closes.slice(-20));
  const volumeTrendValue = volumeTrend(volumes);

  let score = 50;
  score += currentPrice > sma20 ? 8 : -8;
  score += currentPrice > sma50 ? 8 : -8;
  score += ema12 > ema26 ? 9 : -9;
  score += macdSet.histogram > 0 ? 6 : -6;
  score += rsi14 < 35 ? 10 : 0;
  score += rsi14 > 70 ? -10 : 0;
  score += momentumValue > 0 ? 7 : -7;
  score += trendSlope > 0 ? 8 : -8;
  score += volumeTrendValue > 0.08 ? 6 : volumeTrendValue < -0.08 ? -6 : 0;
  score += currentPrice < bands.lower ? 7 : currentPrice > bands.upper ? -7 : 0;

  const recommendation = buildRecommendation(clamp(score, 0, 100));
  const baseProjection = currentPrice + trendSlope * 8 + momentumValue * 0.35;
  const regressionProjection = currentPrice + trendSlope * 15;
  const resistanceAdjusted = Math.min(regressionProjection, levels.resistance * 1.04);
  const supportAdjusted = Math.max(baseProjection, levels.support * 0.97);
  const predictedPrice = Number(
    (
      resistanceAdjusted * 0.4 +
      supportAdjusted * 0.3 +
      (currentPrice + (ema12 - ema26) * 4) * 0.3
    ).toFixed(2)
  );
  const rupeeMove = Number((predictedPrice - currentPrice).toFixed(2));
  const percentageMove = Number(((rupeeMove / currentPrice) * 100).toFixed(2));
  const confidence = clamp(
    Number(
      (
        62 +
        (trendSlope > 0 ? 6 : -4) +
        (Math.abs(macdSet.histogram) > 2 ? 5 : 0) -
        volatilityValue * 0.45 +
        volumeTrendValue * 100 * 0.1
      ).toFixed(2)
    ),
    35,
    91
  );
  const timeframeMeta = estimateTimeframe(percentageMove, trendSlope, volatilityValue);
  const estimatedTargetDate = addTradingDays(timeframeMeta.days);
  const predictionChart = predictionCurve(currentPrice, predictedPrice, Math.min(timeframeMeta.days, 20));
  const riskLabel =
    volatilityValue > 18
      ? "High volatility may delay the target and trigger sharp swings."
      : currentPrice >= levels.resistance * 0.98
        ? `Resistance near Rs. ${levels.resistance.toFixed(2)} may slow follow-through.`
        : `Support near Rs. ${levels.support.toFixed(2)} offers some downside reference, but trends can reverse quickly.`;

  const simpleExplanation = `${stock.symbol} looks ${recommendation.toLowerCase()} because price is ${currentPrice > sma20 ? "above" : "below"} key moving averages, RSI is ${rsi14.toFixed(0)}, and momentum is ${momentumValue >= 0 ? "improving" : "weakening"}.`;
  const advancedExplanation = [
    `The weighted model scores trend, momentum, mean reversion, and participation.`,
    `Price vs SMA20/SMA50 is ${currentPrice > sma20 && currentPrice > sma50 ? "constructive" : "mixed"}, MACD histogram is ${macdSet.histogram >= 0 ? "positive" : "negative"}, and volume trend is ${(volumeTrendValue * 100).toFixed(1)}%.`,
    `The target blends short moving-average projection, recent regression slope, and nearby support/resistance zones to keep the estimate practical for NEPSE-style liquidity conditions.`
  ].join(" ");

  return {
    symbol: stock.symbol,
    companyName: stock.companyName,
    sector: stock.sector,
    currentPrice,
    dailyChange: Number(dailyChange.toFixed(2)),
    dailyChangePercent: Number(dailyChangePercent.toFixed(2)),
    volume: stock.volume,
    indicators: {
      sma20: Number(sma20.toFixed(2)),
      sma50: Number(sma50.toFixed(2)),
      ema12: Number(ema12.toFixed(2)),
      ema26: Number(ema26.toFixed(2)),
      rsi14: Number(rsi14.toFixed(2)),
      macd: Number(macdSet.macd.toFixed(2)),
      signal: Number(macdSet.signal.toFixed(2)),
      histogram: Number(macdSet.histogram.toFixed(2)),
      bollingerUpper: Number(bands.upper.toFixed(2)),
      bollingerMiddle: Number(bands.middle.toFixed(2)),
      bollingerLower: Number(bands.lower.toFixed(2)),
      support: Number(levels.support.toFixed(2)),
      resistance: Number(levels.resistance.toFixed(2)),
      momentum: Number(momentumValue.toFixed(2)),
      volatility: Number(volatilityValue.toFixed(2)),
      trendSlope: Number(trendSlope.toFixed(3)),
      volumeTrend: Number((volumeTrendValue * 100).toFixed(2))
    },
    recommendation,
    confidence,
    predictedPrice,
    rupeeMove,
    percentageMove,
    timeframe: timeframeMeta.label,
    estimatedTargetDate,
    simpleExplanation,
    advancedExplanation,
    riskNote: riskLabel,
    historicalChart: stock.history,
    predictionChart,
    liveChart: [],
    liveSources: []
  };
}
