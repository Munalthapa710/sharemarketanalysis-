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
import type {
  AnalysisResult,
  BacktestMetrics,
  PredictionPoint,
  Recommendation,
  StockQuote
} from "@/types";

const BACKTEST_HORIZONS = [5, 10, 20] as const;
const DEFAULT_BACKTEST_HORIZON = 10;

type AnalyzeMode = "full" | "light";

type SectorProfile = {
  trendWeight: number;
  meanReversionWeight: number;
  confidenceBias: number;
  thresholdShift: number;
  volatilityTolerance: number;
};

type MarketRegime = "bullish" | "bearish" | "sideways" | "volatile";

type ModelPreset = {
  name: string;
  slopeWeight: number;
  directionalWeight: number;
  meanReversionWeight: number;
  macdWeight: number;
  regimeMultiplier: number;
  biasCorrectionWeight: number;
  thresholdDrift: number;
};

type ProjectionContext = {
  stock: StockQuote;
  currentPrice: number;
  previousClose: number;
  dailyChange: number;
  dailyChangePercent: number;
  closes: number[];
  volumes: number[];
  stableHistory: StockQuote["history"];
  sma20: number;
  sma50: number;
  ema12: number;
  ema26: number;
  rsi14: number;
  macdSet: ReturnType<typeof macd>;
  bands: ReturnType<typeof bollinger>;
  safeSupport: number;
  safeResistance: number;
  momentumValue: number;
  volatilityValue: number;
  trendSlope: number;
  recentSlope: number;
  volumeTrendValue: number;
  regime: MarketRegime;
  sectorProfile: SectorProfile;
  baseScore: number;
};

type AnalysisOptions = {
  mode?: AnalyzeMode;
};

type AnalysisBuildOptions = {
  mode: AnalyzeMode;
  preset?: ModelPreset;
  skipPresetSelection?: boolean;
};

const SECTOR_PROFILES: Record<string, SectorProfile> = {
  Banking: {
    trendWeight: 1.06,
    meanReversionWeight: 0.94,
    confidenceBias: 3,
    thresholdShift: -2,
    volatilityTolerance: 1.1
  },
  Hydropower: {
    trendWeight: 0.94,
    meanReversionWeight: 1.08,
    confidenceBias: -3,
    thresholdShift: 3,
    volatilityTolerance: 0.85
  },
  Insurance: {
    trendWeight: 0.98,
    meanReversionWeight: 1.03,
    confidenceBias: -1,
    thresholdShift: 1,
    volatilityTolerance: 0.92
  },
  Manufacturing: {
    trendWeight: 1.02,
    meanReversionWeight: 0.98,
    confidenceBias: 1,
    thresholdShift: 0,
    volatilityTolerance: 0.96
  },
  Telecommunications: {
    trendWeight: 0.92,
    meanReversionWeight: 1.1,
    confidenceBias: -1,
    thresholdShift: 1,
    volatilityTolerance: 1
  }
};

const DEFAULT_MODEL_PRESET: ModelPreset = {
  name: "balanced",
  slopeWeight: 0.42,
  directionalWeight: 0.33,
  meanReversionWeight: 0.15,
  macdWeight: 0.1,
  regimeMultiplier: 1,
  biasCorrectionWeight: 0.55,
  thresholdDrift: 0
};

const MODEL_PRESETS: ModelPreset[] = [
  DEFAULT_MODEL_PRESET,
  {
    name: "trend",
    slopeWeight: 0.55,
    directionalWeight: 0.25,
    meanReversionWeight: 0.1,
    macdWeight: 0.1,
    regimeMultiplier: 1.06,
    biasCorrectionWeight: 0.45,
    thresholdDrift: -2
  },
  {
    name: "mean-reversion",
    slopeWeight: 0.24,
    directionalWeight: 0.24,
    meanReversionWeight: 0.42,
    macdWeight: 0.1,
    regimeMultiplier: 0.92,
    biasCorrectionWeight: 0.7,
    thresholdDrift: 2
  },
  {
    name: "defensive",
    slopeWeight: 0.28,
    directionalWeight: 0.22,
    meanReversionWeight: 0.32,
    macdWeight: 0.18,
    regimeMultiplier: 0.84,
    biasCorrectionWeight: 0.8,
    thresholdDrift: 4
  }
];

const presetCache = new Map<string, { signature: string; preset: ModelPreset }>();

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function roundFinite(value: number, fallback: number, digits = 2) {
  const safeValue = finiteOr(value, fallback);
  return Number(safeValue.toFixed(digits));
}

