import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/response";
import { fetchNseEquitySnapshot } from "@/lib/nseMarket";
import { isValidSymbol, normalizeSymbol } from "@/lib/validation/symbol";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("symbol") ?? "";
  const symbol = normalizeSymbol(raw);
  if (!symbol) {
    return jsonError("Query parameter symbol is required.", 422, "VALIDATION");
  }
  if (!isValidSymbol(symbol)) {
    return jsonError("Invalid symbol.", 422, "VALIDATION");
  }
  try {
    const data = await fetchNseEquitySnapshot(symbol);
    return NextResponse.json({ ok: true as const, data, asOf: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false as const,
        message: error instanceof Error ? error.message : "Failed to fetch quote",
      },
      { status: 502 },
    );
  }
}
