import { NextResponse } from "next/server";
import { marketDataProvider } from "@/lib/data/market-provider";
import { symbolSchema } from "@/lib/validations/stocks";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const parsed = symbolSchema.parse(await params);
  const stock = await marketDataProvider.getStock(parsed.symbol);

  if (!stock) {
    return NextResponse.json({ error: "Stock not found" }, { status: 404 });
  }

  return NextResponse.json(stock);
}