function getSectorProfile(sector: string): SectorProfile {
  return (
    SECTOR_PROFILES[sector] ?? {
      trendWeight: 1,
      meanReversionWeight: 1,
      confidenceBias: 0,
      thresholdShift: 0,
      volatilityTolerance: 1
    }
  );
}

function buildStableHistory(stock: StockQuote) {
  const safePreviousClose =
    Number.isFinite(stock.previousClose) && stock.previousClose > 0
      ? stock.previousClose
      : stock.currentPrice > 0
        ? stock.currentPrice
        : 1;
  const safeCurrentPrice =
    Number.isFinite(stock.currentPrice) && stock.currentPrice > 0 ? stock.currentPrice : safePreviousClose;

  const cleaned = stock.history
    .filter((point) => Number.isFinite(point.close) && point.close > 0)
    .map((point) => ({
      ...point,
      close: point.close,
      volume: Number.isFinite(point.volume) && point.volume >= 0 ? point.volume : 0
    }));

  if (cleaned.length >= 30) {
    return cleaned;
  }

  const seedPrice = cleaned.at(-1)?.close ?? safePreviousClose;
  const filler = Array.from({ length: Math.max(30 - cleaned.length, 0) }, (_, index) => ({
    date: `synthetic-${index + 1}`,
    close: seedPrice,
    volume: 0
  }));

  return [...filler, ...cleaned, { date: "synthetic-current", close: safeCurrentPrice, volume: stock.volume }];
}

