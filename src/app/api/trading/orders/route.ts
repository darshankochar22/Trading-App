import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/response";
import { clientKey, isRateLimited } from "@/lib/api/rateLimit";
import { getCommodityQuotes } from "@/lib/commodityMarket";
import { fetchNseEquitySnapshot } from "@/lib/nseMarket";
import { requireSessionUser } from "@/lib/auth";
import { listOrdersDb, placeOrderDb } from "@/lib/tradingDb";
import { parsePlaceOrderBody } from "@/lib/validation/trading";
import type { MarketStock } from "@/types/market";

export const dynamic = "force-dynamic";

const POST_WINDOW_MS = 60_000;
const POST_MAX = 40;

export async function GET() {
  try {
    const user = await requireSessionUser();
    const data = await listOrdersDb(user.id);
    return NextResponse.json({ ok: true as const, data });
  } catch {
    return NextResponse.json({ ok: false as const, message: "Unauthenticated" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  if (isRateLimited(clientKey(request, "orders-post"), POST_MAX, POST_WINDOW_MS)) {
    return jsonError("Too many requests. Try again shortly.", 429, "RATE_LIMIT");
  }
  let user;
  try {
    user = await requireSessionUser();
  } catch {
    return NextResponse.json({ ok: false as const, message: "Unauthenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400, "INVALID_JSON");
  }

  const parsed = parsePlaceOrderBody(body);
  if (!parsed.ok) {
    return jsonError(parsed.message, 422, "VALIDATION");
  }

  const req = parsed.value;
  try {
    let map = new Map<string, MarketStock>();
    const segment = req.segment ?? "EQUITY";
    if (segment === "COMMODITY") {
      const commodities = getCommodityQuotes();
      map = new Map(
        commodities.map((c) => [
          c.symbol,
          {
            symbol: c.symbol,
            companyName: c.symbol,
            lastPrice: c.lastPrice,
            change: 0,
            pChange: 0,
            dayHigh: c.lastPrice,
            dayLow: c.lastPrice,
            totalTradedValue: 0,
          },
        ]),
      );
    } else {
      const snapshot = await fetchNseEquitySnapshot(req.symbol);
      map = new Map([[snapshot.symbol, snapshot]]);
    }
    const data = await placeOrderDb({
      userId: user.id,
      symbol: req.symbol,
      side: req.side,
      quantity: req.quantity,
      orderType: req.orderType,
      limitPrice: req.limitPrice,
      marketMap: map,
    });
    return NextResponse.json({ ok: true as const, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false as const,
        message: error instanceof Error ? error.message : "Failed to place order",
      },
      { status: 400 },
    );
  }
}
