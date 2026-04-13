import { NextRequest, NextResponse } from "next/server";
import { fetchMutualFundMetrics } from "@/lib/nseMarket";
import type { MutualFundMetrics } from "@/types/market";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const codesRaw = request.nextUrl.searchParams.get("codes") ?? "";
  const codes = codesRaw
    .split(",")
    .map((c) => c.trim())
    .filter((c) => /^\d+$/.test(c))
    .slice(0, 30);

  if (!codes.length) {
    return NextResponse.json({ ok: true as const, data: {} as Record<string, MutualFundMetrics> });
  }

  const settled = await Promise.allSettled(codes.map((code) => fetchMutualFundMetrics(code)));
  const data: Record<string, MutualFundMetrics> = {};
  settled.forEach((item, idx) => {
    if (item.status !== "fulfilled" || !item.value) return;
    data[codes[idx]] = item.value;
  });

  return NextResponse.json({ ok: true as const, data, asOf: new Date().toISOString() });
}

