import { subDays } from "@/lib/data/time";
import { NEPSE_UNIVERSE } from "@/lib/data/nepse-universe";
import type { StockQuote } from "@/types";

function hashSymbol(symbol: string) {
  return symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function buildHistory(base: number, drift: number, volatility: number, volumeBase: number) {
  return Array.from({ length: 90 }, (_, index) => {
    const day = index + 1;
    const seasonal = Math.sin(day / 6) * volatility * 0.6;
    const shock = Math.cos(day / 11) * volatility * 0.3;
    const close = Number((base + day * drift + seasonal + shock).toFixed(2));
    const volume = Math.round(volumeBase + day * 250 + Math.abs(seasonal * 7000));

    return {
      date: subDays(89 - index),
      close,
      volume
    };
  });
}

export const MOCK_STOCKS: StockQuote[] = NEPSE_UNIVERSE.map((company, index) => {
  const seed = hashSymbol(company.symbol);
  const sectorBias =
    company.sector === "Hydropower" ? 360 :
    company.sector === "Insurance" ? 740 :
    company.sector === "Hotels and Tourism" ? 420 :
    company.sector === "Manufacturing" ? 980 :
    company.sector === "Telecommunications" ? 860 :
    520;
  const base = sectorBias + (seed % 260);
  const drift = ((seed % 18) - 7) / 10;
  const volatility = 8 + (seed % 14);
  const volumeBase = 45000 + (seed % 220) * 900 + index * 250;
  const history = buildHistory(base, drift, volatility, volumeBase);
  const currentPrice = history.at(-1)?.close ?? base;
  const previousClose = history.at(-2)?.close ?? currentPrice;
  const volume = history.at(-1)?.volume ?? volumeBase;

  return {
    symbol: company.symbol,
    companyName: company.companyName,
    sector: company.sector,
    currentPrice,
    previousClose,
    volume,
    history
  };
});
