import { NextRequest, NextResponse } from "next/server";
import { getMarkets } from "@/lib/cryptoMarket";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 24), 1), 100);
  const quote = (url.searchParams.get("quote") ?? "USDT").toUpperCase();

  try {
    const result = await getMarkets(quote, limit);
    return NextResponse.json({ ok: true as const, provider: result.provider, data: result.data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false as const,
        message: error instanceof Error ? error.message : "Failed to fetch crypto markets",
      },
      { status: 502 },
    );
  }
}
