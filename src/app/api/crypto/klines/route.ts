import { NextRequest, NextResponse } from "next/server";
import { getKlines } from "@/lib/cryptoMarket";
import { sanitizeSymbol } from "@/lib/binance";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const symbol = sanitizeSymbol(url.searchParams.get("symbol") ?? "BTCUSDT");
  const interval = url.searchParams.get("interval") ?? "15m";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 120), 20), 500);

  try {
    const result = await getKlines(symbol, interval, limit);
    return NextResponse.json({ ok: true as const, provider: result.provider, data: result.data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false as const,
        message: error instanceof Error ? error.message : "Failed to fetch klines",
      },
      { status: 502 },
    );
  }
}
