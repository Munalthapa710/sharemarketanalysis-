import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type CacheEntry<T> = {
  fetchedAt: number;
  value: T;
};

const cache = new Map<string, CacheEntry<unknown>>();

async function runPython<T>(args: string[]) {
  const key = args.join(":");
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < 1000 * 60 * 5) {
    return cached.value as T;
  }

  const scriptPath = path.join(process.cwd(), "scripts", "nepse_market.py");
  const { stdout } = await execFileAsync("python", [scriptPath, ...args], {
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 8
  });
  const parsed = JSON.parse(stdout) as T;
  cache.set(key, {
    fetchedAt: Date.now(),
    value: parsed
  });
  return parsed;
}

export type OfficialSecurity = {
  id: number;
  companyName: string;
  symbol: string;
  securityName: string;
  status: string;
  sectorName: string;
  instrumentType: string;
};

export type OfficialTodayPrice = {
  businessDate: string;
  securityId: number;
  symbol: string;
  securityName: string;
  openPrice: number | null;
  highPrice: number | null;
  lowPrice: number | null;
  closePrice: number | null;
  totalTradedQuantity: number | null;
  previousDayClosePrice: number | null;
  lastUpdatedPrice: number | null;
  totalTrades: number | null;
  averageTradedPrice: number | null;
};

export async function getOfficialSecurities() {
  const data = await runPython<OfficialSecurity[]>(["securities"]);
  return data.filter((item) => item.symbol && item.status === "A");
}

export async function getOfficialTodayPrices() {
  return runPython<OfficialTodayPrice[]>(["today"]);
}
