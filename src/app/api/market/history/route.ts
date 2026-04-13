import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/response";
import { fetchNseHistory } from "@/lib/nseMarket";
import { isValidSymbol, normalizeSymbol } from "@/lib/validation/symbol";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const raw = normalizeSymbol(searchParams.get("symbol") ?? "RELIANCE");
  if (!isValidSymbol(raw)) {
    return jsonError("Invalid symbol.", 400, "VALIDATION");
  }
  const daysRaw = Number(searchParams.get("days") ?? 90);
  const days = Math.min(365, Math.max(1, Number.isFinite(daysRaw) ? Math.floor(daysRaw) : 90));
  try {
    const data = await fetchNseHistory(raw, days);
    return NextResponse.json({
      ok: true as const,
      symbol: raw,
      data,
      asOf: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false as const,
        symbol: raw,
        data: [] as const,
        message: error instanceof Error ? error.message : "Failed to fetch history",
      },
      { status: 500 },
    );
  }
}
