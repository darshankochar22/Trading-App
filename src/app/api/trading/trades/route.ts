import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { listTradesDb } from "@/lib/tradingDb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const data = await listTradesDb(user.id);
    return NextResponse.json({ ok: true as const, data });
  } catch {
    return NextResponse.json({ ok: false as const, message: "Unauthenticated" }, { status: 401 });
  }
}
