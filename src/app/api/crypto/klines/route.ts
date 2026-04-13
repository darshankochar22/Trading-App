import { NextRequest, NextResponse } from "next/server";
import { fetchBinance, sanitizeSymbol } from "@/lib/binance";

export const dynamic = "force-dynamic";

type KlineRow = [number, string, string, string, string, string, ...unknown[]];

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const symbol = sanitizeSymbol(url.searchParams.get("symbol") ?? "BTCUSDT");
  const interval = url.searchParams.get("interval") ?? "15m";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 120), 20), 500);

  try {
    const rows = (await fetchBinance(
      `/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`,
    )) as KlineRow[];

    const data = rows.map((r) => ({
      openTime: r[0],
      open: Number(r[1]),
      high: Number(r[2]),
      low: Number(r[3]),
      close: Number(r[4]),
      volume: Number(r[5]),
    }));

    return NextResponse.json({ ok: true as const, data });
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
