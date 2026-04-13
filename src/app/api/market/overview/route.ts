import { NextResponse } from "next/server";
import { fetchNseOverviewCached } from "@/lib/nseMarket";
import type { MarketOverviewResponse } from "@/types/market";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { indices, stocks } = await fetchNseOverviewCached();
    const payload: MarketOverviewResponse = {
      ok: true,
      indices,
      stocks,
      asOf: new Date().toISOString(),
    };
    return NextResponse.json(payload);
  } catch (error) {
    const payload: MarketOverviewResponse = {
      ok: false,
      indices: [],
      stocks: [],
      asOf: new Date().toISOString(),
      message: error instanceof Error ? error.message : "Failed to fetch market overview",
    };
    return NextResponse.json(payload, { status: 500 });
  }
}
