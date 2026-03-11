import { NextResponse } from "next/server";
import { marketDataBot } from "@/lib/data/market-bot";

export async function GET() {
  try {
    await marketDataBot.persistCurrentSnapshots();
    const snapshot = await marketDataBot.snapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch live market snapshot" },
      { status: 500 }
    );
  }
}
