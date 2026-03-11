import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

export async function GET() {
  const session = await requireSession();
  const history = await db.analysisHistory.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(history);
}
