import { NextRequest, NextResponse } from "next/server";
import { getSpotPrice } from "@/lib/cryptoMarket";
import { sanitizeSymbol } from "@/lib/binance";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const fromAsset = sanitizeSymbol(url.searchParams.get("from") ?? "BTC");
  const toAsset = sanitizeSymbol(url.searchParams.get("to") ?? "USDT");
  const amount = Number(url.searchParams.get("amount") ?? 1);

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ ok: false as const, message: "Amount must be positive" }, { status: 400 });
  }

  try {
    const result = await getSpotPrice(fromAsset, toAsset);
    const rate = result.rate;
    const outputAmount = amount * rate;
    return NextResponse.json({
      ok: true as const,
      provider: result.provider,
      data: { pair: result.pair, rate, inputAmount: amount, outputAmount },
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
