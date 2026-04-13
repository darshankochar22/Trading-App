import { NextRequest, NextResponse } from "next/server";
import { fetchMutualFundList } from "@/lib/nseMarket";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? 30);
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(Math.floor(limitParam), 1), 100) : 30;
    const data = await fetchMutualFundList(limit, q);
    return NextResponse.json({ ok: true as const, data, asOf: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false as const,
        data: [] as const,
        message: error instanceof Error ? error.message : "Unable to fetch mutual funds",
      },
      { status: 500 },
    );
  }
}
