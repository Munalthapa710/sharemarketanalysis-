import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { marketDataProvider } from "@/lib/data/market-provider";

export async function GET() {
  const session = await requireSession();
  const items = await db.watchlistItem.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const { symbol } = (await request.json()) as { symbol: string };
    const stock = await marketDataProvider.getStock(symbol);

    if (!stock) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    const item = await db.watchlistItem.upsert({
      where: {
        userId_symbol: {
          userId: session.sub,
          symbol: stock.symbol
        }
      },
      update: {
        companyName: stock.companyName
      },
      create: {
        userId: session.sub,
        symbol: stock.symbol,
        companyName: stock.companyName
      }
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to add watchlist item" }, { status: 400 });
  }
}
