import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/response";
import { clientKey, isRateLimited } from "@/lib/api/rateLimit";
import { fetchNseEquitySnapshot } from "@/lib/nseMarket";
import { isValidSymbol, normalizeSymbol } from "@/lib/validation/symbol";
import type { MarketStock } from "@/types/market";

export const dynamic = "force-dynamic";

const WINDOW_MS = 60_000;
const MAX_REQ = 40;
const MAX_SYMBOLS = 25;
const BATCH = 8;

export async function POST(request: NextRequest) {
  if (isRateLimited(clientKey(request, "market-quotes-post"), MAX_REQ, WINDOW_MS)) {
    return jsonError("Too many requests. Try again shortly.", 429, "RATE_LIMIT");
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400, "INVALID_JSON");
  }
  const rawList =
    body &&
    typeof body === "object" &&
    "symbols" in body &&
    Array.isArray((body as { symbols: unknown }).symbols)
      ? (body as { symbols: unknown[] }).symbols
      : null;
  if (!rawList) {
    return jsonError('Body must include symbols: string[].', 422, "VALIDATION");
  }
  const normalized: string[] = [];
  for (const item of rawList.slice(0, MAX_SYMBOLS)) {
    if (typeof item !== "string") {
      return jsonError("Each symbol must be a string.", 422, "VALIDATION");
    }
    const s = normalizeSymbol(item);
    if (!isValidSymbol(s)) {
      return jsonError(`Invalid symbol: ${item}`, 422, "VALIDATION");
    }
    if (!normalized.includes(s)) {
      normalized.push(s);
    }
  }
  if (normalized.length === 0) {
    return jsonError("Provide at least one symbol.", 422, "VALIDATION");
  }

  const quotes: MarketStock[] = [];
  const errors: Array<{ symbol: string; message: string }> = [];
  for (let i = 0; i < normalized.length; i += BATCH) {
    const slice = normalized.slice(i, i + BATCH);
    const settled = await Promise.allSettled(slice.map((sym) => fetchNseEquitySnapshot(sym)));
    settled.forEach((r, idx) => {
      const sym = slice[idx];
      if (r.status === "fulfilled") {
        quotes.push(r.value);
      } else {
        errors.push({
          symbol: sym,
          message: r.reason instanceof Error ? r.reason.message : "Quote failed",
        });
      }
    });
  }

  return NextResponse.json({
    ok: true as const,
    requested: normalized,
    quotes,
    errors,
    asOf: new Date().toISOString(),
  });
}
