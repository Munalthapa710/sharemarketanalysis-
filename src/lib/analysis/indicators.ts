function average(values: number[]) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function sma(values: number[], period: number) {
  const slice = values.slice(-period);
  return average(slice);
}

export function ema(values: number[], period: number) {
  if (!values.length) {
    return 0;
  }

  const multiplier = 2 / (period + 1);
  let result = values[0];

  for (let index = 1; index < values.length; index += 1) {
    result = (values[index] - result) * multiplier + result;
  }

  return result;
}

export function rsi(values: number[], period = 14) {
  if (values.length <= period) {
    return 50;
  }

  let gains = 0;
  let losses = 0;

  for (let index = values.length - period; index < values.length; index += 1) {
    const diff = values[index] - values[index - 1];
    if (diff > 0) {
      gains += diff;
    } else {
      losses += Math.abs(diff);
    }
  }

  if (losses === 0) {
    return 100;
  }

  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

export function macd(values: number[]) {
  const macdValue = ema(values, 12) - ema(values, 26);
  const signal = ema(values.slice(-26), 9);
  const histogram = macdValue - signal;

  return { macd: macdValue, signal, histogram };
}

export function bollinger(values: number[], period = 20, multiplier = 2) {
  const slice = values.slice(-period);
  const middle = average(slice);
  const variance = average(slice.map((value) => (value - middle) ** 2));
  const deviation = Math.sqrt(variance);

  return {
    upper: middle + deviation * multiplier,
    middle,
    lower: middle - deviation * multiplier
  };
}

export function linearRegressionSlope(values: number[]) {
  const n = values.length;
  if (n <= 1) {
    return 0;
  }

  const xMean = (n - 1) / 2;
  const yMean = average(values);
  let numerator = 0;
  let denominator = 0;

  for (let index = 0; index < n; index += 1) {
    numerator += (index - xMean) * (values[index] - yMean);
    denominator += (index - xMean) ** 2;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

export function volatility(values: number[], period = 20) {
  const slice = values.slice(-period);
  const mean = average(slice);
  const variance = average(slice.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

export function supportResistance(values: number[], period = 30) {
  const slice = values.slice(-period);
  return {
    support: Math.min(...slice),
    resistance: Math.max(...slice)
  };
}

export function momentum(values: number[], period = 10) {
  if (values.length <= period) {
    return 0;
  }

  return values.at(-1)! - values.at(-period - 1)!;
}

export function volumeTrend(values: number[]) {
  if (values.length < 10) {
    return 0;
  }

  const recent = average(values.slice(-5));
  const previous = average(values.slice(-10, -5));
  return previous === 0 ? 0 : (recent - previous) / previous;
}
