import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/response";
import { fetchNseIndexConstituents } from "@/lib/nseMarket";
import type { MarketStock } from "@/types/market";

export const dynamic = "force-dynamic";

function breadth(stocks: MarketStock[]) {
  let advances = 0;
  let declines = 0;
  let unchanged = 0;
  for (const s of stocks) {
    if (s.pChange > 0) advances += 1;
    else if (s.pChange < 0) declines += 1;
    else unchanged += 1;
  }
  return { advances, declines, unchanged, total: stocks.length };
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name") ?? "";
  if (!name.trim()) {
    return jsonError("Query parameter name is required.", 422, "VALIDATION");
  }
  try {
    const data = await fetchNseIndexConstituents(name);
    return NextResponse.json({
      ok: true as const,
      name: data.name,
      stocks: data.stocks,
      breadth: breadth(data.stocks),
      asOf: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false as const, message: error instanceof Error ? error.message : "Failed to fetch index" },
      { status: 502 },
    );
  }
}

