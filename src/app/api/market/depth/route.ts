import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/response";
import { fetchNseDepth } from "@/lib/nseMarket";
import { isValidSymbol, normalizeSymbol } from "@/lib/validation/symbol";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const raw = normalizeSymbol(request.nextUrl.searchParams.get("symbol") ?? "RELIANCE");
  if (!isValidSymbol(raw)) {
    return jsonError("Invalid symbol.", 400, "VALIDATION");
  }
  try {
    const data = await fetchNseDepth(raw);
    return NextResponse.json({ ok: true as const, data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false as const,
        message: error instanceof Error ? error.message : "Failed to fetch depth",
      },
      { status: 500 },
    );
  }
}
