import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { sanitizeSymbol } from "@/lib/binance";

export const dynamic = "force-dynamic";

type CryptoOrder = {
  id: string;
  userId: string;
  symbol: string;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT";
  quantity: number;
  price: number | null;
  status: "FILLED";
  createdAt: string;
};

const cryptoOrdersByUser = new Map<string, CryptoOrder[]>();

export async function GET() {
  try {
    const user = await requireSessionUser();
    const data = cryptoOrdersByUser.get(user.id) ?? [];
    return NextResponse.json({ ok: true as const, data });
  } catch {
    return NextResponse.json({ ok: false as const, message: "Unauthenticated" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ ok: false as const, message: "Invalid JSON" }, { status: 400 });
  }

  const payload = body as {
    symbol?: string;
    side?: "BUY" | "SELL";
    orderType?: "MARKET" | "LIMIT";
    quantity?: number;
    price?: number;
  };

  const symbol = sanitizeSymbol(payload.symbol ?? "");
  const side = payload.side;
  const orderType = payload.orderType;
  const quantity = Number(payload.quantity);
  const price = payload.price === undefined || payload.price === null ? null : Number(payload.price);

  if (!symbol || !symbol.endsWith("USDT")) {
    return NextResponse.json({ ok: false as const, message: "Invalid symbol (expected e.g. BTCUSDT)" }, { status: 422 });
  }
  if (side !== "BUY" && side !== "SELL") {
    return NextResponse.json({ ok: false as const, message: "Invalid side" }, { status: 422 });
  }
  if (orderType !== "MARKET" && orderType !== "LIMIT") {
    return NextResponse.json({ ok: false as const, message: "Invalid order type" }, { status: 422 });
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json({ ok: false as const, message: "Quantity must be positive" }, { status: 422 });
  }
  if (orderType === "LIMIT" && (!Number.isFinite(price) || (price ?? 0) <= 0)) {
    return NextResponse.json({ ok: false as const, message: "Limit price must be positive" }, { status: 422 });
  }

  const order: CryptoOrder = {
    id: `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    userId: user.id,
    symbol,
    side,
    orderType,
    quantity,
    price,
    status: "FILLED",
    createdAt: new Date().toISOString(),
  };

  const prev = cryptoOrdersByUser.get(user.id) ?? [];
  cryptoOrdersByUser.set(user.id, [order, ...prev].slice(0, 200));
  return NextResponse.json({ ok: true as const, data: order }, { status: 201 });
}
