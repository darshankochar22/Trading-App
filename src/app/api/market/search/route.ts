import { NextRequest, NextResponse } from "next/server";
import { fetchNseOverviewCached } from "@/lib/nseMarket";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? 20);
  const limit = Math.min(50, Math.max(1, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 20));

  if (!q) {
    return NextResponse.json({
      ok: true as const,
      query: "",
      data: [] as const,
      asOf: new Date().toISOString(),
    });
  }

  try {
    const { stocks } = await fetchNseOverviewCached();
    const ql = q.toLowerCase();
    const data = stocks
      .filter(
        (s) =>
          s.symbol.toLowerCase().includes(ql) ||
          (s.companyName && s.companyName.toLowerCase().includes(ql)),
      )
      .slice(0, limit);
    return NextResponse.json({
      ok: true as const,
      query: q,
      data,
      asOf: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false as const,
        query: q,
        data: [] as const,
        message: error instanceof Error ? error.message : "Search failed",
      },
      { status: 500 },
    );
  }
}
