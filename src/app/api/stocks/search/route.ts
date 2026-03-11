import { NextResponse } from "next/server";
import { marketDataProvider } from "@/lib/data/market-provider";
import { searchSchema } from "@/lib/validations/stocks";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const payload = searchSchema.parse({ q: searchParams.get("q") ?? "" });
    const results = await marketDataProvider.search(payload.q);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Search failed" }, { status: 400 });
  }
}
