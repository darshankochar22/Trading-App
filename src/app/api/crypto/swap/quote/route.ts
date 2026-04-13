import { NextRequest, NextResponse } from "next/server";
import { fetchBinance, sanitizeSymbol } from "@/lib/binance";

export const dynamic = "force-dynamic";

type PriceResp = { symbol: string; price: string };

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const fromAsset = sanitizeSymbol(url.searchParams.get("from") ?? "BTC");
  const toAsset = sanitizeSymbol(url.searchParams.get("to") ?? "USDT");
  const amount = Number(url.searchParams.get("amount") ?? 1);

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ ok: false as const, message: "Amount must be positive" }, { status: 400 });
  }

  const pair = `${fromAsset}${toAsset}`;

  try {
    const priceResp = (await fetchBinance(`/api/v3/ticker/price?symbol=${encodeURIComponent(pair)}`)) as PriceResp;
    const rate = Number(priceResp.price);
    const outputAmount = amount * rate;
    return NextResponse.json({
      ok: true as const,
      data: { pair, rate, inputAmount: amount, outputAmount },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false as const,
        message: error instanceof Error ? error.message : "Failed to fetch swap quote",
      },
      { status: 502 },
    );
  }
}
