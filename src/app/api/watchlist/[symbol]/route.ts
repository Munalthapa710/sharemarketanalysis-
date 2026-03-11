import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { symbolSchema } from "@/lib/validations/stocks";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const session = await requireSession();
  const parsed = symbolSchema.parse(await params);

  await db.watchlistItem.deleteMany({
    where: {
      userId: session.sub,
      symbol: parsed.symbol
    }
  });

  return NextResponse.json({ success: true });
}
