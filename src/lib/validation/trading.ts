import type { PlaceOrderRequest } from "@/types/trading";

export type ParsePlaceOrderResult =
  | { ok: true; value: PlaceOrderRequest }
  | { ok: false; message: string };

export function parsePlaceOrderBody(body: unknown): ParsePlaceOrderResult {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Request body must be a JSON object." };
  }
  const o = body as Record<string, unknown>;
  const symbol = typeof o.symbol === "string" ? o.symbol : "";
  const side = o.side === "BUY" || o.side === "SELL" ? o.side : null;
  const orderType = o.orderType === "MARKET" || o.orderType === "LIMIT" ? o.orderType : null;
  const segment =
    o.segment === "EQUITY" || o.segment === "COMMODITY" ? o.segment : undefined;
  const instrument =
    o.instrument === "CASH" || o.instrument === "FUTURES" || o.instrument === "OPTIONS"
      ? o.instrument
      : undefined;

  if (!symbol.trim()) {
    return { ok: false, message: "symbol is required." };
  }
  if (!side) {
    return { ok: false, message: "side must be BUY or SELL." };
  }
  if (!orderType) {
    return { ok: false, message: "orderType must be MARKET or LIMIT." };
  }

  const rawQty = o.quantity;
  const q = typeof rawQty === "number" ? rawQty : Number(rawQty);
  if (!Number.isFinite(q) || q !== Math.trunc(q) || q < 1) {
    return { ok: false, message: "quantity must be a positive integer." };
  }

  let limitPrice: number | undefined;
  if (orderType === "LIMIT") {
    const lp = o.limitPrice;
    const l = typeof lp === "number" ? lp : Number(lp);
    if (!Number.isFinite(l) || l <= 0) {
      return { ok: false, message: "limitPrice must be a positive number for LIMIT orders." };
    }
    limitPrice = l;
  }

  const value: PlaceOrderRequest = {
    symbol,
    segment,
    instrument,
    side,
    quantity: q,
    orderType,
    ...(limitPrice !== undefined ? { limitPrice } : {}),
  };
  return { ok: true, value };
}