function buildRecommendation(score: number, thresholdShift = 0): Recommendation {
  if (score >= 75 + thresholdShift) return "Strong Buy";
  if (score >= 60 + thresholdShift) return "Buy";
  if (score >= 45 + thresholdShift) return "Hold";
  if (score >= 30 + thresholdShift) return "Sell";
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

function detectMarketRegime(args: {
  currentPrice: number;
  sma20: number;
  sma50: number;
  trendSlope: number;
  recentSlope: number;
  rsi14: number;
  volatilityValue: number;
}) {
  const volatilityRatio = args.currentPrice > 0 ? args.volatilityValue / args.currentPrice : 0;

  if (volatilityRatio > 0.05) {
    return "volatile" as const;
  }

  if (args.sma20 > args.sma50 && args.trendSlope > 0 && args.recentSlope > 0 && args.rsi14 >= 48) {
    return "bullish" as const;
  }

  if (args.sma20 < args.sma50 && args.trendSlope < 0 && args.recentSlope < 0 && args.rsi14 <= 52) {
    return "bearish" as const;
  }

  return "sideways" as const;
}

function emptyBacktest(): BacktestMetrics {
  return {
    horizonDays: DEFAULT_BACKTEST_HORIZON,
    sampleSize: 0,
    directionalAccuracy: 50,
    meanAbsoluteErrorPercent: 12,
    biasPercent: 0
  };
}

function inferSignalStrength(recommendation: Recommendation) {
  switch (recommendation) {
    case "Strong Buy":
      return 2;
    case "Buy":
      return 1;
    case "Hold":
      return 0;
    case "Sell":
      return -1;
    case "Strong Sell":
      return -2;
  }
}

function regimeTargetMultiplier(regime: MarketRegime) {
  switch (regime) {
    case "bullish":
      return 1.08;
    case "bearish":
      return 1.05;
    case "volatile":
      return 0.82;
    case "sideways":
      return 0.88;
  }
}

function buildContext(stock: StockQuote): ProjectionContext {
  const sectorProfile = getSectorProfile(stock.sector);
  const stableHistory = buildStableHistory(stock);
  const closes = stableHistory.map((point) => point.close);
  const volumes = stableHistory.map((point) => point.volume);
  const currentPrice = finiteOr(stock.currentPrice, closes.at(-1) ?? 0);
  const previousClose = finiteOr(stock.previousClose, currentPrice);
  const dailyChange = currentPrice - previousClose;
  const dailyChangePercent = previousClose === 0 ? 0 : (dailyChange / previousClose) * 100;
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
  const recentSlope = linearRegressionSlope(closes.slice(-5));
  const volumeTrendValue = volumeTrend(volumes);
  const safeSupport = finiteOr(levels.support, Math.min(currentPrice, previousClose));
  const safeResistance = finiteOr(levels.resistance, Math.max(currentPrice, previousClose));
  const regime = detectMarketRegime({
    currentPrice,
    sma20,
    sma50,
    trendSlope,
    recentSlope,
    rsi14,
    volatilityValue
  });

  let baseScore = 50;
  baseScore += currentPrice > sma20 ? 8 : -8;
  baseScore += currentPrice > sma50 ? 8 : -8;
  baseScore += ema12 > ema26 ? 9 : -9;
  baseScore += macdSet.histogram > 0 ? 6 : -6;
  baseScore += rsi14 < 35 ? 10 : 0;
  baseScore += rsi14 > 70 ? -10 : 0;
  baseScore += momentumValue > 0 ? 7 : -7;
  baseScore += trendSlope > 0 ? 8 : -8;
  baseScore += volumeTrendValue > 0.08 ? 6 : volumeTrendValue < -0.08 ? -6 : 0;
  baseScore += currentPrice < bands.lower ? 7 : currentPrice > bands.upper ? -7 : 0;
  baseScore += currentPrice <= safeSupport * 1.02 ? 5 : 0;
  baseScore += currentPrice >= safeResistance * 0.98 ? -5 : 0;
  baseScore += trendSlope * 6 * (sectorProfile.trendWeight - 1);
  baseScore -= Math.max(volatilityValue - 12 * sectorProfile.volatilityTolerance, 0) * 0.35;
  baseScore += regime === "bullish" ? 8 : 0;
  baseScore += regime === "bearish" ? -8 : 0;
  baseScore += regime === "sideways" ? (Math.abs(trendSlope) < 0.6 ? -4 : 0) : 0;
  baseScore += regime === "volatile" ? -6 : 0;
  baseScore += recentSlope > 0 ? 4 : -4;

  return {
    stock,
    currentPrice,
    previousClose,
    dailyChange,
    dailyChangePercent,
    closes,
    volumes,
    stableHistory,
    sma20,
    sma50,
    ema12,
    ema26,
    rsi14,
    macdSet,
    bands,
    safeSupport,
    safeResistance,
    momentumValue,
    volatilityValue,
    trendSlope,
    recentSlope,
    volumeTrendValue,
    regime,
    sectorProfile,
    baseScore
  };
}

function getPresetSignature(stock: StockQuote) {
  const history = buildStableHistory(stock).filter((point) => !point.date.startsWith("synthetic-"));
  return [
    history.length,
    history.at(-1)?.date ?? "none",
    history.at(-1)?.close?.toFixed(2) ?? "0",
    history.at(-2)?.close?.toFixed(2) ?? "0"
  ].join(":");
}

function projectPrice(
  context: ProjectionContext,
  preset: ModelPreset,
  backtest: BacktestMetrics,
  mode: AnalyzeMode
) {
  const baseRecommendation = buildRecommendation(
    clamp(context.baseScore, 0, 100),
    context.sectorProfile.thresholdShift + preset.thresholdDrift
  );
  const slopeProjection =
    context.currentPrice + context.trendSlope * 8 * context.sectorProfile.trendWeight;
  const horizonProjection =
    context.currentPrice +
    context.trendSlope * DEFAULT_BACKTEST_HORIZON * context.sectorProfile.trendWeight +
    context.momentumValue * 0.15;
  const meanReversionProjection =
    context.currentPrice +
    context.momentumValue * 0.25 +
    (context.sma20 - context.currentPrice) * 0.2 * context.sectorProfile.meanReversionWeight;
  const macdProjection =
    context.currentPrice + (context.ema12 - context.ema26) * 3.5 + context.macdSet.histogram * 0.8;
  const boundedBullishTarget = Math.min(
    Math.max(slopeProjection, meanReversionProjection),
    context.safeResistance * 1.03
  );
  const boundedBearishTarget = Math.max(
    Math.min(slopeProjection, meanReversionProjection),
    context.safeSupport * 0.97
  );
  const directionalTarget =
    baseRecommendation === "Strong Buy" || baseRecommendation === "Buy"
      ? boundedBullishTarget
      : baseRecommendation === "Strong Sell" || baseRecommendation === "Sell"
        ? boundedBearishTarget
        : context.currentPrice + context.trendSlope * 5;
  const rawPredictedPrice = roundFinite(
    horizonProjection * preset.slopeWeight +
      directionalTarget * preset.directionalWeight +
      meanReversionProjection * preset.meanReversionWeight +
      macdProjection * preset.macdWeight,
    context.currentPrice
  );
  const biasAdjustment =
    context.currentPrice > 0
      ? clamp(
          (-backtest.biasPercent / 100) * context.currentPrice,
          -context.currentPrice * 0.08,
          context.currentPrice * 0.08
        )
      : 0;
  const regimeAdjustedTarget =
    context.currentPrice +
    (rawPredictedPrice - context.currentPrice) *
      regimeTargetMultiplier(context.regime) *
      preset.regimeMultiplier;
  const predictedPrice = roundFinite(
    regimeAdjustedTarget + biasAdjustment * (mode === "full" ? preset.biasCorrectionWeight : 0),
    context.currentPrice
  );

  return {
    predictedPrice,
    baseRecommendation
  };
}

function deriveConfidence(
  structuralConfidence: number,
  backtest: BacktestMetrics,
  context: ProjectionContext
) {
  const accuracyComponent = backtest.directionalAccuracy * 0.46;
  const errorComponent = clamp(100 - backtest.meanAbsoluteErrorPercent * 3.1, 20, 100) * 0.24;
  const sampleComponent = clamp(backtest.sampleSize * 1.2, 8, 100) * 0.12;
  const structureComponent = structuralConfidence * 0.18;
  const biasPenalty = clamp(Math.abs(backtest.biasPercent) * 0.7, 0, 10);
  const barrierPenalty =
    context.currentPrice >= context.safeResistance * 0.995 ||
    context.currentPrice <= context.safeSupport * 1.005
      ? 4
      : 0;
  const volatilityPenalty = clamp(context.volatilityValue * 0.22, 0, 12);

  return clamp(
    roundFinite(
      accuracyComponent +
        errorComponent +
        sampleComponent +
        structureComponent -
        biasPenalty -
        barrierPenalty -
        volatilityPenalty,
      structuralConfidence
    ),
    35,
    91
  );
}

function evaluateHorizonBacktest(stock: StockQuote, horizonDays: number, preset: ModelPreset): BacktestMetrics {
  const history = buildStableHistory(stock).filter((point) => !point.date.startsWith("synthetic-"));
  if (history.length < 90) {
    return emptyBacktest();
  }

  const startIndex = 60;
  const results: Array<{ hit: boolean; absoluteErrorPercent: number; biasPercent: number }> = [];

  for (let endIndex = startIndex; endIndex + horizonDays <= history.length; endIndex += 5) {
    const slice = history.slice(0, endIndex);
    const current = slice.at(-1);
    const previous = slice.at(-2);
    const futurePoint = history[endIndex + horizonDays - 1];

    if (!current || !previous || !futurePoint || current.close <= 0) {
      continue;
    }

    const sliceStock: StockQuote = {
      symbol: stock.symbol,
      companyName: stock.companyName,
      sector: stock.sector,
      currentPrice: current.close,
      previousClose: previous.close,
      volume: current.volume,
      history: slice
    };
    const context = buildContext(sliceStock);
    const provisionalBacktest = {
      horizonDays,
      sampleSize: 0,
      directionalAccuracy: 50,
      meanAbsoluteErrorPercent: 12,
      biasPercent: 0
    };
    const projected = projectPrice(context, preset, provisionalBacktest, "light");
    const predictedMove = projected.predictedPrice - current.close;
    const actualMove = futurePoint.close - current.close;
    const predictedSignal = Math.sign(predictedMove);
    const actualSignal = Math.sign(actualMove);
    const recommendationSignal = Math.sign(inferSignalStrength(projected.baseRecommendation));
    const hit =
      Math.abs(actualMove / current.close) < 0.01
        ? Math.abs(predictedMove / current.close) < 0.01
        : predictedSignal === actualSignal || recommendationSignal === actualSignal;
    const absoluteErrorPercent = (Math.abs(projected.predictedPrice - futurePoint.close) / current.close) * 100;
    const biasPercent = ((projected.predictedPrice - futurePoint.close) / current.close) * 100;

    if (!Number.isFinite(absoluteErrorPercent) || !Number.isFinite(biasPercent)) {
      continue;
    }

    results.push({
      hit,
      absoluteErrorPercent,
      biasPercent
    });
  }

  if (!results.length) {
    return {
      ...emptyBacktest(),
      horizonDays
    };
  }

  const directionalAccuracy =
    (results.filter((result) => result.hit).length / Math.max(results.length, 1)) * 100;
  const meanAbsoluteErrorPercent =
    results.reduce((sum, result) => sum + result.absoluteErrorPercent, 0) / results.length;
  const biasPercent = results.reduce((sum, result) => sum + result.biasPercent, 0) / results.length;

  return {
    horizonDays,
    sampleSize: results.length,
    directionalAccuracy: roundFinite(directionalAccuracy, 50),
    meanAbsoluteErrorPercent: roundFinite(meanAbsoluteErrorPercent, 12),
    biasPercent: roundFinite(biasPercent, 0)
  };
}

function evaluateBacktest(stock: StockQuote, preset: ModelPreset): BacktestMetrics {
  const profiles = BACKTEST_HORIZONS.map((horizonDays) => evaluateHorizonBacktest(stock, horizonDays, preset)).filter(
    (result) => result.sampleSize > 0
  );

  if (!profiles.length) {
    return emptyBacktest();
  }

  const best = [...profiles].sort((left, right) => {
    const leftScore = left.directionalAccuracy - left.meanAbsoluteErrorPercent * 1.6;
    const rightScore = right.directionalAccuracy - right.meanAbsoluteErrorPercent * 1.6;
    return rightScore - leftScore;
  })[0];

  const totalSamples = profiles.reduce((sum, result) => sum + result.sampleSize, 0);
  const weightedDirectionalAccuracy =
    profiles.reduce((sum, result) => sum + result.directionalAccuracy * result.sampleSize, 0) /
    Math.max(totalSamples, 1);
  const weightedMeanAbsoluteErrorPercent =
    profiles.reduce((sum, result) => sum + result.meanAbsoluteErrorPercent * result.sampleSize, 0) /
    Math.max(totalSamples, 1);
  const weightedBiasPercent =
    profiles.reduce((sum, result) => sum + result.biasPercent * result.sampleSize, 0) / Math.max(totalSamples, 1);

  return {
    horizonDays: best.horizonDays,
    sampleSize: totalSamples,
    directionalAccuracy: roundFinite(weightedDirectionalAccuracy, 50),
    meanAbsoluteErrorPercent: roundFinite(weightedMeanAbsoluteErrorPercent, 12),
    biasPercent: roundFinite(weightedBiasPercent, 0)
  };
}

function selectBestPreset(stock: StockQuote) {
  const history = buildStableHistory(stock).filter((point) => !point.date.startsWith("synthetic-"));
  if (history.length < 120) {
    return DEFAULT_MODEL_PRESET;
  }

  const signature = getPresetSignature(stock);
  const cached = presetCache.get(stock.symbol);
  if (cached && cached.signature === signature) {
    return cached.preset;
  }

  let bestPreset = DEFAULT_MODEL_PRESET;
  let bestScore = -Infinity;

  for (const preset of MODEL_PRESETS) {
    const backtest = evaluateBacktest(stock, preset);
    const score =
      backtest.directionalAccuracy - backtest.meanAbsoluteErrorPercent * 1.8 - Math.abs(backtest.biasPercent) * 0.4;

    if (score > bestScore) {
      bestScore = score;
      bestPreset = preset;
    }
  }

  presetCache.set(stock.symbol, {
    signature,
    preset: bestPreset
  });

  return bestPreset;
}

function buildAnalysis(stock: StockQuote, options: AnalysisBuildOptions): AnalysisResult {
  const preset =
    options.preset ??
    (options.mode === "full" && !options.skipPresetSelection ? selectBestPreset(stock) : DEFAULT_MODEL_PRESET);
  const context = buildContext(stock);
  const backtest = evaluateBacktest(stock, preset);
  const projected = projectPrice(context, preset, backtest, options.mode);
  const rupeeMove = roundFinite(projected.predictedPrice - context.currentPrice, 0);
  const percentageMove = roundFinite(
    context.currentPrice === 0 ? 0 : (rupeeMove / context.currentPrice) * 100,
    0
  );
  const structuralConfidence = clamp(
    roundFinite(
      58 +
        (context.trendSlope > 0 ? 5 : -4) +
        (Math.abs(context.macdSet.histogram) > 1 ? 4 : 0) -
        context.volatilityValue * (0.32 / context.sectorProfile.volatilityTolerance) +
        context.volumeTrendValue * 100 * 0.08 +
        context.sectorProfile.confidenceBias,
      55
    ),
    35,
    90
  );
  const calibratedScore = clamp(
    context.baseScore +
      (backtest.directionalAccuracy - 50) * 0.18 -
      (backtest.meanAbsoluteErrorPercent - 8) * 1.2 -
      Math.abs(backtest.biasPercent) * 0.45,
    0,
    100
  );
  const recommendation = buildRecommendation(
    calibratedScore,
    context.sectorProfile.thresholdShift + preset.thresholdDrift
  );
  const confidence = deriveConfidence(structuralConfidence, backtest, context);
  const timeframeMeta = estimateTimeframe(percentageMove, context.trendSlope, context.volatilityValue);
  const estimatedTargetDate = addTradingDays(timeframeMeta.days);
  const predictionChart = predictionCurve(
    context.currentPrice,
    projected.predictedPrice,
    Math.min(timeframeMeta.days, 20)
  );
  const riskLabel =
    context.volatilityValue > 18
      ? "High volatility may delay the target and trigger sharp swings."
      : context.currentPrice >= context.safeResistance * 0.98
        ? `Resistance near Rs. ${context.safeResistance.toFixed(2)} may slow follow-through.`
        : `Support near Rs. ${context.safeSupport.toFixed(2)} offers some downside reference, but trends can reverse quickly.`;

  const simpleExplanation = `${stock.symbol} looks ${recommendation.toLowerCase()} because price is ${context.currentPrice > context.sma20 ? "above" : "below"} key moving averages, RSI is ${context.rsi14.toFixed(0)}, and momentum is ${context.momentumValue >= 0 ? "improving" : "weakening"}.`;
  const advancedExplanation = [
    `The weighted model scores trend, momentum, mean reversion, and participation, then calibrates the output using sector regime rules and a symbol-level preset.`,
    `Price vs SMA20/SMA50 is ${context.currentPrice > context.sma20 && context.currentPrice > context.sma50 ? "constructive" : "mixed"}, MACD histogram is ${context.macdSet.histogram >= 0 ? "positive" : "negative"}, volume trend is ${(context.volumeTrendValue * 100).toFixed(1)}%, regime is ${context.regime}, and active preset is ${preset.name}.`,
    `Confidence is calibrated by multi-horizon rolling backtests, with ${backtest.sampleSize} total windows and a best-fit horizon of ${backtest.horizonDays} trading days. Directional accuracy is ${backtest.directionalAccuracy.toFixed(0)}% and mean absolute error is ${backtest.meanAbsoluteErrorPercent.toFixed(2)}%.`
  ].join(" ");

  return {
    symbol: stock.symbol,
    companyName: stock.companyName,
    sector: stock.sector,
    currentPrice: context.currentPrice,
    dailyChange: roundFinite(context.dailyChange, 0),
    dailyChangePercent: roundFinite(context.dailyChangePercent, 0),
    volume: finiteOr(stock.volume, 0),
    indicators: {
      sma20: roundFinite(context.sma20, context.currentPrice),
      sma50: roundFinite(context.sma50, context.currentPrice),
      ema12: roundFinite(context.ema12, context.currentPrice),
      ema26: roundFinite(context.ema26, context.currentPrice),
      rsi14: roundFinite(context.rsi14, 50),
      macd: roundFinite(context.macdSet.macd, 0),
      signal: roundFinite(context.macdSet.signal, 0),
      histogram: roundFinite(context.macdSet.histogram, 0),
      bollingerUpper: roundFinite(context.bands.upper, context.currentPrice),
      bollingerMiddle: roundFinite(context.bands.middle, context.currentPrice),
      bollingerLower: roundFinite(context.bands.lower, context.currentPrice),
      support: roundFinite(context.safeSupport, context.currentPrice),
      resistance: roundFinite(context.safeResistance, context.currentPrice),
      momentum: roundFinite(context.momentumValue, 0),
      volatility: roundFinite(context.volatilityValue, 0),
      trendSlope: roundFinite(context.trendSlope, 0, 3),
      volumeTrend: roundFinite(context.volumeTrendValue * 100, 0)
    },
    recommendation,
    confidence,
    backtest,
    predictedPrice: projected.predictedPrice,
    rupeeMove,
    percentageMove,
    timeframe: timeframeMeta.label,
    estimatedTargetDate,
    simpleExplanation,
    advancedExplanation,
    riskNote: riskLabel,
    historicalChart: context.stableHistory,
    predictionChart,
    liveChart: [],
    liveSources: []
  };
}

export function analyzeStock(stock: StockQuote, options?: AnalysisOptions): AnalysisResult {
  return buildAnalysis(stock, {
    mode: options?.mode ?? "full"
  });
}
