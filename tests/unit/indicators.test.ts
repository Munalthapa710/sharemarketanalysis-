import { describe, expect, it } from "vitest";
import { bollinger, ema, linearRegressionSlope, macd, momentum, rsi, sma, volatility } from "@/lib/analysis/indicators";

const sample = [100, 102, 101, 104, 106, 108, 107, 110, 112, 111, 115, 116, 118, 119, 121];

describe("indicator calculations", () => {
  it("calculates SMA and EMA", () => {
    expect(sma(sample, 5)).toBeCloseTo(117.8, 1);
    expect(ema(sample, 5)).toBeGreaterThan(110);
  });

  it("calculates RSI in a realistic range", () => {
    const value = rsi(sample, 14);
    expect(value).toBeGreaterThan(50);
    expect(value).toBeLessThanOrEqual(100);
  });

  it("returns MACD and Bollinger metrics", () => {
    const macdSet = macd(sample);
    const bands = bollinger(sample, 10, 2);
    expect(macdSet.macd).not.toBeNaN();
    expect(bands.upper).toBeGreaterThan(bands.middle);
    expect(bands.middle).toBeGreaterThan(bands.lower);
  });

  it("computes slope, volatility, and momentum", () => {
    expect(linearRegressionSlope(sample)).toBeGreaterThan(0);
    expect(volatility(sample, 10)).toBeGreaterThan(0);
    expect(momentum(sample, 5)).toBeGreaterThan(0);
  });
});
