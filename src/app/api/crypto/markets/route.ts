import { NextRequest, NextResponse } from "next/server";
import { fetchBinance } from "@/lib/binance";

export const dynamic = "force-dynamic";

type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 24), 1), 100);
  const quote = (url.searchParams.get("quote") ?? "USDT").toUpperCase();

  try {
    const tickers = (await fetchBinance("/api/v3/ticker/24hr")) as BinanceTicker[];
    const data = tickers
      .filter((t) => t.symbol.endsWith(quote))
      .map((t) => ({
        symbol: t.symbol,
        price: Number(t.lastPrice),
        changePercent24h: Number(t.priceChangePercent),
        quoteVolume: Number(t.quoteVolume),
      }))
      .sort((a, b) => b.quoteVolume - a.quoteVolume)
      .slice(0, limit);

    return NextResponse.json({ ok: true as const, data });
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
